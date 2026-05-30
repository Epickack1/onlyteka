const { validateRegister, validateLogin, validateProduct } = require('../middleware/validators');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('validators', () => {
    describe('validateRegister', () => {
        test('пропускает корректные данные', () => {
            const req = { body: { email: 'a@b.com', first_name: 'A', last_name: 'B', password: 'longpass1' } };
            const res = mockRes();
            const next = jest.fn();

            validateRegister(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('отклоняет короткий пароль', () => {
            const req = { body: { email: 'a@b.com', first_name: 'A', last_name: 'B', password: 'short' } };
            const res = mockRes();
            const next = jest.fn();

            validateRegister(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('отклоняет некорректный email', () => {
            const req = { body: { email: 'broken', first_name: 'A', last_name: 'B', password: 'longpass1' } };
            const res = mockRes();
            const next = jest.fn();

            validateRegister(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('требует все поля', () => {
            const req = { body: { email: 'a@b.com' } };
            const res = mockRes();
            const next = jest.fn();

            validateRegister(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('validateLogin', () => {
        test('пропускает email + password', () => {
            const req = { body: { email: 'a@b.com', password: 'x' } };
            const res = mockRes();
            const next = jest.fn();

            validateLogin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('400 без полей', () => {
            const req = { body: {} };
            const res = mockRes();
            const next = jest.fn();

            validateLogin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('validateProduct', () => {
        const ok = { title: 'Magnesium', category: 'Витамины', description: 'desc', price: 100 };

        test('пропускает корректный товар без stock', () => {
            const req = { body: ok };
            const res = mockRes();
            const next = jest.fn();
            validateProduct(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('пропускает с валидным stock', () => {
            const req = { body: { ...ok, stock: 10 } };
            const res = mockRes();
            const next = jest.fn();
            validateProduct(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('отклоняет отрицательную цену', () => {
            const req = { body: { ...ok, price: -1 } };
            const res = mockRes();
            const next = jest.fn();
            validateProduct(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('отклоняет отрицательный stock', () => {
            const req = { body: { ...ok, stock: -5 } };
            const res = mockRes();
            const next = jest.fn();
            validateProduct(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('отклоняет нечисловую цену', () => {
            const req = { body: { ...ok, price: 'abc' } };
            const res = mockRes();
            const next = jest.fn();
            validateProduct(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('отклоняет слишком длинное название', () => {
            const req = { body: { ...ok, title: 'x'.repeat(201) } };
            const res = mockRes();
            const next = jest.fn();
            validateProduct(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('требует все обязательные поля', () => {
            const req = { body: { title: 'x' } };
            const res = mockRes();
            const next = jest.fn();
            validateProduct(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
