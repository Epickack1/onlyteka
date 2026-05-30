// server/controllers/productController.js
const Product = require('../models/Product');
const { saveToCache, invalidateCache } = require('../middleware/cacheMiddleware');

const createProduct = async (req, res) => {
    try {
        const { title, category, description, price, stock } = req.body;
        const newProduct = await Product.create({
            title, category, description, price,
            stock: stock !== undefined ? Number(stock) : 0
        });

        await invalidateCache('products:all');

        res.status(201).json(newProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при создании товара" });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.findAll({ order: [['createdAt', 'DESC']] });

        // Если запрос прошёл через cacheMiddleware — сохраняем
        if (req.cacheKey) {
            await saveToCache(req.cacheKey, products, req.cacheTTL);
        }

        res.status(200).json({ source: 'server', data: products });
    } catch (err) {
        res.status(500).json({ error: "Ошибка" });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: "Товар не найден" });

        if (req.cacheKey) {
            await saveToCache(req.cacheKey, product, req.cacheTTL);
        }

        res.status(200).json({ source: 'server', data: product });
    } catch (err) {
        res.status(500).json({ error: "Ошибка" });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: "Товар не найден" });

        const { title, category, description, price, stock } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (stock !== undefined) updateData.stock = Number(stock);

        await product.update(updateData);

        // Инвалидируем кэш и общего списка, и конкретного товара
        await invalidateCache('products:all');
        await invalidateCache(`products:${product.id}`);

        res.status(200).json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при обновлении" });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: "Товар не найден" });

        const productId = product.id;
        await product.destroy();

        await invalidateCache('products:all');
        await invalidateCache(`products:${productId}`);

        res.status(200).json({ message: "Товар удален" });
    } catch (err) {
        res.status(500).json({ error: "Ошибка при удалении" });
    }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };