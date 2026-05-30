import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product, onDelete }) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const canEdit = user && (user.role === 'seller' || user.role === 'admin');
  const canDelete = user && user.role === 'admin';
  const outOfStock = (product.stock ?? 0) <= 0;

  return (
    <div className="product-card">
      <div className="product-info">
        <div className="product-price-row">
          <span className="current-price">{product.price} ₽</span>
        </div>
        <h3 className="product-name">{product.title}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-description" style={{ fontSize: '12px', color: '#666' }}>
          {product.description}
        </p>
        <p className="product-stock" style={{ fontSize: '12px', color: outOfStock ? '#c00' : '#2e7d32' }}>
          {outOfStock ? 'Нет в наличии' : `В наличии: ${product.stock} шт.`}
        </p>

        <div className="card-actions" style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            className="add-to-cart-btn"
            onClick={() => addItem(product)}
            disabled={outOfStock}
          >
            {outOfStock ? 'Нет в наличии' : 'В корзину'}
          </button>

          {canEdit && (
            <Link
              to={`/edit/${product.id}`}
              style={{
                backgroundColor: '#1890ff',
                color: 'white',
                padding: '5px 10px',
                textDecoration: 'none',
                borderRadius: '4px'
              }}
            >
              Изменить
            </Link>
          )}

          {canDelete && (
            <button
              onClick={onDelete}
              className="delete-btn"
              style={{
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;