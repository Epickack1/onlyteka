// server/queue/rabbit.js
// Подключение к RabbitMQ + декларация очередей с DLQ (практика 27).
//
// Архитектура:
//   producer → ORDERS_QUEUE → worker
//       при ошибке (3 попытки)     → DLX → ORDERS_DLQ
//
// Если RabbitMQ недоступен — приложение продолжает работать без очередей.

// amqplib опционален: если пакет не установлен — очереди просто отключены.
let amqplib = null;
try {
    amqplib = require('amqplib');
} catch {
    console.warn('[rabbit] пакет amqplib не установлен — очереди отключены (npm install)');
}

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://127.0.0.1:5672';

const ORDERS_QUEUE = 'orders.notifications';
const ORDERS_DLX = 'orders.dlx';
const ORDERS_DLQ = 'orders.notifications.dlq';

let connection = null;
let channel = null;

async function connect() {
    if (channel) return channel;
    if (!amqplib) return null;
    try {
        connection = await amqplib.connect(RABBIT_URL);
        channel = await connection.createChannel();

        // Dead-letter exchange + DLQ
        await channel.assertExchange(ORDERS_DLX, 'direct', { durable: true });
        await channel.assertQueue(ORDERS_DLQ, { durable: true });
        await channel.bindQueue(ORDERS_DLQ, ORDERS_DLX, 'dead');

        // Основная очередь — отклонённые сообщения уходят в DLX
        await channel.assertQueue(ORDERS_QUEUE, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': ORDERS_DLX,
                'x-dead-letter-routing-key': 'dead'
            }
        });

        console.log('[rabbit] подключён, очереди готовы');

        connection.on('close', () => {
            console.warn('[rabbit] соединение закрыто');
            channel = null;
        });
        connection.on('error', (err) => {
            console.warn('[rabbit] ошибка:', err.message);
        });

        return channel;
    } catch (err) {
        console.warn('[rabbit] недоступен — очереди отключены:', err.message);
        channel = null;
        return null;
    }
}

function isConnected() {
    return !!channel;
}

async function close() {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
    } catch { /* ignore */ }
    channel = null;
    connection = null;
}

module.exports = {
    connect,
    close,
    isConnected,
    getChannel: () => channel,
    ORDERS_QUEUE,
    ORDERS_DLQ,
    ORDERS_DLX
};
