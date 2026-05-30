// client/src/context/RemindersContext.jsx
// Хранилище напоминаний о приёме лекарств.
// Структура напоминания: { id, text, reminderTime (timestamp ms) }

import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../lib/socket';

const RemindersContext = createContext(null);
const STORAGE_KEY = 'onlyteka:reminders';

export function RemindersProvider({ children }) {
    const [reminders, setReminders] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    }, [reminders]);

    function addReminder({ text, reminderTime }) {
        const newReminder = {
            id: Date.now(),
            text,
            reminderTime           // timestamp ms
        };
        setReminders((prev) => [...prev, newReminder]);

        // Просим сервер запланировать push в указанное время
        socket.emit('newReminder', newReminder);
        return newReminder;
    }

    function removeReminder(id) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
    }

    return (
        <RemindersContext.Provider value={{ reminders, addReminder, removeReminder }}>
            {children}
        </RemindersContext.Provider>
    );
}

export function useReminders() {
    const ctx = useContext(RemindersContext);
    if (!ctx) throw new Error('useReminders должен использоваться внутри RemindersProvider');
    return ctx;
}