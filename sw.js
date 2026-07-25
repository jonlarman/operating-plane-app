// Minimal service worker: cache the app shell so the icon opens instantly and works offline.
// Vault data (today.md / priority-register.json) is always fetched live from GitHub, never cached here —
// the app keeps its own last-good copy in localStorage for offline rendering.
const SHELL = "op-shell-v5";
const FILES = ["./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Never touch GitHub API calls — those must go to the network.
  if (url.hostname === "api.github.com") return;
  // App shell: cache-first, fall back to network.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});
