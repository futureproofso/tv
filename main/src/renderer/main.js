const button = document.getElementById('main-app-name-button');
const input = document.getElementById('main-app-name-input');
button.addEventListener('click', (e) => {
  e.preventDefault();
  window.electron.ipcRenderer.sendMessage('set-space', input.value);
});
