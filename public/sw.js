const CACHE_NAME = 'es-pattern-lab-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // 외부 API(api.elevenlabs.io 등)는 절대 캐시하지 않는다 — GET /v1/voices가 캐시되면 안 됨.
  if (url.origin !== self.location.origin) return;
  // 로컬 Express API도 캐시 대상에서 제외한다.
  if (url.pathname.includes('/api/')) return;

  // 해시된 번들과 자료 이미지는 내용이 불변이므로 cache-first.
  if (url.pathname.includes('/assets/') || url.pathname.includes('/materials/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // 앱 셸, materials.json 등은 network-first로 항상 최신을 우선한다.
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await caches.match(new URL('./', self.registration.scope).href);
      if (shell) return shell;
    }
    throw error;
  }
}
