import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import $api from '../api';
import CartItem from './CartItem';
import '../styles/Cart.css';

const Cart = () => {
  const { items, total, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const payload = {
        items: items.map(it => ({ productId: it.id, quantity: it.quantity }))
      };
      const res = await $api.post('/orders', payload);
      clear();
      alert(`Заказ #${res.data.id.slice(0, 8)} оформлен!`);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось оформить заказ');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <h2 className="cart-title">Корзина</h2>
        <p>Корзина пуста. <Link to="/">Перейти в каталог</Link></p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2 className="cart-title">Корзина</h2>

      <div className="cart-content">
        <div className="cart-items-list">
          {items.map(item => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="cart-summary">
          <h3>Итого</h3>
          <div className="summary-row">
            <span>Товары ({items.length})</span>
            <span>{total} ₽</span>
          </div>
          <div className="summary-row">
            <span>Доставка</span>
            <span className="free-shipping">Бесплатно</span>
          </div>
          <hr />
          <div className="summary-total">
            <span>К оплате</span>
            <span>{total} ₽</span>
          </div>
          {error && <p style={{ color: 'red', margin: '8px 0' }}>{error}</p>}
          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={submitting}
          >
            {submitting ? 'Оформление…' : 'Оформить заказ'}
          </button>
          <button
            className="clear-cart-btn"
            onClick={clear}
            style={{ marginTop: 8 }}
            disabled={submitting}
          >
            Очистить корзину
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
