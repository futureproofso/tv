const spaceName = document.getElementById('space-name');
const spacePeerCount = document.getElementById('space-peer-count');
const sendButton = document.getElementById('space-send-button');
const sendInput = document.getElementById('space-send-input');
const username = document.getElementById('space-username');
const usernameForm = document.getElementById('space-username-form');
const usernameButton = document.getElementById('space-username-button');
const usernameInput = document.getElementById('space-username-input');
const messages = document.getElementById('space-messages');
const messageOtherTemplate = document.getElementById('space-message-other-template')
const messageSelfTemplate = document.getElementById('space-message-self-template');

username.addEventListener('click', (e) => {
  e.preventDefault();

  username.setAttribute('hidden', true);
  usernameForm.removeAttribute('hidden');
})

usernameButton.addEventListener('click', (e) => {
  e.preventDefault();
  let nextUsername = usernameInput.value;
  if (nextUsername && nextUsername != '') {
    window.electron.ipcRenderer.sendMessage(
      ipcChannels.SET_USERNAME,
      {
        appName: spaceName.innerText,
        username: nextUsername
      }
    );
  }
  usernameForm.setAttribute('hidden', true);
  username.removeAttribute('hidden');
});

sendButton.addEventListener('click', (e) => {
  e.preventDefault();
  window.electron.ipcRenderer.sendMessage(ipcChannels.SEND_MESSAGE, sendInput.value);

  const clone = messageSelfTemplate.content.cloneNode(true);
  let p = clone.querySelectorAll("p");
  p[0].innerText = sendInput.value;
  messages.appendChild(clone);
  messages.lastElementChild.scrollIntoView();
  sendInput.value = "";
});

window.electron.ipcRenderer.on(ipcChannels.GOT_USERNAME, (data) => {
  username.innerText = data.username.substring(0, 10);
  usernameInput.setAttribute('placeholder', data.username);
});

window.electron.ipcRenderer.on(ipcChannels.GOT_MESSAGE, (data) => {
  const clone = messageOtherTemplate.content.cloneNode(true);
  let p = clone.querySelectorAll("p");
  p[0].innerText = data.body;
  p[1].innerText = data.from.substring(0, 7);
  messages.appendChild(clone);
  messages.lastElementChild.scrollIntoView();
});

window.electron.ipcRenderer.on(ipcChannels.GOT_PEER_COUNT, (data) => {
  spacePeerCount.innerText = data;
});
