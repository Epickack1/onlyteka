// server/queue/worker.js
// Воркер обрабатывает задачи из ORDERS_QUEUE.
// Retry: до 3 попыток с экспоненциальной задержкой (1с, 2с, 4с) + джиттер.
// Если все попытки исчерпаны — сообщение через nack уходит в DLX → DLQ.
//
// Запуск: node queue/worker.js
// (В docker-compose стартуем 2 инстанса worker-1 и worker-2 — задачи делятся
//  между ними автоматически благодаря prefetch=1.)

require('dotenv').config();
const { connect, ORDERS_QUEUE } = require('./rabbit');

const WORKER_ID = process.env.WORKER_ID || `${process.pid}`;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function processOrderNotification(payload) {
    // Имитация работы внешнего сервиса (email/push).
    // Намеренно роняем 50% задач, чтобы продемонстрировать retry и DLQ.
    await new Promise((r) => setTimeout(r, 500));
    if (Math.random() < 0.5) {
        throw new Error('Email gateway timeout');
    }
    console.log(`[worker ${WORKER_ID}] ✓ уведомление о заказе ${payload.orderId} отправлено`);
}

function nextDelayMs(retryCount) {
    const exp = BASE_DELAY_MS * 2 ** retryCount;
    const jitter = Math.floor(Math.random() * 500);
    return exp + jitter;
}

async function start() {
    const channel = await connect();
    if (!channel) {
        console.error(`[worker ${WORKER_ID}] не удалось подключиться к RabbitMQ`);
        process.exit(1);
    }

    channel.prefetch(1);                     // по одному сообщению за раз
    console.log(`[worker ${WORKER_ID}] слушает ${ORDERS_QUEUE}`);

    channel.consume(ORDERS_QUEUE, async (msg) => {
        if (!msg) return;
        const retryCount = msg.properties.headers?.['x-retry-count'] ?? 0;
        let payload;
        try {
            payload = JSON.parse(msg.content.toString());
        } catch {
            console.error(`[worker ${WORKER_ID}] невалидный JSON — отправляю в DLQ`);
            channel.nack(msg, false, false);
            return;
        }

        console.log(`[worker ${WORKER_ID}] ← попытка ${retryCount + 1}/${MAX_RETRIES} для ${payload.orderId}`);

        try {
            await processOrderNotification(payload);
            channel.ack(msg);
        } catch (err) {
            console.warn(`[worker ${WORKER_ID}] ✗ ошибка: ${err.message}`);

            if (retryCount + 1 >= MAX_RETRIES) {
                console.error(`[worker ${WORKER_ID}] исчерпаны попытки — в DLQ`);
                channel.nack(msg, false, false);   // → DLX → DLQ
                return;
            }

            // Перепубликуем сообщение с инкрементированным счётчиком.
            // ack текущему — иначе соединение залипнет.
            const delay = nextDelayMs(retryCount);
            console.warn(`[worker ${WORKER_ID}] retry через ${delay}мс`);
            setTimeout(() => {
                channel.sendToQueue(ORDERS_QUEUE, msg.content, {
                    persistent: true,
                    headers: { 'x-retry-count': retryCount + 1 }
                });
                channel.ack(msg);
            }, delay);
        }
    });
}

// Graceful shutdown
async function shutdown() {
    console.log(`[worker ${WORKER_ID}] выключение...`);
    try {
        const { close } = require('./rabbit');
        await close();
    } catch { /* ignore */ }
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start().catch((err) => {
    console.error(`[worker ${WORKER_ID}] фатальная ошибка:`, err);
    process.exit(1);
});
