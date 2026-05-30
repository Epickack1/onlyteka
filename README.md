# onlyteka — Контрольные работы №3 и №4

Учебный fullstack-проект «онлайн-аптека» по дисциплине «Фронтенд и бэкенд
разработка», 4 семестр 2025/2026.

Один проект покрывает обе контрольные работы:

- **КР3** — результат практик **13–17**: Service Worker, Web App Manifest, HTTPS + App Shell, WebSocket, Web Push.
- **КР4** — результат практик **19–23**: PostgreSQL, MongoDB, Redis, балансировка нагрузки, Docker.

## Описание

`onlyteka` — прогрессивное веб-приложение (PWA) онлайн-аптеки с полноценным
бэкендом. В нём реализованы:

**PWA и real-time (КР3):**
- установка приложения на устройство и работа офлайн (Service Worker + Web App Manifest);
- кэширование App Shell и базовой статики с версионированием кэша;
- запуск по HTTPS с самоподписанными сертификатами (mkcert);
- обмен событиями в реальном времени по WebSocket (Socket.IO);
- Web Push-уведомления через VAPID, в том числе отложенные напоминания о приёме лекарств.

**Данные и инфраструктура (КР4):**
- хранение товаров, пользователей и заказов в PostgreSQL (Sequelize) со списанием склада в транзакции;
- хранение отзывов к товарам в MongoDB (Mongoose);
- кэширование каталога и пользователей в Redis с инвалидацией при изменениях;
- горизонтальная балансировка между двумя инстансами бэкенда через Nginx;
- запуск всего стека одной командой через Docker Compose.

## Стек технологий

- **Frontend:** React 19, React Router 7, Vite 8, Socket.IO Client, Service Worker API, Web Push API
- **Backend:** Node.js 20, Express 5, Sequelize, Mongoose, Socket.IO, web-push (VAPID), Redis client
- **Базы данных:** PostgreSQL 17 (товары, пользователи, заказы), MongoDB 7 (отзывы), Redis 7 (кэш)
- **Прокси / балансировка:** Nginx (раздаёт SPA, проксирует `/api`, `/graphql`, `/socket.io` на два бэкенда)
- **Транспорт:** HTTPS (mkcert) с автоматическим фолбэком на HTTP; WebSocket поверх того же сервера
- **Контейнеризация:** Docker, Docker Compose

## Реализованные практики

### КР3 — PWA и real-time (П13–П17)

**П13 — Service Worker.** Файл `client/public/sw.js`, регистрация из
`client/src/ServiceWorkerRegistration.js`. Версионированные кэши
(`onlyteka-static-v2`, `onlyteka-api-v2`): на `install` предварительно кэшируется
App Shell и иконки, на `activate` удаляются устаревшие версии кэшей, на `fetch`
статика отдаётся по стратегии cache-first — приложение открывается без сети.

**П14 — Web App Manifest.** Файл `client/public/manifest.json`: `name`,
`short_name`, `display: standalone`, `theme_color`, `background_color`, `lang: ru`
и иконки 16/32/192/512 (включая `purpose: "any maskable"`). Приложение
устанавливается на главный экран как нативное.

**П15 — HTTPS + App Shell.** Сертификаты в `client/certs` и `server/certs`
(генерируются через `mkcert`). Vite dev-сервер и Express-сервер поднимаются по
HTTPS при наличии сертификатов, иначе — HTTP-фолбэк (см. `client/vite.config.js`,
`server/index.js`). App Shell кэшируется Service Worker-ом и грузится мгновенно.

> HTTPS обязателен для PWA: установка приложения и Web Push работают только по
> HTTPS (исключение — `localhost`).

**П16 — WebSocket + Push.** Сервер: `server/socket.js` (Socket.IO) и
`server/notifications.js` (web-push, VAPID). Клиент: `client/src/lib/socket.js`,
подписка на Push — `client/src/components/PushToggle.jsx` и
`client/src/lib/PushUtils.js`; подписка сохраняется через `POST /api/push/subscribe`
(`server/routes/pushRoutes.js`). События: клиент шлёт `newTask` → сервер рассылает
всем `taskAdded` и параллельно отправляет Push подписчикам.

**П17 — Детализация Push (напоминания).** Событие `newReminder` (`server/socket.js`):
клиент задаёт текст и время напоминания о приёме лекарства, сервер планирует
`setTimeout` и в назначенный момент рассылает Push `«Напоминание о приёме»`.
На клиенте — `client/src/context/RemindersContext.jsx` и
`client/src/components/Reminders.jsx`.

### КР4 — данные и инфраструктура (П19–П23)

**П19 — PostgreSQL (реляционная СУБД).** Подключение через Sequelize
(`server/db/db.js`). Модели в `server/models/`: `User`, `Product`, `Order`,
`OrderItem`, `RefreshToken`; связи — в `server/models/associations.js`.
Оформление заказа (`server/controllers/orderController.js`) выполняется в
**транзакции** с блокировкой строк товара (`FOR UPDATE`), чтобы не уйти в
отрицательный остаток при параллельных заказах.

**П20 — MongoDB (NoSQL).** Подключение через Mongoose (`server/db/mongo.js`).
Отзывы к товарам хранятся в MongoDB — модель `server/models/Review.js`, логика в
`server/controllers/reviewController.js`. Смешанная персистентность:
структурированные данные — в PostgreSQL, гибкие документы (отзывы) — в MongoDB.

**П21 — Кэширование (Redis).** Подключение в `server/db/redis.js`, универсальный
middleware `server/middleware/cacheMiddleware.js`: каталог и список пользователей
кэшируются с TTL; при попадании ответ помечается `source: 'cache'`, при промахе —
`source: 'server'`; при изменениях кэш инвалидируется (в т.ч. по шаблону через `SCAN`).

**П22 — Балансировка нагрузки.** В `docker-compose.yml` поднимаются два инстанса —
`backend-1` и `backend-2`. Nginx (`client/nginx.conf`) описывает
`upstream onlyteka_backend` и распределяет запросы по round-robin с
`max_fails` / `fail_timeout`. Сервер добавляет заголовок `X-Backend-Port`, по
которому видно, какой инстанс обработал запрос.

**П23 — Контейнеризация (Docker).** Весь стек собирается и запускается через
Docker Compose: `server/Dockerfile` (node:20-alpine), `client/Dockerfile`
(multi-stage: сборка React → раздача статики nginx-ом), `docker-compose.yml`
(сервисы `client`, `backend-1`, `backend-2`, `postgres`, `mongo`, `redis`).

## Запуск проекта

### Требования
- Docker и Docker Compose
- ~2 ГБ свободной памяти (postgres + mongo + redis + 2 × backend + nginx)

### Через Docker (рекомендуется)

```bash
cp .env.example .env          # заполнить JWT_* и VAPID_*
docker compose up --build
```

Открыть: <http://localhost>

При первом запуске автоматически создаётся администратор
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` из `.env`).

### Локально (нужно для проверки HTTPS и PWA)

```bash
# Backend
cd server
cp .env.example .env          # указать локальные PG_*, MONGO_URL, REDIS_URL
npm install
npm run dev

# Frontend (в отдельном окне)
cd client
cp .env.example .env
npm install
npm run dev
```

Открыть: <https://localhost:5173> (для PWA/Push нужен HTTPS или `localhost`).

Сгенерировать VAPID-ключи для Web Push:

```bash
npx web-push generate-vapid-keys
```

## Проверка работоспособности

**КР3 (PWA / real-time):**
- **PWA:** DevTools → Application → Manifest (поля и иконки заполнены), Service Workers (статус `activated`); в адресной строке — иконка «Установить приложение».
- **Офлайн:** DevTools → Network → Offline, перезагрузить — приложение открывается из кэша.
- **WebSocket:** открыть две вкладки — событие из одной приходит во вторую (`taskAdded`).
- **Push / напоминания:** включить уведомления тумблером, поставить напоминание — по истечении времени приходит системное Push-уведомление.

**КР4 (данные / инфраструктура):**
- **PostgreSQL:** регистрация/вход, создание товара, оформление заказа — остаток на складе уменьшается.
- **MongoDB:** добавление отзыва к товару — отзыв сохраняется и отображается.
- **Redis:** первый запрос каталога — `source: 'server'`, повторный — `source: 'cache'`; после изменения товара кэш сбрасывается.
- **Балансировка:** в DevTools → Network у запросов `/api` заголовок `X-Backend-Port` чередуется между двумя бэкендами.
- **Docker:** `docker compose ps` показывает все сервисы в статусе `running`.

## Переменные окружения

Описаны в `server/.env.example`. Ключевые:

| Переменная | Описание | Относится к |
|---|---|---|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | ключи Web Push (VAPID) | КР3 |
| `VAPID_SUBJECT` | контакт для VAPID (`mailto:...`) | КР3 |
| `CLIENT_URL` | адрес фронтенда (CORS) | КР3 |
| `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD` | подключение к PostgreSQL | КР4 |
| `MONGO_URL` | подключение к MongoDB | КР4 |
| `REDIS_URL` | подключение к Redis | КР4 |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | секреты JWT | общее |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | первый администратор | общее |

## Структура проекта

```
onlyteka/
├── docker-compose.yml        client + 2×backend + postgres + mongo + redis (П23)
├── client/
│   ├── Dockerfile            multi-stage build → nginx (П23)
│   ├── nginx.conf            upstream-балансировка двух бэкендов (П22)
│   ├── certs/                HTTPS-сертификаты (П15)
│   ├── public/
│   │   ├── sw.js             Service Worker (П13)
│   │   └── manifest.json     Web App Manifest (П14)
│   └── src/
│       ├── ServiceWorkerRegistration.js
│       ├── lib/socket.js     WebSocket-клиент (П16)
│       ├── lib/PushUtils.js  Web Push (П16)
│       ├── components/PushToggle.jsx, Reminders.jsx (П16–П17)
│       └── context/RemindersContext.jsx (П17)
└── server/
    ├── Dockerfile            образ бэкенда (П23)
    ├── certs/                HTTPS-сертификаты (П15)
    ├── socket.js             Socket.IO + напоминания (П16–П17)
    ├── notifications.js      web-push / VAPID (П16)
    ├── routes/pushRoutes.js  POST /api/push/subscribe (П16)
    ├── db/
    │   ├── db.js             PostgreSQL / Sequelize (П19)
    │   ├── mongo.js          MongoDB / Mongoose (П20)
    │   └── redis.js          Redis (П21)
    ├── models/               User, Product, Order, OrderItem, Review (П19–П20)
    ├── middleware/cacheMiddleware.js   кэш + инвалидация (П21)
    └── controllers/orderController.js  транзакция со складом (П19)
```
