const spaceName = document.getElementById('space-name');
const sendButton = document.getElementById('space-send-button');
const sendInput = document.getElementById('space-send-input');
const username = document.getElementById('space-username');
const usernameForm = document.getElementById('space-username-form');
const usernameButton = document.getElementById('space-username-button');
const usernameInput = document.getElementById('space-username-input');
const messages = document.getElementById('space-messages');
const messageOtherTemplate = document.getElementById('space-message-other-template')
const messageSelfTemplate = document.getElementById('space-message-self-template');

window.electron.ipcRenderer.on('got-username', (appName, value) => {
  console.log('got-username handler', appName, value);
  username.innerText = value.substring(0, 10);
  usernameInput.setAttribute('placeholder', value);
});

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
      'set-username',
      JSON.stringify({
        appName: spaceName.innerText,
        username: nextUsername
      })
    );
  }
  usernameForm.setAttribute('hidden', true);
  username.removeAttribute('hidden');
});

sendButton.addEventListener('click', (e) => {
  e.preventDefault();
  window.electron.ipcRenderer.sendMessage('send-message', sendInput.value);

  const clone = messageSelfTemplate.content.cloneNode(true);
  let p = clone.querySelectorAll("p");
  p[0].innerText = sendInput.value;
  messages.appendChild(clone);
  messages.lastElementChild.scrollIntoView();
  sendInput.value = "";
});

window.electron.ipcRenderer.on('got-message', (value) => {
  const contents = JSON.parse(value);
  const clone = messageOtherTemplate.content.cloneNode(true);
  let p = clone.querySelectorAll("p");
  p[0].innerText = contents.message;
  p[1].innerText = contents.from.substring(0, 7);
  messages.appendChild(clone);
  messages.lastElementChild.scrollIntoView();
});
