const CACHE = "writing-editor-mobile-1792501679979";
const shell = ["./mobile.html", "./app.js?v=491b15002da5d6f1", "./app.css?v=658f8d736db0b4d1", "./icon.svg", "./manifest.webmanifest", "./favicon.ico", "./favicon-16.png", "./favicon-32.png", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
shell.push('./spell-worker.js','./hunspell.wasm','./spell-ko.aff.gz','./spell-ko.dic.gz','./spell-en.aff.gz','./spell-en.dic.gz','./spell-notices.txt');
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(shell.map(url => new Request(url, { cache: "reload" }))))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("writing-editor-mobile-") && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const base = new URL("./", self.location.href);
  if (event.request.method !== "GET" || url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.pathname.includes("/api/")) return;
  const name = url.pathname.slice(base.pathname.length);
  if (!["", "index.html", ...shell.map(path => path.slice(2).split("?")[0])].includes(name)) return;
  // Cache only the public app shell, never tokens or personal records.
  event.respondWith(fetch(event.request, { cache: "no-cache" }).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === "navigate" ? caches.match(new URL("./mobile.html", base)) : Response.error())));
});
