// server/notifications.js
// Изолируем работу с web-push и хранилищем подписок.
// Подписки храним в памяти процесса — для учебной практики этого достаточно.
// В реальном проекте их следует хранить в БД (привязав к user_id).

const webpush = require('web-push');

const subscriptions = new Map();   // endpoint -> subscription
const reminders = new Map();       // reminderId -> { timeoutId, text, reminderTime }

function configureWebPush() {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('[push] VAPID-ключи не заданы в .env — push отключён');
        return false;
    }
    webpush.setVapidDetails(
        VAPID_SUBJECT || 'mailto:admin@onlyteka.local',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
    return true;
}

function addSubscription(sub) {
    if (!sub || !sub.endpoint) return false;
    subscriptions.set(sub.endpoint, sub);
    return true;
}

function removeSubscription(endpoint) {
    return subscriptions.delete(endpoint);
}

// Шлёт payload всем подписчикам. Если подписка протухла — удаляем её из хранилища.
async function broadcast(payload) {
    const data = JSON.stringify(payload);
    const sends = [];
    for (const [endpoint, sub] of subscriptions) {
        sends.push(
            webpush.sendNotification(sub, data).catch((err) => {
                // 404/410 — браузер отозвал подписку
                if (err.statusCode === 404 || err.statusCode === 410) {
                    subscriptions.delete(endpoint);
                } else {
                    console.error('[push] sendNotification error:', err.message);
                }
            })
        );
    }
    await Promise.all(sends);
}

module.exports = {
    configureWebPush,
    addSubscription,
    removeSubscription,
    broadcast,
    subscriptions,
    reminders
};