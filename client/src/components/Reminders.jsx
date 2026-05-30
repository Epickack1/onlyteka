// client/src/components/Reminders.jsx
// Страница управления напоминаниями о приёме лекарств.

import React, { useState } from 'react';
import { useReminders } from '../context/RemindersContext';

const Reminders = () => {
    const { reminders, addReminder, removeReminder } = useReminders();
    const [text, setText] = useState('');
    const [datetime, setDatetime] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || !datetime) return;

        const timestamp = new Date(datetime).getTime();
        if (timestamp <= Date.now()) {
            alert('Дата напоминания должна быть в будущем');
            return;
        }

        addReminder({ text: trimmed, reminderTime: timestamp });
        setText('');
        setDatetime('');
    };

    return (
        <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
            <h2>Напоминания о приёме лекарств</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Например: принять аспирин"
                    required
                    style={{ flex: '2 1 240px', padding: 8 }}
                />
                <input
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    required
                    style={{ flex: '1 1 180px', padding: 8 }}
                />
                <button
                    type="submit"
                    style={{ padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: 4 }}
                >
                    Добавить
                </button>
            </form>

            {reminders.length === 0 ? (
                <p style={{ color: '#666' }}>Напоминаний пока нет</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {reminders.map((r) => (
                        <li
                            key={r.id}
                            style={{
                                padding: 12,
                                marginBottom: 8,
                                border: '1px solid #e0e0e0',
                                borderRadius: 4,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <div><strong>{r.text}</strong></div>
                                <small style={{ color: '#666' }}>
                                    {new Date(r.reminderTime).toLocaleString('ru-RU')}
                                </small>
                            </div>
                            <button
                                onClick={() => removeReminder(r.id)}
                                style={{
                                    background: '#ff4d4f',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    cursor: 'pointer'
                                }}
                            >
                                Удалить
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Reminders;