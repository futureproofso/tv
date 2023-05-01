const path = require('path');
const { Sequelize, Model, DataTypes } = require('sequelize');
const crypto = require("hypercore-crypto");
const { directory } = require('./setup');

const db = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(directory, 'private.sqlite'), // this can fail without throwing an error
  logging: false
});

const Account = db.define('Account', {
  seed: DataTypes.TEXT
});

const Username = db.define('Username', {
  appName: DataTypes.TEXT,
  username: DataTypes.TEXT
});

async function setup() {
  // remove for prod and handle schema migrations.
  await db.sync({ force: true });
}

async function getSeed() {
  const [row, created] = await Account.findOrCreate({
    where: {id: 1},
    defaults: { seed: crypto.randomBytes(32).toString("hex") }
  })
  return { seed: row.seed, created };
}

async function setUsername(appName, username) {
  const [row, _] = await Username.upsert({
    appName,
    username
  });
}

module.exports = {
  getSeed,
  setup,
  setUsername
};
