const CACHE = 'grade-ai-v1';

const STATIC_CACHE_PATHS = [
	'/',
	'/manifest.json',
	'/icons/manifest-icon-192.maskable.png',
	'/icons/manifest-icon-512.maskable.png',
	'/icons/apple-icon-180.png',
	'/robots.txt'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => {
			return cache.addAll(STATIC_CACHE_PATHS).catch(() => {
				// individual items may fail; that's okay
			});
		})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
		})
	);
	return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (url.origin !== self.location.origin) return;

	if (url.pathname.startsWith('/_app/immutable/')) {
		event.respondWith(cacheFirst(request));
		return;
	}

	if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json' || url.pathname === '/logo.webp') {
		event.respondWith(cacheFirst(request));
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request));
		return;
	}
});

async function cacheFirst(request) {
	const cached = await caches.match(request);
	if (cached) return cached;
	try {
		const response = await fetch(request);
		if (response.ok) {
			const cache = await caches.open(CACHE);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		return new Response('Offline', { status: 503 });
	}
}

async function networkFirst(request) {
	try {
		const response = await fetch(request);
		if (response.ok && response.type === 'basic') {
			const cache = await caches.open(CACHE);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;
		return new Response(
			'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;height:100dvh;margin:0;background:#000;color:#fff;text-align:center;padding:1rem}h1{font-size:1.5rem}p{color:#888}a{color:#60a5fa}</style></head><body><h1>You\'re offline</h1><p>Please check your connection and try again.</p></body></html>',
			{
				status: 503,
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			}
		);
	}
}
