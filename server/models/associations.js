// server/models/associations.js
// Все Sequelize-связи в одном месте. Вызывается один раз при старте,
// до sequelize.sync(), чтобы внешние ключи попали в схему.

const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const RefreshToken = require('./RefreshToken');

function setupAssociations() {
    // User 1—N Order
    User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Order.belongsTo(User, { foreignKey: 'userId' });

    // Order 1—N OrderItem
    Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId', onDelete: 'CASCADE' });
    OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

    // Product 1—N OrderItem (historical; продукт не удаляется при наличии заказов)
    Product.hasMany(OrderItem, { foreignKey: 'productId', onDelete: 'RESTRICT' });
    OrderItem.belongsTo(Product, { foreignKey: 'productId' });

    // User 1—N RefreshToken
    User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
    RefreshToken.belongsTo(User, { foreignKey: 'userId' });
}

module.exports = setupAssociations;
