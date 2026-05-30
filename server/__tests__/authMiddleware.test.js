const jwt = require('jsonwebtoken');

// Подставляем стабильный секрет ДО загрузки модуля с конфигом
process.env.JWT_ACCESS_SECRET = 'test-access-secret';

const authMiddleware = require('../middleware/authMiddleware');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('authMiddleware', () => {
    test('401 без заголовка Authorization', () => {
        const req = { headers: {} };
        const res = mockRes();
        const next = jest.fn();
        authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('401 при неверной схеме', () => {
        const req = { headers: { authorization: 'Basic xyz' } };
        const res = mockRes();
        const next = jest.fn();
        authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('401 при невалидном токене', () => {
        const req = { headers: { authorization: 'Bearer not-a-real-jwt' } };
        const res = mockRes();
        const next = jest.fn();
        authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('пропускает валидный токен и кладёт payload в req.user', () => {
        const payload = { sub: 'user-1', role: 'admin', email: 'a@b.com' };
        const token = jwt.sign(payload, 'test-access-secret', { expiresIn: '5m' });

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toMatchObject(payload);
    });
});
