// client/src/components/About.jsx
import React from 'react';

const About = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
      <h2>О приложении Onlyteka</h2>
      <p><strong>Версия:</strong> 1.0.0</p>
      <p>
        Onlyteka — это прогрессивное веб-приложение (PWA) для онлайн-аптеки.
        Поддерживает работу в офлайн-режиме, установку на устройство и push-уведомления
        о готовности заказа или напоминаниях о приёме лекарств.
      </p>

      <h3>Возможности</h3>
      <ul>
        <li>Каталог лекарственных средств с фильтрацией</li>
        <li>Корзина с локальным сохранением</li>
        <li>Работа без интернета — данные доступны из кэша</li>
        <li>Установка на домашний экран как нативное приложение</li>
        <li>Напоминания о приёме лекарств через push-уведомления</li>
      </ul>

      <h3>Технологии</h3>
      <ul>
        <li>Frontend: React 19, Vite, React Router</li>
        <li>Backend: Node.js, Express, SQLite</li>
        <li>PWA: Service Worker, Web App Manifest, Web Push API</li>
        <li>Realtime: Socket.IO</li>
      </ul>
    </div>
  );
};

export default About;