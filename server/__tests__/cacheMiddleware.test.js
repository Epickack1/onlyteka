// Изолируем Redis-клиент моком ДО импорта middleware.
jest.mock('../db/redis', () => {
    const store = new Map();
    let connected = true;
    return {
        redisClient: {
            get: jest.fn(async (k) => (store.has(k) ? store.get(k) : null)),
            set: jest.fn(async (k, v) => { store.set(k, v); }),
            del: jest.fn(async (k) => { store.delete(k); }),
            keys: jest.fn(async () => Array.from(store.keys()))
        },
        isRedisConnected: jest.fn(() => connected),
        __setConnected: (v) => { connected = v; },
        __store: store
    };
});

const { cacheMiddleware, saveToCache, invalidateCache } = require('../middleware/cacheMiddleware');
const redisModule = require('../db/redis');

function mockRes() {
    const res = {};
    res.json = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    return res;
}

describe('cacheMiddleware', () => {
    beforeEach(() => {
        redisModule.__store.clear();
        redisModule.__setConnected(true);
    });

    test('пропускает запрос если Redis не подключён', async () => {
        redisModule.__setConnected(false);
        const mw = cacheMiddleware(() => 'key:1', 60);
        const req = {};
        const res = mockRes();
        const next = jest.fn();
        await mw(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test('возвращает кэшированные данные при попадании', async () => {
        await saveToCache('hit:1', { foo: 'bar' }, 60);
        const mw = cacheMiddleware(() => 'hit:1', 60);
        const req = {};
        const res = mockRes();
        const next = jest.fn();
        await mw(req, res, next);
        expect(res.json).toHaveBeenCalledWith({ source: 'cache', data: { foo: 'bar' } });
        expect(next).not.toHaveBeenCalled();
    });

    test('при промахе кладёт ключ в req и вызывает next', async () => {
        const mw = cacheMiddleware(() => 'miss:1', 120);
        const req = {};
        const res = mockRes();
        const next = jest.fn();
        await mw(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.cacheKey).toBe('miss:1');
        expect(req.cacheTTL).toBe(120);
    });

    test('invalidateCache удаляет ключ', async () => {
        await saveToCache('to-del', { x: 1 }, 60);
        await invalidateCache('to-del');
        expect(redisModule.__store.has('to-del')).toBe(false);
    });
});
