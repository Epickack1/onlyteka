// server/middleware/cacheMiddleware.js
// Универсальный middleware для чтения из Redis-кэша.
// Если данные есть — отдаёт их сразу, в обход контроллера.
// Если нет — пробрасывает дальше, контроллер обязан вызвать saveToCache.

const { redisClient, isRedisConnected } = require('../db/redis');

function cacheMiddleware(keyBuilder, ttl) {
    return async (req, res, next) => {
        // Redis не поднят — просто пропускаем
        if (!isRedisConnected()) return next();

        try {
            const key = keyBuilder(req);
            const cached = await redisClient.get(key);

            if (cached) {
                return res.json({
                    source: 'cache',
                    data: JSON.parse(cached)
                });
            }

            // Кладём ключ и TTL в req, чтобы контроллер мог сохранить
            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();
        } catch (err) {
            console.error('[cache] read error:', err.message);
            next();
        }
    };
}

async function saveToCache(key, data, ttl) {
    if (!isRedisConnected() || !key) return;
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    } catch (err) {
        console.error('[cache] save error:', err.message);
    }
}

// Нестрого собираем все ключи по шаблону через SCAN (не блокирует Redis,
// в отличие от KEYS, который проходит всё пространство ключей за раз).
async function scanKeys(pattern) {
    const found = [];
    let cursor = '0';
    do {
        const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = reply.cursor;
        found.push(...reply.keys);
    } while (cursor !== '0');
    return found;
}

async function invalidateCache(pattern) {
    if (!isRedisConnected()) return;
    try {
        if (pattern.includes('*')) {
            const keys = await scanKeys(pattern);
            if (keys.length > 0) await redisClient.del(keys);
        } else {
            await redisClient.del(pattern);
        }
    } catch (err) {
        console.error('[cache] invalidate error:', err.message);
    }
}

module.exports = { cacheMiddleware, saveToCache, invalidateCache };
