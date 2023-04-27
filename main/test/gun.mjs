import GUN from 'gun';

const gun = GUN(['http://localhost:8765/gun']);
gun.get('fp-usernames').on((data, key) => {
  console.log(data);
  console.log(key);
});
