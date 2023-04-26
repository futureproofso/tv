const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const Hyperswarm = require('hyperswarm');
const Hypercore = require('hypercore');
const goodbye = require('graceful-goodbye');
const b4a = require('b4a');
const api = require('./api');

console.log(__dirname)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

async function startAddressBook(mainWindow) {
  const swarm = new Hyperswarm()
  const peerPublicKey = b4a.toString(swarm.keyPair.publicKey, "hex");
  console.log('peer public key', peerPublicKey);

  goodbye(() => swarm.destroy())

  const core = new Hypercore('./storage')

  // core.key and core.discoveryKey will only be set after core.ready resolves
  await core.ready()
  console.log('hypercore key:', b4a.toString(core.key, 'hex'))

  // Append all stdin data as separate blocks to the core
  // process.stdin.on('data', data => core.append(data))

  const foundPeers = core.findingPeers()

  // core.discoveryKey is *not* a read capability for the core
  // It's only used to discover other peers who *might* have the core
  swarm.join(core.discoveryKey)
  swarm.on('connection', conn => core.replicate(conn))

  // swarm.flush() will wait until *all* discoverable peers have been connected to
  // It might take a while, so don't await it
  // Instead, use core.findingPeers() to mark when the discovery process is completed
  swarm.flush().then(() => foundPeers())

  ipcMain.on('set-space', (event, ...args) => api.setSpace(event, core, ...args));
  ipcMain.on('set-username', (event, ...args) => api.setUsername(event, core, peerPublicKey, ...args));

  // This won't resolve until either
  //    a) the first peer is found
  // or b) no peers could be found
  await core.update();

  let position = core.length;
  console.log(`Skipping ${core.length} earlier blocks...`);
  for await (const block of core.createReadStream({ start: core.length, live: true })) {
    // console.log(`Block ${position++}: ${block}`);
    mainWindow.webContents.send('got-username', `${block}`);
  }
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
    startAddressBook(mainWindow);
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
