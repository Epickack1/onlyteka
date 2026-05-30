require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const sequelize = require('./db/db');
const seedAdmin = require('./db/seed');
const connectMongo = require('./db/mongo');
const { initRedis } = require('./db/redis');
const setupAssociations = require('./models/associations');

const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const pushRoutes = require('./routes/pushRoutes');
const orderRoutes = require('./routes/orderRoutes');

const { configureWebPush } = require('./notifications');
const { initSocket } = require('./socket');
const attachGraphQL = require('./graphql');
const { connect: connectRabbit } = require('./queue/rabbit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Логируем порт, на котором сервер обработал запрос — для отладки балансировки.
// Должен идти ДО маршрутов: иначе обработчик уже завершит ответ и заголовок не выставится.
app.use((req, res, next) => {
    res.setHeader('X-Backend-Port', PORT);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);

// Пытаемся загрузить HTTPS-сертификаты. Если не найдены — используем HTTP.
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'localhost+2-key.pem');
const certPath = path.join(certDir, 'localhost+2.pem');

const useHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);
const protocol = useHttps ? 'HTTPS' : 'HTTP';

const server = useHttps
    ? https.createServer(
        { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
        app
    )
    : http.createServer(app);

initSocket(server);

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('БД подключена');

        setupAssociations();
        await sequelize.sync({ alter: true });
        console.log('Таблицы синхронизированы');

        await seedAdmin();

        configureWebPush();
        await connectMongo();
        await initRedis();
        await connectRabbit();
        await attachGraphQL(app);

        const scheme = useHttps ? 'https' : 'http';
        server.listen(PORT, () => {
            console.log(`Сервер (${protocol} + WebSocket) запущен на ${scheme}://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Ошибка при старте:', err);
        process.exit(1);
    }
};

start();
