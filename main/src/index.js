const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const Hyperswarm = require('hyperswarm');
const goodbye = require('graceful-goodbye');
const b4a = require('b4a');
const { createHash } = require("crypto");
const { Sequelize } = require('sequelize');

const api = require('./api');
const { setupDb, getSeed } = require('./db/private');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

async function p2p(mainWindow, seed) {
  const swarm = new Hyperswarm({ seed: b4a.from(seed, 'hex'), maxPeers: 31 });

  const peerPublicKey = b4a.toString(swarm.keyPair.publicKey, 'hex');
  console.log('peer public key:', peerPublicKey);

  goodbye(() => swarm.destroy());

  // Keep track of all connections and console.log incoming data
  const conns = [];
  swarm.on("connection", (conn) => {
    const name = b4a.toString(conn.remotePublicKey, "hex");
    console.log("* got a connection from:", name, "*");
    conns.push(conn);
    conn.once("close", () => conns.splice(conns.indexOf(conn), 1));
    conn.on("data", (data) => {
      const message = b4a.toString(data, "utf-8");
      const id = createHash("md5")
        .update(`n:${name}:m:${message}:t:${Date.now()}`)
        .digest("hex");
      mainWindow.webContents.send(
        "got-message",
        JSON.stringify({ id, from: name, message })
      );
    });
    conn.on("error", console.error);
  });

  // const core = new Hypercore('./storage');
  const core = null

  // // core.key and core.discoveryKey will only be set after core.ready resolves
  // await core.ready()
  // console.log('hypercore key:', b4a.toString(core.key, 'hex'))

  // // Append all stdin data as separate blocks to the core
  // // process.stdin.on('data', data => core.append(data))

  // const foundPeers = core.findingPeers()

  // // core.discoveryKey is *not* a read capability for the core
  // // It's only used to discover other peers who *might* have the core
  // swarm.join(core.discoveryKey)
  // swarm.on('connection', conn => core.replicate(conn))

  // // swarm.flush() will wait until *all* discoverable peers have been connected to
  // // It might take a while, so don't await it
  // // Instead, use core.findingPeers() to mark when the discovery process is completed
  // swarm.flush().then(() => foundPeers())

  ipcMain.on('set-space', (event, ...args) => {
    const alias = args[0];
    api.setSpace(event, core, alias);
    const topic = createHash("sha256").update(alias, "utf-8").digest();
    const discovery = swarm.join(topic, { client: true, server: true });
    // The flushed promise will resolve when the topic has been fully announced to the DHT
    discovery
      .flushed()
      .then(() => {
        console.log("joined topic:", topic.toString("hex"));
        const metadata = {
          topic: topic.toString("hex"),
          alias,
          error: null,
          config: null, // get this from db
        };
      })
      .catch(console.error);
  });
  ipcMain.on('set-username', (event, ...args) => api.setUsername(event, core, peerPublicKey, ...args));
  ipcMain.on("send-message", async (event, args) => {
    conns.forEach((conn) => {
      const message = b4a.from(args, "utf-8");
      conn.write(message);
    });
  });

  // This won't resolve until either
  //    a) the first peer is found
  // or b) no peers could be found
  // await core.update();

  // let position = core.length;
  // console.log(`Skipping ${core.length} earlier blocks...`);
  // for await (const block of core.createReadStream({ start: core.length, live: true })) {
  //   // console.log(`Block ${position++}: ${block}`);
  //   mainWindow.webContents.send('got-username', `${block}`);
  // }
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
    setupDb().then(async () => {
      const seed = await getSeed()
      p2p(mainWindow, seed);
    }).catch(console.error);
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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
