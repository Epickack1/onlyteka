// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const USERS_CACHE_TTL = 60;

router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/',
    cacheMiddleware(() => 'users:all', USERS_CACHE_TTL),
    userController.getUsers
);

router.get('/:id',
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
    userController.getUserById
);

router.put('/:id', userController.updateUser);
router.delete('/:id', userController.blockUser);
router.post('/:id/unblock', userController.unblockUser);

module.exports = router;