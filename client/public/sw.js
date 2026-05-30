// client/public/sw.js
// Service Worker онлайн-аптеки onlyteka.
// Версионируем имя кэша — при изменении CACHE_VERSION старый кэш будет удалён в activate.

const CACHE_VERSION = 'v2';                                  // ← поменяли с v1 на v2
const STATIC_CACHE = `onlyteka-static-${CACHE_VERSION}`;
const API_CACHE = `onlyteka-api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',                                        // ← добавили
    '/favicon.svg',
    '/icons.svg',
    '/icons/favicon-16x16.png',                              // ← добавили иконки
    '/icons/favicon-32x32.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

const API_ORIGIN = 'http://localhost:3000';

// ---------- install: предварительно кэшируем базовую статику ----------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting()) // активируемся сразу, без ожидания закрытия вкладок
    );
});

// ---------- activate: чистим устаревшие версии кэшей ----------
self.addEventListener('activate', (event) => {
    const validCaches = [STATIC_CACHE, API_CACHE];
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => !validCaches.includes(key))
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim()) // берём управление текущими вкладками
    );
});

// ---------- fetch: стратегии в зависимости от типа запроса ----------
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Навигационные запросы (переходы по адресной строке, F5) — App Shell.
    // Отдаём index.html из кэша мгновенно, React Router разрулит роут.
    if (request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html').then((cached) => cached || fetch(request))
        );
        return;
    }

    // API: network-first
    if (url.origin === API_ORIGIN && url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Своя статика: cache-first
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
        return;
    }
});

// Network-first: сначала пытаемся сходить в сеть, при успехе обновляем кэш.
async function networkFirst(request) {
    const cache = await caches.open(API_CACHE);
    try {
        const response = await fetch(request);
        // Кэшируем только успешные ответы
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Сети нет — отдаём из кэша
        const cached = await cache.match(request);
        if (cached) return cached;
        // На совсем крайний случай — пустой JSON-массив, чтобы UI не падал
        return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });
    }
}

// Cache-first: сначала ищем в кэше, иначе идём в сеть и кладём в кэш.
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Для навигационных запросов отдаём index.html — SPA сможет отрендериться из кэша
        if (request.mode === 'navigate') {
            const fallback = await cache.match('/index.html');
            if (fallback) return fallback;
        }
        throw err;
    }
}
// ---------- Push (практика 16) ----------
self.addEventListener('push', (event) => {
    let data = { title: 'Onlyteka', body: '' };
    try {
        if (event.data) data = event.data.json();
    } catch {
        if (event.data) data = { title: 'Onlyteka', body: event.data.text() };
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/favicon-32x32.png',
        data: { reminderId: data.reminderId || null }
    };

    // Кнопка «Отложить» — только для напоминаний (практика 17)
    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: 'Отложить на 5 минут' }
        ];
    }

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// ---------- Клик по уведомлению (практика 17) ----------
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'snooze' && notification.data?.reminderId) {
        event.waitUntil(
            fetch(`/api/push/snooze?reminderId=${notification.data.reminderId}`, {
                method: 'POST'
            })
                .then(() => notification.close())
                .catch((err) => console.error('[sw] snooze failed:', err))
        );
        return;
    }

    notification.close();
    // Открываем приложение по клику
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow('/');
        })
    );
});