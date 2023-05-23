const { mkdirSync } = require("fs");
const path = require("path");
const { app } = require("electron");

const directory = path.resolve(app.getAppPath(), "storage");

function setup() {
  try {
    mkdirSync(directory);
  } catch (error) {
    if (error.code === "EEXIST") {
      // pass
    } else {
      throw error;
    }
  }
  return directory;
}

module.exports = {
  directory,
  setup,
};
