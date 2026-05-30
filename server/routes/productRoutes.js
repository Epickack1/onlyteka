// server/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateProduct } = require('../middleware/validators');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const PRODUCTS_CACHE_TTL = 600;  // 10 минут (методичка)

router.get('/',
    cacheMiddleware(() => 'products:all', PRODUCTS_CACHE_TTL),
    productController.getProducts
);

router.get('/:id',
    cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
    productController.getProductById
);

router.post('/',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    validateProduct,
    productController.createProduct
);

router.put('/:id',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    validateProduct,
    productController.updateProduct
);

router.delete('/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    productController.deleteProduct
);

module.exports = router;