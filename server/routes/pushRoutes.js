// server/routes/pushRoutes.js
const express = require('express');
const router = express.Router();
const {
    addSubscription,
    removeSubscription,
    broadcast,
    reminders
} = require('../notifications');

// POST /api/push/subscribe — сохранить подписку клиента
router.post('/subscribe', (req, res) => {
    const ok = addSubscription(req.body);
    if (!ok) return res.status(400).json({ error: 'Invalid subscription' });
    res.status(201).json({ message: 'Подписка сохранена' });
});

// POST /api/push/unsubscribe — удалить подписку
router.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint required' });
    removeSubscription(endpoint);
    res.status(200).json({ message: 'Подписка удалена' });
});

// POST /api/push/snooze?reminderId=...  — отложить напоминание на 5 минут (для практики 17)
router.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);

    const SNOOZE_MS = 5 * 60 * 1000;
    const newTimeoutId = setTimeout(() => {
        broadcast({
            title: 'Напоминание (отложено)',
            body: reminder.text,
            reminderId
        });
        reminders.delete(reminderId);
    }, SNOOZE_MS);

    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + SNOOZE_MS
    });

    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

module.exports = router;