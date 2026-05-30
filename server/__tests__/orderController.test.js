// Юнит-тест на createOrder с замоканными моделями и транзакцией.

jest.mock('../db/db', () => {
    return {
        transaction: jest.fn(async () => ({
            commit: jest.fn(async () => {}),
            rollback: jest.fn(async () => {}),
            LOCK: { UPDATE: 'UPDATE' }
        }))
    };
});

const mockSaved = [];
jest.mock('../models/Product', () => ({
    findByPk: jest.fn()
}));
jest.mock('../models/Order', () => ({
    create: jest.fn(async (data) => ({ id: 'order-1', ...data })),
    findByPk: jest.fn(async (id) => ({ id, items: mockSaved }))
}));
jest.mock('../models/OrderItem', () => ({
    create: jest.fn(async (data) => { mockSaved.push(data); return data; })
}));
jest.mock('../queue/producer', () => ({
    publishOrderNotification: jest.fn(async () => true)
}));

const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { createOrder } = require('../controllers/orderController');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('orderController.createOrder', () => {
    beforeEach(() => {
        mockSaved.length = 0;
    });

    test('400 при пустой корзине', async () => {
        const req = { body: { items: [] }, user: { sub: 'u1' } };
        const res = mockRes();
        await createOrder(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('создаёт заказ и списывает сток', async () => {
        const productMock = {
            id: 'p1', title: 'A', price: '100.00', stock: 5,
            save: jest.fn(async () => {})
        };
        Product.findByPk.mockResolvedValue(productMock);

        const req = {
            body: { items: [{ productId: 'p1', quantity: 2 }] },
            user: { sub: 'u1' }
        };
        const res = mockRes();
        await createOrder(req, res);

        expect(Product.findByPk).toHaveBeenCalledWith('p1', expect.any(Object));
        expect(productMock.stock).toBe(3);
        expect(productMock.save).toHaveBeenCalled();
        expect(Order.create).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'u1', status: 'pending', totalAmount: 200 }),
            expect.any(Object)
        );
        expect(OrderItem.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('400 если товара недостаточно на складе', async () => {
        Product.findByPk.mockResolvedValue({
            id: 'p1', title: 'A', price: '100.00', stock: 1,
            save: jest.fn()
        });
        const req = {
            body: { items: [{ productId: 'p1', quantity: 10 }] },
            user: { sub: 'u1' }
        };
        const res = mockRes();
        await createOrder(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 если товар не найден', async () => {
        Product.findByPk.mockResolvedValue(null);
        const req = {
            body: { items: [{ productId: 'missing', quantity: 1 }] },
            user: { sub: 'u1' }
        };
        const res = mockRes();
        await createOrder(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 при некорректном quantity', async () => {
        const req = {
            body: { items: [{ productId: 'p1', quantity: 0 }] },
            user: { sub: 'u1' }
        };
        const res = mockRes();
        await createOrder(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
