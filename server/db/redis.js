// server/db/redis.js
// Redis-клиент для кэширования и других задач.
// Если Redis недоступен — приложение продолжает работать без кэша.

const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
        reconnectStrategy: false,
        connectTimeout: 2000
    }
});

redisClient.on('error', (err) => {
    // Молча игнорируем — не спамим в консоль, если Redis не поднят.
    // Главное, чтобы приложение работало.
});

let connected = false;

async function initRedis() {
    try {
        await redisClient.connect();
        connected = true;
        console.log('Redis подключён');
    } catch (err) {
        console.warn('Redis недоступен — кэш отключён');
        connected = false;
    }
}

function isRedisConnected() {
    return connected;
}

module.exports = { redisClient, initRedis, isRedisConnected };