// server/controllers/reviewController.js
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

// Автор отзыва или администратор может его править/удалять.
// userId в Mongo хранится строкой, поэтому сравниваем как строки.
const canModify = (review, user) =>
    String(review.userId) === String(user.sub) || user.role === 'admin';

// GET /api/reviews?productId=...   — все отзывы по товару
const getReviews = async (req, res) => {
    try {
        const { productId } = req.query;
        const filter = productId ? { productId } : {};
        const reviews = await Review.find(filter).sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при получении отзывов' });
    }
};

// GET /api/reviews/:id
const getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Отзыв не найден' });
        res.status(200).json(review);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при получении отзыва' });
    }
};

// POST /api/reviews   — нужна авторизация (req.user установлен authMiddleware)
const createReview = async (req, res) => {
    try {
        const { productId, rating, text } = req.body;
        const userId = req.user.sub;

        // Товар хранится в PostgreSQL, отзыв — в MongoDB.
        // Грузим товар и автора параллельно, раз они не зависят друг от друга.
        const [product, user] = await Promise.all([
            Product.findByPk(productId),
            User.findByPk(userId)
        ]);

        if (!product) return res.status(404).json({ error: 'Товар не найден' });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        // Денормализуем имя автора для удобного чтения списка отзывов
        const review = await Review.create({
            productId,
            userId,
            authorName: `${user.first_name} ${user.last_name}`,
            rating,
            text
        });

        res.status(201).json(review);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

// PATCH /api/reviews/:id   — только автор (или админ) может править свой отзыв
const updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Отзыв не найден' });
        if (!canModify(review, req.user)) {
            return res.status(403).json({ error: 'Нет прав на изменение' });
        }

        const { rating, text } = req.body;
        if (rating !== undefined) review.rating = rating;
        if (text !== undefined) review.text = text;
        await review.save();

        res.status(200).json(review);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

// DELETE /api/reviews/:id   — автор или админ
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Отзыв не найден' });
        if (!canModify(review, req.user)) {
            return res.status(403).json({ error: 'Нет прав на удаление' });
        }

        await review.deleteOne();
        res.status(200).json({ message: 'Отзыв удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при удалении' });
    }
};

module.exports = { getReviews, getReviewById, createReview, updateReview, deleteReview };
