const { DataTypes } = require('sequelize');
const sequelize = require('../db/db');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    // Снимок цены на момент покупки — чтобы не меняться при смене цены товара
    priceAtPurchase: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 }
    }
}, {
    tableName: 'order_items',
    timestamps: true
});

module.exports = OrderItem;
