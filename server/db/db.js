const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.PG_DATABASE || 'onlyteka',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'postgres',
    {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        // SSL для облачных провайдеров (Render, Neon, etc.)
        ...(process.env.PG_SSL === 'true' && {
            dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
        })
    }
);

module.exports = sequelize;