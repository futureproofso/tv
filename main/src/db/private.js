const { Sequelize, Model, DataTypes } = require('sequelize');
const crypto = require("hypercore-crypto");

const db = new Sequelize({
  dialect: 'sqlite',
  storage: './db/private.sqlite',
  logging: false
});

const Account = db.define('Account', {
  seed: DataTypes.TEXT
});

async function setupDb() {
  // remove for prod and handle schema migrations.
  await db.sync({ force: false });
}

async function getSeed() {
  const [row, created] = await Account.findOrCreate({
    where: {id: 1},
    defaults: { seed: crypto.randomBytes(32).toString("hex") }
  })
  return row.seed;
}

module.exports = {
  getSeed,
  setupDb
};
