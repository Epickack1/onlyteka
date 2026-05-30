# onlyteka

Учебный fullstack-проект «онлайн-аптека» — Контрольная работа №5 по дисциплине
«Фронтенд и бэкенд разработка», 4 семестр 2025/2026.
Реализован вариант **E-commerce** из [Практики 28](https://github.com/darrmr/Frontend_and_backend_dev_26_2/blob/main/practice_28.md).

## Описание

Веб-приложение для онлайн-аптеки:

- каталог товаров с поиском и фильтрацией;
- регистрация и авторизация (JWT access + refresh) с разделением ролей `user` / `seller` / `admin` (RBAC);
- корзина (синхронизируется с `localStorage`, работает офлайн);
- оформление заказа со списанием товара со склада в транзакции;
- история заказов пользователя;
- отзывы к товарам (MongoDB);
- кэширование каталога и пользователей в Redis с инвалидацией;
- Web Push-уведомления (VAPID) и Service Worker / PWA;
- WebSocket-канал (Socket.IO) для real-time событий;
- балансировка нагрузки между двумя инстансами бэкенда через Nginx.

## Стек технологий

- **Frontend:** React 19, React Router 7, Vite 8, Axios, Socket.IO Client, Service Worker (PWA)
- **Backend:** Node.js 20, Express 5, Sequelize, Mongoose, Socket.IO, bcrypt, jsonwebtoken, web-push
- **Базы данных:** PostgreSQL 17 (товары, пользователи, заказы), MongoDB 7 (отзывы), Redis 7 (кэш)
- **Авторизация:** JWT (access + refresh) + RBAC (user / seller / admin)
- **Контейнеризация:** Docker, Docker Compose
- **Прокси / балансировка:** Nginx (раздаёт SPA, проксирует `/api` и `/socket.io` на два бэкенда)

## Запуск проекта

### Требования

- Docker и Docker Compose
- ~2 ГБ свободной памяти (postgres + mongo + redis + 2 × backend + nginx)

### Шаги

1. Клонировать репозиторий:
   ```bash
   git clone <url>
   cd onlyteka
   ```
2. Скопировать файл переменных окружения и заполнить секреты:
   ```bash
   cp .env.example .env
   # отредактируйте JWT_*_SECRET и VAPID_*
   ```
   Сгенерировать VAPID-пару можно командой:
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Запустить весь стек:
   ```bash
   docker compose up --build
   ```
4. Открыть в браузере: <http://localhost>

При первом запуске автоматически создаётся пользователь-администратор
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` из `.env`).

### Локальный запуск без Docker

```bash
# Backend
cd server
cp .env.example .env   # отредактируйте под локальные БД
npm install
npm run dev

# Frontend (в отдельном окне)
cd client
cp .env.example .env
npm install
npm run dev
```

## Переменные окружения

Все переменные описаны в `.env.example` (корневой) и `server/.env.example`.
Ключевые:

| Переменная | Описание |
|---|---|
| `JWT_ACCESS_SECRET` | секрет для access-токенов |
| `JWT_REFRESH_SECRET` | секрет для refresh-токенов |
| `ACCESS_EXPIRES_IN` | время жизни access-токена (по умолчанию `15m`) |
| `REFRESH_EXPIRES_IN` | время жизни refresh-токена (по умолчанию `7d`) |
| `PG_*` | подключение к PostgreSQL |
| `MONGO_URL` | подключение к MongoDB |
| `REDIS_URL` | подключение к Redis |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | ключи Web Push |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | первый администратор |

## API (REST)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | public | регистрация |
| POST | `/api/auth/login` | public | вход, возвращает `accessToken` + `refreshToken` |
| POST | `/api/auth/refresh` | refresh-token | обновление пары токенов |
| GET  | `/api/auth/me` | auth | текущий пользователь |
| GET  | `/api/products` | public | каталог (кэш Redis, 10 мин) |
| GET  | `/api/products/:id` | public | товар по id |
| POST | `/api/products` | seller / admin | создать товар |
| PUT  | `/api/products/:id` | seller / admin | обновить товар |
| DELETE | `/api/products/:id` | admin | удалить товар |
| GET  | `/api/reviews?productId=` | public | отзывы по товару (MongoDB) |
| POST | `/api/reviews` | auth | создать отзыв |
| POST | `/api/orders` | auth | оформить заказ (списание со склада в транзакции) |
| GET  | `/api/orders/my` | auth | мои заказы |
| GET  | `/api/orders` | admin | все заказы |
| PATCH | `/api/orders/:id` | admin | смена статуса заказа |
| GET  | `/api/users` | admin | список пользователей (кэш) |
| GET  | `/api/users/:id` | admin | пользователь по id |
| PUT  | `/api/users/:id` | admin | обновление |
| DELETE | `/api/users/:id` | admin | блокировка |
| POST | `/api/users/:id/unblock` | admin | разблокировка |
| POST | `/api/push/subscribe` | auth | подписаться на Web Push |

## Структура проекта

```
onlyteka/
├── client/                React SPA (Vite)
│   ├── src/
│   │   ├── api/           axios-инстанс с авто-refresh
│   │   ├── components/    UI-компоненты (Catalog, Cart, MyOrders, …)
│   │   ├── context/       AuthContext, CartContext, RemindersContext
│   │   └── styles/
│   ├── Dockerfile         multi-stage: node build → nginx serve
│   └── nginx.conf         SPA-fallback + прокси /api и /socket.io
├── server/                Express API
│   ├── controllers/       логика маршрутов (auth, products, orders, reviews, users)
│   ├── middleware/        auth, role, cache, validators
│   ├── models/            Sequelize: User, Product, Order, OrderItem, RefreshToken; Mongoose: Review
│   ├── routes/
│   ├── db/                Postgres / Mongo / Redis инициализация
│   ├── notifications.js   web-push
│   ├── socket.js          Socket.IO
│   └── Dockerfile
├── docker-compose.yml     client + 2×backend + postgres + mongo + redis
├── .env.example
└── README.md
```

## Запуск тестов

```bash
cd server
npm install
npm test               # запуск всех тестов
npm run test:coverage  # с отчётом покрытия (coverage/index.html)
```

Покрыты тестами: валидаторы, middleware (auth, role, cache), контроллер
заказов с моками транзакций и моделей, producer очереди.
