const button = document.getElementById('main-app-name-button');
const input = document.getElementById('main-app-name-input');
const mainTemplate = document.getElementById('main-template');
const spaceTemplate = document.getElementById('space-template');
const reserveLink = document.getElementById('main-reserve-link');

button.addEventListener('click', (e) => {
  e.preventDefault();
  const text = input.selectedOptions[0].text;
  window.electron.ipcRenderer.sendMessage(ipcChannels.SET_SPACE, text);
  mainTemplate.setAttribute('hidden', true);
  spaceTemplate.removeAttribute('hidden');
  const spaceName = document.getElementById('space-name');
  spaceName.innerText = text;
});


reserveLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.electron.ipcRenderer.sendMessage(ipcChannels.OPEN_LINK, 'https://futureproof.ck.page/tv-reservation');
});
