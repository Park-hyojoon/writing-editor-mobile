const CACHE = "writing-editor-mobile-1792460826295";
const shell = ["./mobile.html", "./app.js", "./app.css", "./icon.svg", "./manifest.webmanifest", "./favicon.ico", "./favicon-16.png", "./favicon-32.png", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(shell))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("writing-editor-mobile-") && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const base = new URL("./", self.location.href);
  if (event.request.method !== "GET" || url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.pathname.includes("/api/")) return;
  const name = url.pathname.slice(base.pathname.length);
  if (!["", "index.html", ...shell.map(path => path.slice(2))].includes(name)) return;
  // Cache only the public app shell, never tokens or personal records.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === "navigate" ? caches.match(new URL("./mobile.html", base)) : Response.error())));
});
