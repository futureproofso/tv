const button = document.getElementById('username-button');
const usernameInput = document.getElementById('username-input');
button.addEventListener('click', () => {
  window.electron.ipcRenderer.sendMessage('set-username', usernameInput.value);
});
