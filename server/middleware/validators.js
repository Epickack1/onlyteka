const validateRegister = (req, res, next) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "Пароль должен быть не менее 8 символов" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Некорректный email" });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "email и password обязательны" });
    }
    next();
};

const validateProduct = (req, res, next) => {
    const { title, category, description, price, stock } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "Все поля товара обязательны" });
    }
    if (Number(price) < 0 || isNaN(Number(price))) {
        return res.status(400).json({ error: "Цена должна быть неотрицательным числом" });
    }
    if (title.length > 200) {
        return res.status(400).json({ error: "Название слишком длинное" });
    }
    if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
        return res.status(400).json({ error: "Количество на складе должно быть неотрицательным целым числом" });
    }

    next();
};

module.exports = { validateRegister, validateLogin, validateProduct };