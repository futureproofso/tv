const root = document.getElementById("root");
fetch('./pages/bundle/index.html').then(async (resp) => {
  const html = await resp.text();
  root.innerHTML = html;
  await import('./main.js');
}).catch(console.error);
