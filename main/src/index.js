const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');

const Hyperswarm = require('hyperswarm');
const goodbye = require('graceful-goodbye');
const b4a = require('b4a');
const { createHash } = require("crypto");
const { Sequelize } = require('sequelize');

require('./db/setup').setup();
const privateDb = require('./db/private');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const usernameCache = {};

async function main(mainWindow, { isNew, seed }) {
  // const p2p = new BrowserView({
  //   webPreferences: {
  //     preload: path.join(__dirname, 'p2p/preload.js'),
  //   },
  // });
  const swarm = new Hyperswarm({ seed: b4a.from(seed, 'hex'), maxPeers: 31 });

  const peerPublicKey = b4a.toString(swarm.keyPair.publicKey, 'hex');
  console.log('peer public key:', peerPublicKey);

  goodbye(() => swarm.destroy());

  mainWindow.webContents.send('got-username', null, peerPublicKey);

  // Keep track of all connections and console.log incoming data
  const conns = [];
  swarm.on("connection", (conn) => {
    const remotePublicKey = b4a.toString(conn.remotePublicKey, "hex");
    console.log("* got a connection from:", remotePublicKey, "*");
    conns.push(conn);

    conn.once("close", () => conns.splice(conns.indexOf(conn), 1));

    conn.on("data", async (data) => {
      const message = b4a.toString(data, "utf-8");
      const id = createHash("md5")
        .update(`n:${remotePublicKey}:m:${message}:t:${Date.now()}`)
        .digest("hex");

      if (!usernameCache[remotePublicKey]) {
        usernameCache[remotePublicKey] = {
          username: undefined,
          lookupAttempts: 0
        }
      }
      if (
        !usernameCache[remotePublicKey].username
        && usernameCache[remotePublicKey].lookupAttempts < 2
      ) {
        usernameCache[remotePublicKey].lookupAttempts++;
        const data = await swarm.dht.mutableGet(conn.remotePublicKey);
        usernameCache[remotePublicKey].username = data.value.toString('utf8');
      }

      mainWindow.webContents.send('got-message', JSON.stringify({
          id,
          from: usernameCache[remotePublicKey].username || remotePublicKey,
          message
        })
      );
    });

    conn.on("error", console.error);
  });

  ipcMain.on('set-space', (event, appName) => {
    mainWindow.setTitle(appName);
    const topic = createHash("sha256").update(appName, "utf-8").digest();
    const discovery = swarm.join(topic, { client: true, server: true });
    // The flushed promise will resolve when the topic has been fully announced to the DHT
    discovery
      .flushed()
      .then(() => {
        console.log("joined topic:", topic.toString("hex"));
        const metadata = {
          topic: topic.toString("hex"),
          appName,
          error: null,
          config: null, // get this from db
        };
      })
      .catch(console.error);
  });

  ipcMain.on('set-username', (event, data) => {
    const { appName, username } = JSON.parse(data);
    console.log('setting username...')
    console.log('appName:', appName)
    console.log('username:', username)
    privateDb.setUsername(appName, username);
    // TODO: different keys for each app
    swarm.dht.mutablePut(swarm.keyPair, Buffer.from(username)).then(() => {
      console.log('published username');
    });
    mainWindow.webContents.send('got-username', appName, username);
  });

  ipcMain.on("send-message", async (event, args) => {
    conns.forEach((conn) => {
      const message = b4a.from(args, "utf-8");
      conn.write(message);
    });
  });
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html')).then(() => {
    privateDb.setup().then(async () => {
      const {seed, created} = await privateDb.getSeed()
      main(mainWindow, { isNew: created, seed }).then(() => {
        console.log('main complete');
      }).catch((err) => {
        console.error('caught from main', err);
        app.quit();
      });
    }).catch((error) => {
      console.error(error);
      app.quit();
    });
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
