const { app, BrowserWindow, ipcMain } = require('electron');

function setSpace(event, core, appName) {
  console.log("setting space:", appName);
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.setTitle(appName);
}

module.exports = {
  setSpace,
}
