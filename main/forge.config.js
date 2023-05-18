const path = require("path");
const { promises: fs } = require("fs");

const env = require('./env.js');

const identity = env.APPLE_CODESIGN_IDENTITY;
const appleId = env.APPLE_ID;
const appleIdPassword = env.APPLE_PASSWORD;
const teamId = env.APPLE_TEAM_ID;

/**
 * Copies a directory into a new location recursively.
 *
 * @param {string} src Path to directory you want to copy
 * @param {string} dest New location name for directory being created
 */
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  let entries = await fs.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? await copyDir(srcPath, destPath)
      : await fs.copyFile(srcPath, destPath);
  }
}

module.exports = {
  packagerConfig: {
    ignore: [
      "test",
      "storage",
      "moment-timezone-data",
      "env.js",
      "node_modules/dotenv",
    ],
    prune: true,
    osxSign: {
      identity
    },
    osxNotarize: {
      tool: "notarytool",
      appleId,
      appleIdPassword,
      teamId,
    },
  },
  rebuildConfig: {
    force: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "futureproofso",
          name: "tv",
        },
        prerelease: false,
      },
    },
  ],
  hooks: {
    packageAfterPrune: async (
      forgeConfig,
      buildPath,
      electronVersion,
      platform,
      arch
    ) => {
      const dotenvSrc = "node_modules/dotenv";
      const dotenvOut = path.resolve(buildPath, "node_modules/dotenv");
      const momentSrc = (subdir) => {
        return `./moment-timezone-data/${subdir}/latest.json`;
      };
      const momentOut = (subdir) => {
        return path.resolve(
          buildPath,
          `node_modules/moment-timezone/data/${subdir}/latest.json`
        );
      };
      const prodEnvSrc = ".env.prod";
      const prodEnvOut = path.resolve(buildPath, ".env.prod");
      const sqlite3BuildPath = path.resolve(
        buildPath,
        "node_modules/sqlite3/build"
      );
      return new Promise(async (resolve, reject) => {
        await copyDir(dotenvSrc, dotenvOut);
        await fs.copyFile(prodEnvSrc, prodEnvOut);
        await fs.copyFile(momentSrc("meta"), momentOut("meta"));
        await fs.copyFile(momentSrc("packed"), momentOut("packed"));
        await fs.rm(sqlite3BuildPath, {
          recursive: true,
          force: true,
        });
        resolve();
      });
    },
  },
};
