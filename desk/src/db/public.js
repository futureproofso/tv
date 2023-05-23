const path = require("path");

const Gun = require("gun");

const { directory } = require("./setup");
const assert = require("assert");
const { createServer } = require("http");

class Database {
  port;
  peerAddresses;
  db;
  _phoneBook;

  constructor({ port }) {
    this.port = port;
    this.peerAddresses = [];
    this._phoneBook = {};
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

  addSyncPeer({ remotePublicKey, remoteHost }) {
    // This will break if we have multiple peers behind a single host
    // They need to use different db ports and tell their peers which port they
    // are using
    const remoteAddress = `http://${remoteHost}:1337/gun`;
    this.peerAddresses.push(remoteAddress);
    this.db.opt({ peers: this.peerAddresses });
  }

  removeSyncPeer({ remotePublicKey, remoteHost }) {
    // Only remove if there are no peers left behind this host
    this.peerAddresses.splice(this.peerAddresses.indexOf(remoteHost), 1);
    this.db.opt({ peers: this.peerAddresses });
  }

  async getUsername({ appName, publicKey }, bypassPhonebook = false) {
    if (bypassPhonebook) {
      return await this._getUsername({ appName, publicKey });
    }

    let entry = this._phoneBook[publicKey];
    if (!entry) {
      this._phoneBook[publicKey] = {
        attempts: 1,
      };
      entry = this._phoneBook[publicKey];
    }

    if (entry.username) {
      return entry.username;
    } else {
      if (entry.attempts < 2) {
        entry.attempts++;
      } else {
        return publicKey;
      }
    }

    this._getUsername({ appName, publicKey });
    return publicKey;
  }

  async _getUsername({ appName, publicKey }) {
    let entry = this._phoneBook[publicKey];
    if (!entry) {
      this._phoneBook[publicKey] = {};
      entry = this._phoneBook[publicKey];
    }
    return new Promise((resolve, reject) => {
      this.db.get(`${appName}-usernames`)
        .get(publicKey)
        .once((value) => {
          entry.username = value;
          entry.lastUpdated = Date.now();
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
