// client/src/lib/pushUtils.js
// Утилиты для подписки на Web Push.
// Вынесены отдельно, чтобы их можно было переиспользовать в любом компоненте.

import $api from '../api';

// Конвертация VAPID-ключа из base64url в Uint8Array (нужно для PushManager)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

export function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getCurrentSubscription() {
    if (!isPushSupported()) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
}

export async function subscribeToPush() {
    if (!isPushSupported()) throw new Error('Push не поддерживается');

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) throw new Error('VITE_VAPID_PUBLIC_KEY не задан');

    if (Notification.permission === 'denied') {
        throw new Error('Уведомления запрещены пользователем');
    }
    if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') throw new Error('Разрешение не получено');
    }

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await $api.post('/push/subscribe', subscription);
    return subscription;
}

export async function unsubscribeFromPush() {
    const subscription = await getCurrentSubscription();
    if (!subscription) return;
    await $api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
}