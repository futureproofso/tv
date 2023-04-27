const button = document.getElementById('space-send-button');
const input = document.getElementById('space-send-input');
const messages = document.getElementById('space-messages');
const messageOtherTemplate = document.getElementById('space-message-other-template')
const messageSelfTemplate = document.getElementById('space-message-self-template');

button.addEventListener('click', (e) => {
  e.preventDefault();
  window.electron.ipcRenderer.sendMessage('send-message', input.value);

  const clone = messageSelfTemplate.content.cloneNode(true);
  let p = clone.querySelectorAll("p");
  p[0].innerText = input.value;
  messages.appendChild(clone);
  messages.lastElementChild.scrollIntoView();
  input.value = "";
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
