// client/src/context/CartContext.jsx
// Минимальный контекст корзины с персистентностью в localStorage.
// Это нужно, чтобы у пользователя были реальные данные, которые
// сохраняются между сессиями и доступны при офлайн-режиме.

import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'onlyteka:cart';

export function CartProvider({ children }) {
    // Ленивая инициализация: читаем из localStorage один раз при монтировании
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // Синхронизируем состояние с localStorage при каждом изменении.
    // Так корзина переживёт перезагрузку и будет видна офлайн.
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    function addItem(product) {
        setItems((prev) => {
            const existing = prev.find((it) => it.id === product.id);
            if (existing) {
                // Уже в корзине — увеличиваем количество
                return prev.map((it) =>
                    it.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
                );
            }
            // Новый товар
            return [...prev, {
                id: product.id,
                title: product.title,
                price: product.price,
                category: product.category,
                quantity: 1
            }];
        });
    }

    function removeItem(productId) {
        setItems((prev) => prev.filter((it) => it.id !== productId));
    }

    function updateQuantity(productId, quantity) {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems((prev) =>
            prev.map((it) => (it.id === productId ? { ...it, quantity } : it))
        );
    }

    function clear() {
        setItems([]);
    }

    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error('useCart должен использоваться внутри CartProvider');
    }
    return ctx;
}