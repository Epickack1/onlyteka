import React, { useEffect, useState } from 'react';
import $api from '../api';

const STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  completed: 'Завершён',
  cancelled: 'Отменён'
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    $api.get('/orders/my')
      .then(res => setOrders(res.data))
      .catch(err => setError(err.response?.data?.error || 'Ошибка загрузки заказов'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка заказов…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (orders.length === 0) return <p>У вас пока нет заказов.</p>;

  return (
    <div className="orders-container" style={{ padding: 20 }}>
      <h2>Мои заказы</h2>
      {orders.map(order => (
        <div
          key={order.id}
          style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Заказ #{order.id.slice(0, 8)}</strong>
            <span>{STATUS_LABELS[order.status] || order.status}</span>
          </div>
          <p style={{ margin: '4px 0', color: '#666' }}>
            {new Date(order.createdAt).toLocaleString('ru-RU')}
          </p>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            {order.items?.map(it => (
              <li key={it.id}>
                {it.quantity} × {Number(it.priceAtPurchase).toFixed(2)} ₽
              </li>
            ))}
          </ul>
          <div style={{ textAlign: 'right', fontWeight: 600 }}>
            Итого: {Number(order.totalAmount).toFixed(2)} ₽
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyOrders;
