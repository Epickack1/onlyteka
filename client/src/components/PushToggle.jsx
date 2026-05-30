// client/src/components/PushToggle.jsx
// Кнопка вкл/выкл push-уведомлений. Может встраиваться в Header или любую страницу.

import React, { useEffect, useState } from 'react';
import {
    isPushSupported,
    getCurrentSubscription,
    subscribeToPush,
    unsubscribeFromPush
} from '../lib/PushUtils';

const PushToggle = () => {
    const [supported, setSupported] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!isPushSupported()) {
            setSupported(false);
            return;
        }
        setSupported(true);
        getCurrentSubscription().then((sub) => setSubscribed(!!sub));
    }, []);

    if (!supported) return null;

    const handleClick = async () => {
        setBusy(true);
        try {
            if (subscribed) {
                await unsubscribeFromPush();
                setSubscribed(false);
            } else {
                await subscribeToPush();
                setSubscribed(true);
            }
        } catch (err) {
            alert(err.message || 'Ошибка управления уведомлениями');
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={busy}
            style={{
                padding: '6px 12px',
                background: subscribed ? '#ff4d4f' : '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: busy ? 'wait' : 'pointer'
            }}
        >
            {subscribed ? 'Отключить уведомления' : 'Включить уведомления'}
        </button>
    );
};

export default PushToggle;
