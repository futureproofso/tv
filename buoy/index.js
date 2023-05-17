const assert = require("assert");
const b4a = require("b4a");
const { createHash } = require("crypto");
const Hyperswarm = require("hyperswarm");
const express = require("express");
const goodbye = require("graceful-goodbye");
const Gun = require("gun");
const path = require("path");

const { pino, dbLogger, logger, netLogger } = require("./log.js");
const utils = require("./utils.js");

global.Gun = Gun; /// make global to `node --inspect` - debug only

const PORT = 8080;
// const USERNAME = "Buoy";
const APP_NAME = process.argv[2];
assert(APP_NAME, "Missing APP_NAME. Did you pass it as a process argument?");
const file = path.resolve("./data");

const handlers = [];
let gun;
const peers = [];
const peerAddresses = [];

const app = express();
app.use(Gun.serve);
app.use(pino);
const web = app.listen(PORT, () => {
  logger.info(`server listening on port (${PORT}) ...`);
});

resetGun({ file, web, peerAddresses });

const { swarm, publicKey } = setupNetwork();
joinNetwork(swarm);
startMessaging(publicKey);

goodbye(() => {
  logger.info("BUOY IS SHUTTING DOWN 👋 ...");
  swarm.destroy();
  web.close((err) => {
    gun && gun.off();
    if (err) {
      logger.error(err);
      process.exit();
    }
  });
});

function setupNetwork() {
  const swarm = new Hyperswarm({ maxPeers: 31 });

  const publicKey = b4a.toString(swarm.keyPair.publicKey, "hex");
  netLogger.info(`swarm configured with publicKey (${publicKey})`);

  swarm.on("connection", (stream, peerInfo) => {
    peers.push(stream);
    const remotePublicKey = {
      full: b4a.toString(peerInfo.publicKey, "hex"),
      nick: b4a.toString(peerInfo.publicKey, "hex").substring(0, 5),
    };
    netLogger.info(`swarm connected to (${remotePublicKey.full})`);
    const remoteAddress = `http://${stream.rawStream.remoteHost}:1337/gun`;
    peerAddresses.push(remoteAddress);

    resetGun({ file, web, peerAddresses });

    stream.once("close", () => {
      peerAddresses.splice(peerAddresses.indexOf(remoteAddress), 1);
      peers.splice(peers.indexOf(stream), 1);
      netLogger.info(`peer connection closed (${remotePublicKey.full})`);
    });

    stream.on("data", async (data) => {
      const body = b4a.toString(data, "utf-8");
      netLogger.child({ body }).debug(`peer sent data (${remotePublicKey.full})`);
    });

    stream.on("error", (error) => {
      netLogger.child({ error }).info(`peer connection error (${remotePublicKey.full})`);
    });
  });

  return { swarm, publicKey };
}

function joinNetwork(swarm) {
  const topic = createHash("sha256").update(APP_NAME, "utf-8").digest();
  const topicHash = topic.toString("hex");
  netLogger.debug(`joining topic (${topicHash})`);
  const discovery = swarm.join(topic, { client: true, server: true });
  // The flushed promise will resolve when the topic has been fully announced to the DHT
  discovery
    .flushed()
    .then(() => {
      netLogger.info(`joined topic (${topicHash})`);
    })
    .catch((error) => {
      netLogger.child({ error }).error(`join topic error (${topicHash})`);
    });
}

function resetGun(config) {
  config.peers = config.peerAddresses;
  delete config.peerAddresses;

  gun && gun.off();
  gun = Gun(config);
  global.gun = gun; /// make global to `node --inspect` - debug only

  watchUsernames();
}

async function startMessaging(publicKey) {
  await utils.delay(1000);

  // publish username
  gun.get(`${APP_NAME}-usernames`).put({
    [publicKey]: `buoy.${APP_NAME}`,
  });

  await utils.delay(1000);

  // message peers
  process.stdin.on("data", (data) => {
    peers.forEach((peer) => {
      peer.write(data);
    });
  });
}

function watchUsernames() {
  dbLogger.debug("watching usernames ...");
  function handler(data, key) {
    delete data._;
    dbLogger.debug(data);
  }
  gun.get(`${APP_NAME}-usernames`).on(handler);
  return handler;
}
