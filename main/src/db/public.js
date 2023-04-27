const Gun = require('gun');
const {createServer} = require('http');

const server = createServer(Gun.serve(__dirname)).listen('8765', () => {
	console.log('Relay peer started on port 8765 with /gun');
});

const gun = Gun({web: server});
const user = gun.user();

function setup({ isNew, seed, username }) {
  if (isNew) {
  // usernames are not unique in SEA (yet logins will still work), and SEA does not generate keys based on passwords
    user.create(username, seed)
  } else {
    user.auth(username, seed, (res) => {
      if (res.err) {
        console.log('err', res.err)
        user.create(username, seed)
      }
    })
  }
}

function publishUsername({ peerPublicKey, username, app }) {
  gun.get(`${app}-usernames`).put({
    [username]: peerPublicKey
  });
}

function receiveUsernames(app) {
  gun.get(`${app}-usernames`).on((data, key) => {
    console.log("realtime updates:", data);
  });
}

module.exports = {
  setup,
  publishUsername
};
