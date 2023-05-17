const path = require("path");

const Hyperswarm = require("hyperswarm");
const goodbye = require("graceful-goodbye");
const b4a = require("b4a");
const Gun = require("gun");

const { directory } = require("./setup");
const assert = require("assert");
const { createServer } = require("http");

class Database {
  port;
  peerAddresses;
  db;

  constructor({ port }) {
    this.port = port;
    this.peerAddresses = [];
  }

  setup({ prefix }) {
    assert(prefix, "Missing prefix. Was it passed to setup?");
    this.prefix = prefix;
    const server = createServer(Gun.serve(__dirname)).listen(this.port, () => {
      console.log(`Gun: Relay peer started on port ${this.port} with /gun`);
    });
    const file = path.resolve(directory, "public");
    this.db = Gun({ file, web: server });
  }

  addPeer({ remotePublicKey, remoteHost }) {
    // This will break if we have multiple peers behind a single host
    // They need to use different db ports and tell their peers which port they
    // are using
    const remoteAddress = `http://${remoteHost}:1337/gun`;
    this.peerAddresses.push(remoteAddress);
    this.db.opt({ peers: this.peerAddresses });
  }

  removePeer({ remotePublicKey, remoteHost }) {
    // Only remove if there are no peers left behind this host
    this.peerAddresses.splice(this.peerAddresses.indexOf(remoteHost), 1);
    this.db.opt({ peers: this.peerAddresses });
  }

  async getUsername({ appName, publicKey }) {
    return new Promise((resolve, reject) => {
      this.db.get(`${appName}-usernames`)
        .get(publicKey)
        .once((value) => {
          resolve(value);
        });
    });
  }

  publishUsername({ appName, publicKey, username }) {
    this.db.get(`${appName}-usernames`).put({
      [publicKey]: username,
    });
  }
}

module.exports = {
  PublicDb: Database,
};
