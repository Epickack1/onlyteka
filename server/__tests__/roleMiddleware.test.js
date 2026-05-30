const roleMiddleware = require('../middleware/roleMiddleware');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('roleMiddleware', () => {
    test('401 если пользователь не авторизован', () => {
        const mw = roleMiddleware(['admin']);
        const req = {};
        const res = mockRes();
        const next = jest.fn();
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('403 если роль не входит в список', () => {
        const mw = roleMiddleware(['admin']);
        const req = { user: { role: 'user' } };
        const res = mockRes();
        const next = jest.fn();
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('пропускает если роль в списке', () => {
        const mw = roleMiddleware(['admin', 'seller']);
        const req = { user: { role: 'seller' } };
        const res = mockRes();
        const next = jest.fn();
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
