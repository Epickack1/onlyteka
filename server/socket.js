// server/socket.js
// Инициализация Socket.IO + регистрация бизнес-событий аптеки.
// Здесь же подписываемся на 'newReminder' для практики 17.

const { Server } = require('socket.io');
const { broadcast, reminders } = require('./notifications');

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket) => {
        console.log('[socket] подключён:', socket.id);

        // Новый товар в корзине / новый заказ — уведомляем всех подключённых клиентов
        socket.on('newTask', (task) => {
            io.emit('taskAdded', task);

            // Параллельно шлём push всем подписавшимся
            broadcast({
                title: 'Onlyteka',
                body: task.text || 'Новое событие в аптеке'
            });
        });

        // Практика 17: клиент попросил поставить напоминание о приёме лекарства
        socket.on('newReminder', (reminder) => {
            const { id, text, reminderTime } = reminder;
            const delay = reminderTime - Date.now();
            if (!id || !text || delay <= 0) return;

            // Если уже есть таймер для этого id — сбрасываем
            if (reminders.has(id)) {
                clearTimeout(reminders.get(id).timeoutId);
            }

            const timeoutId = setTimeout(() => {
                broadcast({
                    title: 'Напоминание о приёме',
                    body: text,
                    reminderId: id
                });
                reminders.delete(id);
            }, delay);

            reminders.set(id, { timeoutId, text, reminderTime });
            console.log(`[reminder] запланировано #${id} через ${Math.round(delay / 1000)}с`);
        });

        socket.on('disconnect', () => {
            console.log('[socket] отключён:', socket.id);
        });
    });

    return io;
}

module.exports = { initSocket };