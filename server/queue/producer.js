// server/queue/producer.js
// Отправка задач в очередь. Используется из контроллеров —
// например, при создании заказа кидаем уведомление асинхронно,
// не блокируя HTTP-ответ.

const { connect, ORDERS_QUEUE, isConnected } = require('./rabbit');

async function publishOrderNotification(payload) {
    const ch = isConnected() ? require('./rabbit').getChannel() : await connect();
    if (!ch) {
        console.warn('[producer] RabbitMQ недоступен — задача пропущена');
        return false;
    }

    const message = Buffer.from(JSON.stringify(payload));
    const ok = ch.sendToQueue(ORDERS_QUEUE, message, {
        persistent: true,                       // переживёт перезапуск брокера
        headers: { 'x-retry-count': 0 }
    });

    if (ok) {
        console.log(`[producer] → ${ORDERS_QUEUE}:`, payload.type, payload.orderId);
    }
    return ok;
}

module.exports = { publishOrderNotification };
