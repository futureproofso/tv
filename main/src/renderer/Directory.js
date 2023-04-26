const directoryDiv = document.getElementById('directory');
window.electron.ipcRenderer.on('got-username', (value) => {
  const item = document.createElement("p");
  item.innerText = value;
  directoryDiv.appendChild(item);
});
