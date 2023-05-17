const Hyperswarm = require("hyperswarm");
const goodbye = require("graceful-goodbye");
const b4a = require("b4a");
const { ipcChannels } = require("../renderer/channels").default;

class Network {
  swarm;
  publicKey;
  peers = []; // Streams
  db;
  gui;

  constructor({ seed, db, gui }) {
    const swarmConfig = {
      seed: seed ? b4a.from(seed, "hex") : undefined,
      maxPeers: 31,
    };
    this.db = db;
    this.gui = gui;
    this.swarm = new Hyperswarm(swarmConfig);
    this.publicKey = b4a.toString(this.swarm.keyPair.publicKey, "hex");
    console.log("* swarm publicKey", this.publicKey, "*");
    goodbye(() => this.swarm.destroy());
  }

  setup() {
    this.swarm.on("connection", (stream, peerInfo) => {
      const remotePublicKey = {
        full: b4a.toString(peerInfo.publicKey, "hex"),
        nick: b4a.toString(peerInfo.publicKey, "hex").substring(0, 5),
      };
      const remoteHost = stream.rawStream.remoteHost;
      console.log("* swarm.on connection", remotePublicKey.full, "*");

      this.peers.push(stream);

      this.db.addPeer({ remotePublicKey, remoteHost });

      stream.once("close", () => {
        console.log("* connection close", remotePublicKey.full, "*");
        this.peers.splice(this.peers.indexOf(stream), 1);
        this.db.removePeer({ remotePublicKey, remoteHost });
      });

      stream.on("data", async (data) => {
        console.log("* connection data", remotePublicKey.full, data, "*");
        const message = this.handleMessage(data, remotePublicKey.full);
        this.gui.send(ipcChannels.GOT_MESSAGE, JSON.stringify(message));
      });

      stream.on("error", (error) => {
        console.error("* connection error", remotePublicKey.full, error, "*");
        // call function to do error handling
      });
    });
  }

  join(topic) {
    const topicHash = topic.toString("hex");
    const discovery = this.swarm.join(topic, { client: true, server: true });
    // The flushed promise will resolve when the topic has been fully announced to the DHT
    discovery
      .flushed()
      .then(() => {
        console.log("* joined topic:", topicHash, "*");
      })
      .catch((error) => {
        console.error("* join error", topicHash, error, "*");
      });
  }

  handleMessage(message, from) {
    const body = b4a.toString(message, "utf-8");
    const id = createHash("md5")
      .update(`f:${from}:b:${message}:t:${Date.now()}`)
      .digest("hex");
    return { from, id, body };
  }

  messagePeers(message) {
    this.peers.forEach((conn) => {
      conn.write(message);
    });
  }

  peerCount() {
    return this.peers.length;
  }
}

module.exports = {
  Network,
};
