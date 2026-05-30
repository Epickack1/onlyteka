// client/src/serviceWorkerRegistration.js
// Регистрируем Service Worker только в продакшене и только если браузер поддерживает.
// В dev-режиме Vite (HMR) SW мешает: блокирует горячие обновления и кэширует старые модули.

export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('[SW] Service Worker не поддерживается в этом браузере');
        return;
    }

    // В dev SW отключаем, чтобы не ломать HMR. Для проверки практики
    // запускаем `npm run build` + `npm run preview`.
    if (import.meta.env.DEV) {
        console.info('[SW] Регистрация пропущена в dev-режиме');
        return;
    }

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.info('[SW] Зарегистрирован, scope:', registration.scope);
        } catch (err) {
            console.error('[SW] Ошибка регистрации:', err);
        }
    });
}