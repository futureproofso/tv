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
  seed: DataTypes.TEXT,
});

const Settings = db.define('Settings', {
  metricsEnabled: DataTypes.BOOLEAN
});

const Username = db.define('Username', {
  appName: DataTypes.TEXT,
  username: DataTypes.TEXT
});

async function setup() {
  // remove for prod and handle schema migrations.
  await db.sync({ force: false });
}

async function getMetricsSelection() {
  const [row] = await Settings.findOrCreate({
    where: {id: 1},
    defaults: { metricsEnabled: true }
  });
  return { metricsEnabled: row.metricsEnabled };
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
  getMetricsSelection,
  getSeed,
  setup,
  setUsername
};
