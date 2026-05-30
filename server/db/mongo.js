const mongoose = require('mongoose');

async function connectMongo() {
    const url = process.env.MONGO_URL || 'mongodb://localhost:27017/onlyteka';
    try {
        await mongoose.connect(url);
        console.log('MongoDB подключена:', url);
    } catch (err) {
        console.error('Ошибка подключения MongoDB:', err.message);
        // Не падаем — приложение должно работать даже без MongoDB
    }
}

module.exports = connectMongo;