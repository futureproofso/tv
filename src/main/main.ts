/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from "path";
import { app, BrowserWindow, shell, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import Hyperswarm from "hyperswarm";
import goodbye from "graceful-goodbye";
import crypto from "hypercore-crypto";
import b4a from "b4a";
import fetch from "electron-fetch";

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { createHash } from "crypto";

import { resolveHtmlPath } from "./util";
import MenuBuilder from "./menu";

sqlite3.verbose();

class AppUpdater {
  constructor() {
    log.transports.file.level = "info";
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let db: any;
async function createTableIfNotExists() {
  const createTableQuery = `CREATE TABLE IF NOT EXISTS account (seed TEXT)`;
  await db.run(createTableQuery, []);
}

async function createSeedIfNotExists(): Promise<string> {
  const row: any = await db.get(`SELECT * FROM account LIMIT 1`);
  if (!row) {
    const seed = crypto.randomBytes(32).toString("hex");
    await db.run("INSERT INTO account VALUES (?)", seed);
    return seed;
  }
  return row.seed;
}

async function getSpaceConfig(space: string) {
  const url = `http://localhost:3000/configs/${space}`;
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res: Response) => resolve(res.json()))
      .catch(reject);
  });
}

function startChatting(window: BrowserWindow, seed: string) {
  const swarm = new Hyperswarm({ seed: b4a.from(seed, "hex"), maxPeers: 31 });
  const publicKey = b4a.toString(swarm.keyPair.publicKey, "hex");
  goodbye(() => swarm.destroy());

  // Keep track of all connections and console.log incoming data
  const conns: any = [];
  swarm.on("connection", (conn: any) => {
    const name = b4a.toString(conn.remotePublicKey, "hex");
    console.log("* got a connection from:", name, "*");
    conns.push(conn);
    conn.once("close", () => conns.splice(conns.indexOf(conn), 1));
    conn.on("data", (data: Buffer) => {
      const message = b4a.toString(data, "utf-8");
      const id = createHash("md5")
        .update(`n:${name}:m:${message}:t:${Date.now()}`)
        .digest("hex");
      window.webContents.send(
        "chat-in",
        JSON.stringify({ id, from: name, message })
      );
    });
    conn.on("error", console.error);
  });

  ipcMain.on("account-out", async () => {
    window.webContents.send("account-in", publicKey);
  });

  // send to peers
  ipcMain.on("chat-out", async (event, args) => {
    if (args[0] === "message") {
      conns.forEach((conn: any) => {
        const message = b4a.from(args[1], "utf-8");
        conn.write(message);
      });
    }
    event.reply("chat-out", `message sent`);
  });

  ipcMain.on("space-out", async (event, args) => {
    if (args[0] === "connect") {
      const alias = args[1];
      const config = await getSpaceConfig(alias);
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
            config,
          };
          window.webContents.send("space-in", JSON.stringify(metadata));
        })
        .catch(console.error);
    }
  });
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on("ipc-example", async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply("ipc-example", msgTemplate("pong"));
});

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDebug) {
  require("electron-debug")();
}

const installExtensions = async () => {
  const installer = require("electron-devtools-installer");
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ["REACT_DEVELOPER_TOOLS"];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, "assets")
    : path.join(__dirname, "../../assets");

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath("icon.png"),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, "preload.js")
        : path.join(__dirname, "../../.erb/dll/preload.js"),
    },
  });

  mainWindow.loadURL(resolveHtmlPath("index.html"));

  mainWindow.on("ready-to-show", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  open({
    filename: "/tmp/database.db",
    driver: sqlite3.Database,
  })
    .then(async (database: any) => {
      db = database;
      await createTableIfNotExists();
      const seed = await createSeedIfNotExists();
      console.log("seed", seed);
      if (mainWindow) {
        startChatting(mainWindow, seed);
      }
    })
    .catch(console.error);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: "deny" };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
