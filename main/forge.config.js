module.exports = {
  packagerConfig: {
    ignore: ['test', 'storage', 'moment-timezone-data'],
    prune: true,
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    }
  },
  rebuildConfig: {
    force: false
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'futureproofso',
          name: 'tv'
        },
        prerelease: false
      }
    }
  ],
  hooks: {
    packageAfterPrune: async (forgeConfig, buildPath, electronVersion, platform, arch) => {
      console.log('running after prune...');
      const path = require('path')
      const fs = require('fs')
      const source = (subdir) => `./moment-timezone-data/${subdir}/latest.json`;
      const dest = (subdir) => `node_modules/moment-timezone/data/${subdir}/latest.json`;
      return new Promise((resolve, reject) => {
        fs.copyFileSync(source('meta'), path.resolve(buildPath, dest('meta')));
        fs.copyFileSync(source('packed'), path.resolve(buildPath, dest('packed')));
        resolve();
      })
    },
  }
};
