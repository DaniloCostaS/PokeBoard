// Service worker do PokéBoard: shell offline + cache de imagens e sprites.
// Ao mudar a estratégia de cache, incremente CACHE_VERSION para limpar os caches antigos.
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `pokeboard-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `pokeboard-assets-${CACHE_VERSION}`;
const SPRITE_CACHE = `pokeboard-sprites-${CACHE_VERSION}`;
const SPRITE_PREFIX = 'https://raw.githubusercontent.com/PokeAPI/sprites/';
const SPRITE_MAX_ENTRIES = 400;
const SHELL_URLS = ['/manifest.webmanifest', '/favicon.png'];
// Com cleanUrls o Firebase redireciona /index.html -> /, então o shell é baixado de "/" e guardado como /index.html
const SHELL_KEY = '/index.html';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => Promise.all([
                cache.addAll(SHELL_URLS),
                fetch('/', { cache: 'no-cache' }).then((res) => { if (res.ok && !res.redirected) return cache.put(SHELL_KEY, res); })
            ]))
            .catch(() => { /* shell é best-effort; não bloqueia a instalação */ })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const keep = new Set([SHELL_CACHE, ASSET_CACHE, SPRITE_CACHE]);
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key.startsWith('pokeboard-') && !keep.has(key)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    // Supabase (REST/realtime/auth) nunca passa pelo cache
    if (url.hostname.endsWith('.supabase.co')) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    if (request.url.startsWith(SPRITE_PREFIX)) {
        event.respondWith(staleWhileRevalidate(event, request, SPRITE_CACHE));
        return;
    }

    // Imagens de public/assets e bundles do Vite (dist/assets/*.js|css) compartilham o prefixo /assets/
    if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
        event.respondWith(cacheFirst(request, ASSET_CACHE));
        return;
    }

    // Manifest/favicon: rede primeiro, cache como fallback offline
    if (url.origin === self.location.origin && SHELL_URLS.includes(url.pathname)) {
        event.respondWith(fetch(request).catch(() => caches.match(url.pathname).then((res) => res || Response.error())));
    }
});

async function networkFirstNavigation(request) {
    try {
        const response = await fetch(request);
        const url = new URL(request.url);
        // Só atualiza o shell com a página principal (não com manual.html etc.)
        const isShell = url.pathname === '/' || url.pathname === '/index.html';
        if (isShell && response && response.ok && !response.redirected) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(SHELL_KEY, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request) || await caches.match(SHELL_KEY);
        if (cached) return cached;
        throw err;
    }
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
}

async function staleWhileRevalidate(event, request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const network = fetch(request)
        .then(async (response) => {
            // Respostas opacas (no-cors) também servem para <img>
            if (response && (response.ok || response.type === 'opaque')) {
                await cache.put(request, response.clone());
                await trimCache(cache, SPRITE_MAX_ENTRIES);
            }
            return response;
        })
        .catch(() => cached);
    if (cached) {
        event.waitUntil(network.then(() => undefined));
        return cached;
    }
    const response = await network;
    return response || Response.error();
}

// Remove as entradas mais antigas (ordem de inserção) além do limite
async function trimCache(cache, maxEntries) {
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}
