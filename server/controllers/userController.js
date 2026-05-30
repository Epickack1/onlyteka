const bcrypt = require('bcrypt');
const User = require('../models/User');
const { invalidateCache } = require('../middleware/cacheMiddleware');

// Сбрасываем и общий список пользователей, и карточку конкретного пользователя,
// чтобы после изменения не отдавать устаревшие данные из кэша.
async function invalidateUser(userId) {
    await invalidateCache('users:all');
    await invalidateCache(`users:${userId}`);
}

// Получить список всех пользователей
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }, // не отдаём пароль
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при получении пользователей" });
    }
};

// Получить одного пользователя по id
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ error: "Пользователь не найден" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Ошибка" });
    }
};

// Обновить пользователя (роль, имя, фамилия, email; пароль отдельной логикой)
const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "Пользователь не найден" });

        // Whitelist полей — только то, что админу можно менять
        const { email, first_name, last_name, role, password } = req.body;
        const updateData = {};

        if (email !== undefined) updateData.email = email;
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;

        if (role !== undefined) {
            if (!['user', 'seller', 'admin'].includes(role)) {
                return res.status(400).json({ error: "Недопустимая роль" });
            }
            updateData.role = role;
        }

        // Если админ хочет сбросить пароль пользователю
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);
        await invalidateUser(user.id);

        const { password: _, ...safeUser } = user.toJSON();
        res.json(safeUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при обновлении" });
    }
};

const blockUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "Пользователь не найден" });

        // Нельзя заблокировать самого себя
        if (user.id === req.user.sub) {
            return res.status(400).json({ error: "Нельзя заблокировать самого себя" });
        }

        await user.update({ isBlocked: true });
        await invalidateUser(user.id);

        res.json({ message: "Пользователь заблокирован", user: { id: user.id, isBlocked: true } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при блокировке" });
    }
};

const unblockUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "Пользователь не найден" });

        await user.update({ isBlocked: false });
        await invalidateUser(user.id);

        res.json({ message: "Пользователь разблокирован", user: { id: user.id, isBlocked: false } });
    } catch (err) {
        res.status(500).json({ error: "Ошибка" });
    }
};

module.exports = { getUsers, getUserById, updateUser, blockUser, unblockUser };
