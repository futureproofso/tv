const { Sequelize, Model, DataTypes } = require('sequelize');
const crypto = require("hypercore-crypto");

const db = new Sequelize({
  dialect: 'sqlite',
  storage: './storage/private.sqlite',
  logging: false
});

const Account = db.define('Account', {
  seed: DataTypes.TEXT
});

const Username = db.define('Username', {
  app: DataTypes.TEXT,
  username: DataTypes.TEXT
});

async function setup() {
  // remove for prod and handle schema migrations.
  await db.sync({ force: false });
}

async function getSeed() {
  const [row, created] = await Account.findOrCreate({
    where: {id: 1},
    defaults: { seed: crypto.randomBytes(32).toString("hex") }
  })
  return { seed: row.seed, created };
}

async function setUsername(app, username) {
  const [row, _] = await Username.upsert({
    app,
    username
  });
}

module.exports = {
  getSeed,
  setup,
  setUsername
};
