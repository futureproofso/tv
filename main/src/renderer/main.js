const button = document.getElementById('main-app-name-button');
const input = document.getElementById('main-app-name-input');
const mainTemplate = document.getElementById('main-template');
const spaceTemplate = document.getElementById('space-template');

button.addEventListener('click', (e) => {
  e.preventDefault();
  window.electron.ipcRenderer.sendMessage('set-space', input.value);
  mainTemplate.setAttribute('hidden', true);
  spaceTemplate.removeAttribute('hidden');
  const spaceName = document.getElementById('space-name');
  spaceName.innerText = input.value;
});

