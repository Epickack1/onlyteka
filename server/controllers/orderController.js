// server/controllers/orderController.js
// Оформление и просмотр заказов. Списание со склада — атомарно в транзакции,
// чтобы не уйти в отрицательный остаток при гонке параллельных оформлений.

const sequelize = require('../db/db');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const { publishOrderNotification } = require('../queue/producer');

// POST /api/orders
// body: { items: [{ productId, quantity }] }
const createOrder = async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Корзина пуста' });
    }

    const t = await sequelize.transaction();
    try {
        let total = 0;
        const orderItemsData = [];

        // Блокируем строки товаров на запись (FOR UPDATE) и проверяем сток
        for (const it of items) {
            if (!it.productId || !Number.isInteger(it.quantity) || it.quantity < 1) {
                throw new Error('Некорректная позиция заказа');
            }

            const product = await Product.findByPk(it.productId, {
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!product) {
                throw new Error(`Товар ${it.productId} не найден`);
            }
            if (product.stock < it.quantity) {
                throw new Error(`Недостаточно товара "${product.title}" на складе`);
            }

            const price = Number(product.price);
            total += price * it.quantity;

            orderItemsData.push({
                productId: product.id,
                quantity: it.quantity,
                priceAtPurchase: price
            });

            // Списываем со склада
            product.stock -= it.quantity;
            await product.save({ transaction: t });
        }

        const order = await Order.create({
            userId: req.user.sub,
            status: 'pending',
            totalAmount: total
        }, { transaction: t });

        for (const oi of orderItemsData) {
            await OrderItem.create({ ...oi, orderId: order.id }, { transaction: t });
        }

        await t.commit();

        // Уведомление пользователю — асинхронно через RabbitMQ.
        // Не блокирует ответ и не валит запрос, если очередь недоступна.
        publishOrderNotification({
            type: 'order_created',
            orderId: order.id,
            userId: req.user.sub,
            totalAmount: total
        }).catch((err) => console.warn('[orders] queue publish failed:', err.message));

        const full = await Order.findByPk(order.id, { include: ['items'] });
        res.status(201).json(full);
    } catch (err) {
        await t.rollback();
        console.error('[orders] create error:', err.message);
        res.status(400).json({ error: err.message });
    }
};

// GET /api/orders/my  — история заказов текущего пользователя
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.sub },
            include: ['items'],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при получении заказов' });
    }
};

// GET /api/orders  — все заказы (только admin)
const getAllOrders = async (_req, res) => {
    try {
        const orders = await Order.findAll({
            include: ['items'],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при получении заказов' });
    }
};

// PATCH /api/orders/:id  — смена статуса (admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }

        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Заказ не найден' });

        order.status = status;
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при обновлении заказа' });
    }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus };
