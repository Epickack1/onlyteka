// server/graphql/resolvers.js
// Резолверы повторно используют те же модели, что и REST-контроллеры,
// чтобы не дублировать бизнес-логику.

const { Op } = require('sequelize');
const sequelize = require('../db/db');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Review = require('../models/Review');

function requireAuth(ctx) {
    if (!ctx.user) {
        throw new Error('UNAUTHENTICATED');
    }
    return ctx.user;
}

function requireRole(ctx, roles) {
    const user = requireAuth(ctx);
    if (!roles.includes(user.role)) {
        throw new Error('FORBIDDEN');
    }
    return user;
}

const resolvers = {
    Query: {
        products: async (_p, { category, search }) => {
            const where = {};
            if (category) where.category = category;
            if (search) where.title = { [Op.iLike]: `%${search}%` };
            return Product.findAll({ where, order: [['createdAt', 'DESC']] });
        },

        product: (_p, { id }) => Product.findByPk(id),

        reviews: (_p, { productId }) =>
            Review.find({ productId }).sort({ createdAt: -1 }),

        me: (_p, _a, ctx) => {
            const user = requireAuth(ctx);
            return User.findByPk(user.sub);
        },

        myOrders: (_p, _a, ctx) => {
            const user = requireAuth(ctx);
            return Order.findAll({
                where: { userId: user.sub },
                include: ['items'],
                order: [['createdAt', 'DESC']]
            });
        }
    },

    Mutation: {
        createProduct: async (_p, { input }, ctx) => {
            requireRole(ctx, ['seller', 'admin']);
            return Product.create({
                ...input,
                stock: input.stock ?? 0
            });
        },

        createReview: async (_p, { input }, ctx) => {
            const auth = requireAuth(ctx);
            const product = await Product.findByPk(input.productId);
            if (!product) throw new Error('Товар не найден');

            const userRow = await User.findByPk(auth.sub);
            if (!userRow) throw new Error('Пользователь не найден');

            return Review.create({
                productId: input.productId,
                userId: auth.sub,
                authorName: `${userRow.first_name} ${userRow.last_name}`,
                rating: input.rating,
                text: input.text
            });
        },

        // Тот же сценарий, что в REST-контроллере: транзакция + lock строки.
        createOrder: async (_p, { items }, ctx) => {
            const auth = requireAuth(ctx);
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error('Корзина пуста');
            }

            const t = await sequelize.transaction();
            try {
                let total = 0;
                const orderItemsData = [];

                for (const it of items) {
                    if (!Number.isInteger(it.quantity) || it.quantity < 1) {
                        throw new Error('Некорректная позиция заказа');
                    }
                    const product = await Product.findByPk(it.productId, {
                        lock: t.LOCK.UPDATE,
                        transaction: t
                    });
                    if (!product) throw new Error(`Товар ${it.productId} не найден`);
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
                    product.stock -= it.quantity;
                    await product.save({ transaction: t });
                }

                const order = await Order.create({
                    userId: auth.sub,
                    status: 'pending',
                    totalAmount: total
                }, { transaction: t });

                for (const oi of orderItemsData) {
                    await OrderItem.create({ ...oi, orderId: order.id }, { transaction: t });
                }
                await t.commit();
                return Order.findByPk(order.id, { include: ['items'] });
            } catch (err) {
                await t.rollback();
                throw err;
            }
        }
    },

    // ─── Вложенные резолверы (связи между типами) ───────────
    Product: {
        // Один товар → его отзывы (из MongoDB)
        reviews: (parent) =>
            Review.find({ productId: String(parent.id) }).sort({ createdAt: -1 })
    },

    OrderItem: {
        product: (parent) => Product.findByPk(parent.productId)
    },

    // ISO-строка для DateTime
    DateTime: {
        __serialize: (value) => (value instanceof Date ? value.toISOString() : value)
    }
};

module.exports = resolvers;
