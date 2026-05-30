const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validators');


router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/refresh', authController.refresh);

router.get('/me', authMiddleware, authController.getMe);

module.exports = router;    