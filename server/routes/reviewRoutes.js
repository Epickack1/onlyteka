const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReviewById);

router.post('/', authMiddleware, reviewController.createReview);
router.patch('/:id', authMiddleware, reviewController.updateReview);
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;