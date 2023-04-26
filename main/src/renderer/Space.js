const button = document.getElementById('space-button');
const spaceInput = document.getElementById('space-input');
button.addEventListener('click', () => {
  window.electron.ipcRenderer.sendMessage('set-space', spaceInput.value);
});
