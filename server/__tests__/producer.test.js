// Producer должен возвращать false и не падать, если RabbitMQ не поднят.
// Делаем connect() возвращать null и проверяем graceful-degradation.

jest.mock('../queue/rabbit', () => ({
    connect: jest.fn(async () => null),
    isConnected: jest.fn(() => false),
    getChannel: jest.fn(() => null),
    ORDERS_QUEUE: 'orders.notifications'
}));

const { publishOrderNotification } = require('../queue/producer');

describe('producer.publishOrderNotification', () => {
    test('возвращает false если канал недоступен', async () => {
        const result = await publishOrderNotification({
            type: 'order_created',
            orderId: 'o1',
            userId: 'u1'
        });
        expect(result).toBe(false);
    });
});
