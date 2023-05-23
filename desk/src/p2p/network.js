const Hyperswarm = require("hyperswarm");
const goodbye = require("graceful-goodbye");
const b4a = require("b4a");
const ipcChannels = require("../renderer/channels").default;
const { createHash } = require("crypto");

class Network {
  swarm;
  publicKey;
  peers = []; // Streams
  db;
  gui;
  appName;
  peerCountInterval;

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
    goodbye(() => {
      clearInterval(this.peerCountInterval);
      this.swarm.destroy();
    });
    this.peerCountInterval = this.startPeerCountInterval();
  }

  setup(appName) {
    this.appName = appName;

    this.swarm.on("connection", (stream, peerInfo) => {
      const remotePublicKey = {
        full: b4a.toString(peerInfo.publicKey, "hex"),
        nick: b4a.toString(peerInfo.publicKey, "hex").substring(0, 5),
      };
      const remoteHost = stream.rawStream.remoteHost;
      console.log("* swarm.on connection", remotePublicKey.full, "*");

      this.peers.push(stream);

      this.db.addSyncPeer({ remotePublicKey, remoteHost });

      stream.once("close", () => {
        console.log("* connection close", remotePublicKey.full, "*");
        this.removePeer(stream, remotePublicKey, remoteHost);
      });

      stream.on("data", async (data) => {
        console.log("* connection data", remotePublicKey.full, data.length, "*");
        const message = await this.handleMessage({ senderPublicKey: remotePublicKey.full, message: data });
        this.gui.send(ipcChannels.GOT_MESSAGE, message);
      });

      stream.on("error", (error) => {
        console.error("* connection error", remotePublicKey.full, error, "*");
        this.removePeer(stream, remotePublicKey, remoteHost);
      });
    });
  }

  removePeer(stream, remotePublicKey, remoteHost) {
    this.peers.splice(this.peers.indexOf(stream), 1);
    this.db.removeSyncPeer({ remotePublicKey, remoteHost });
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

  async handleMessage({senderPublicKey, message}) {
    const body = b4a.toString(message, "utf-8");
    const id = createHash("md5")
      .update(`f:${senderPublicKey}:b:${message}:t:${Date.now()}`)
      .digest("hex");
    const from = await this.db.getUsername({appName: this.appName, publicKey: senderPublicKey });
    return { from, id, body };
  }

  messagePeers(message) {
    this.peers.forEach((conn) => {
      conn.write(message);
    });
  }

  startPeerCountInterval() {
    const threeSeconds = 3000;
    return setInterval(() => {
      this.gui.send(ipcChannels.GOT_PEER_COUNT, this.peerCount());
    }, threeSeconds);
  }

  /**
   * Peers connected to the network topic (including self)
   * @returns Number of peers connected
   */
  peerCount() {
    return 1 + this.peers.length;
  }
}

module.exports = {
  Network,
};
