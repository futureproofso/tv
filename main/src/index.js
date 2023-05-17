const { app, BrowserWindow, ipcMain, shell, contextBridge } = require("electron");
const path = require("path");

require("dotenv").config({ path: path.resolve(app.getAppPath(), ".env.prod") });

const b4a = require("b4a");
const { createHash } = require("crypto");
const { Sequelize } = require("sequelize");

require("./db/setup").setup();
const privateDb = require("./db/private");
const { PublicDb } = require("./db/public");
const { Network } = require("./p2p/network");
const { Metrics } = require("./metrics");
const ipcChannels = require("./renderer/channels").default;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

async function main(mainWindow, { seed, isNew }) {
  const metricsEnabled = await privateDb.getMetricsSelection();
  const metrics = new Metrics();
  metrics.setup(metricsEnabled);

  metrics.userLoggedIn("val_test");

  const publicDb = new PublicDb({ port: 1337 });
  const network = new Network({ seed, db: publicDb, gui: mainWindow.webContents });

  publicDb.setup({ prefix: network.publicKey });
  network.setup();

  ipcMain.on(ipcChannels.SET_SPACE, (event, appName) => {
    mainWindow.setTitle(appName);
    publicDb.getUsername({ appName, publicKey: network.publicKey }).then((username) => {
      const data = { appName, publicKey: network.publicKey, username };
      mainWindow.webContents.send(ipcChannels.GOT_USERNAME, data);
    });
    const topic = createHash("sha256").update(appName, "utf-8").digest();
    network.join(topic);
  });

  ipcMain.on(ipcChannels.SET_USERNAME, async (event, data) => {
    publicDb.publishUsername({ appName: data.appName, publicKey: network.publicKey, username: data.username });
    mainWindow.webContents.send(ipcChannels.GOT_USERNAME, data);
  });

  ipcMain.on(ipcChannels.SEND_MESSAGE, async (event, data) => {
    network.messagePeers(data);
  });

  ipcMain.on(ipcChannels.OPEN_LINK, async (event, args) => {
    shell.openExternal(args);
  });
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html")).then(() => {
    privateDb
      .setup()
      .then(async () => {
        const { seed, created } = await privateDb.getSeed();
        main(mainWindow, { seed, isNew: created }).catch((error) => {
          console.error(error);
          app.quit();
        });
      })
      .catch((error) => {
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
app.on("ready", async () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
