require('dotenv').config();

module.exports = {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRES_IN: process.env.ACCESS_EXPIRES_IN || '15m',
    REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || '7d',
};