// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, orderController.createOrder);
router.get('/my', authMiddleware, orderController.getMyOrders);

router.get('/', authMiddleware, roleMiddleware(['admin']), orderController.getAllOrders);
router.patch('/:id', authMiddleware, roleMiddleware(['admin']), orderController.updateOrderStatus);

module.exports = router;
