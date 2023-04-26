const { app, BrowserWindow, ipcMain } = require('electron');

function setSpace(event, core, appName) {
  console.log("setting space:", appName);
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.setTitle(appName);
}

function setUsername(event, core, publicKey, username) {
  console.log(`setting username for peer ${publicKey}:`, username);
  core.append(JSON.stringify({publicKey, username}));
}

module.exports = {
  setSpace,
  setUsername
}
