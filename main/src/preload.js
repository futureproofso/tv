// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
const { contextBridge, ipcRenderer, IpcRendererEvent } = require("electron");

const IPC_EXAMPLE = "ipc-example";
const SET_TITLE = "set-title";
const GOT_USERNAME = "got-username";

const Channels = {
  IPC_EXAMPLE,
  SET_TITLE
}

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel, args) {
      ipcRenderer.send(channel, args);
    },
    on(channel, func) {
      const subscription = (_event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel, func) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld("electron", electronHandler);
