const root = document.getElementById("root");
fetch("./pages/bundle/index.html")
  .then(async (resp) => {
    const html = await resp.text();
    root.innerHTML = html;
    await import("./main.js");
    await import("./space.js");
  })
  .catch(console.error);
