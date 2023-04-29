module.exports = {
  packagerConfig: {
    ignore: ['test', 'storage', 'moment-timezone-data'],
    prune: true,
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
          name: 'gtfol-app'
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
