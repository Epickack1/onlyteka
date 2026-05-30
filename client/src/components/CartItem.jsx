import React from 'react';
import { useCart } from '../context/CartContext';
import '../styles/CartItem.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.title}</h4>
        <p className="cart-item-category">{item.category}</p>
      </div>
      <div className="cart-item-controls">
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
        >
          -
        </button>
        <span className="qty-val">{item.quantity}</span>
        <button
          className="qty-btn"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
        >
          +
        </button>
      </div>
      <div className="cart-item-price">
        {item.price * item.quantity} ₽
      </div>
      <button className="remove-btn" onClick={() => removeItem(item.id)}>
        ✕
      </button>
    </div>
  );
};

export default CartItem;
