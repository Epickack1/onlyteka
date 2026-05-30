const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
    ACCESS_SECRET,
    REFRESH_SECRET,
    ACCESS_EXPIRES_IN,
    REFRESH_EXPIRES_IN
} = require('../config/jwt');

const generateAccessToken = (user) => {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { sub: user.id, role: user.role },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
};

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const register = async (req, res) => {
    try {
        const { email, first_name, last_name, password } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: "Пользователь с таким email уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            first_name,
            last_name,
            password: hashedPassword,
            role: 'user'
        });

        const { password: _, ...safeUser } = newUser.toJSON();
        res.status(201).json(safeUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при регистрации" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        if (user.isBlocked) {
            return res.status(403).json({ error: "Пользователь заблокирован" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Неверный пароль" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await RefreshToken.create({
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
        });

        res.json({
            message: "Успешный вход",
            accessToken,
            refreshToken
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при входе" });
    }
};

const refresh = async (req, res) => {
    try {
        const header = req.headers.authorization || "";
        const [scheme, token] = header.split(" ");
        const refreshToken = (scheme === "Bearer") ? token : null;

        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        const stored = await RefreshToken.findOne({ where: { token: refreshToken } });
        if (!stored) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = await User.findByPk(payload.sub);

        if (!user || user.isBlocked) {
            return res.status(401).json({ error: "User not found or blocked" });
        }

        await stored.destroy();

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        await RefreshToken.create({
            token: newRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
        });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.sub);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { password, ...safeUser } = user.toJSON();
        res.json(safeUser);
    } catch (err) {
        res.status(500).json({ error: "Ошибка" });
    }
};

module.exports = { register, login, refresh, getMe };