import assert from "assert";
import b4a from "b4a";
import { createHash } from "crypto";
import Hyperswarm from "hyperswarm";
import express from "express";
import goodbye from "graceful-goodbye";
import Gun from "gun";
import path from "path";

import { pino, dbLogger, logger, netLogger } from "./log.mjs";

global.Gun = Gun; /// make global to `node --inspect` - debug only

const PORT = 8080;
// const USERNAME = "Buoy";
const APP_NAME = process.argv[2];
assert(APP_NAME, "Missing APP_NAME. Did you pass it as a process argument?");
const file = path.resolve("./data");

let gun;
const peers = [];

const app = express();
app.use(Gun.serve);
app.use(pino);

const web = app.listen(PORT, () => {
  logger.info(`server listening on port (${PORT}) ...`);
});

resetGun({ file, web, peers });
const swarm = setupNetwork();
joinNetwork(swarm);

function setupNetwork() {
  const swarm = new Hyperswarm({ maxPeers: 31 });
  goodbye(() => swarm.destroy());

  const publicKey = b4a.toString(swarm.keyPair.publicKey, "hex");
  netLogger.info(`swarm configured with publicKey (${publicKey})`);

  swarm.on("connection", (stream, peerInfo) => {
    const remotePublicKey = {
      full: b4a.toString(peerInfo.publicKey, "hex"),
      nick: b4a.toString(peerInfo.publicKey, "hex").substring(0, 5),
    };
    netLogger.info(`swarm connected to (${remotePublicKey.full})`);
    const remoteAddress = `http://${stream.rawStream.remoteHost}:1337/gun`;
    peers.push(remoteAddress);

    resetGun({ file, web, peers });

    stream.once("close", () => {
      peers.splice(peers.indexOf(remoteAddress), 1);
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

  return swarm;
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
  gun = Gun(config);
  global.gun = gun; /// make global to `node --inspect` - debug only

  watchUsernames();
}

function watchUsernames() {
  dbLogger.debug("watching usernames ...");
  gun.get(`${APP_NAME}-usernames`).on((data, key) => {
    delete data._;
    dbLogger.debug(data);
  });
}
