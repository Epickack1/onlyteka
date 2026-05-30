import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();

  let userAuthContent;
  if (loading) {
    userAuthContent = <div className="action-link">...</div>;
  } else if (isAuthenticated) {
    const displayName = user.email.split('@')[0];
    userAuthContent = (
      <div className="action-link user-display" onClick={logout}>
        <i className="fa-solid fa-user-check" style={{ color: '#00c2a0' }}></i>
        <span>{displayName} (Выйти)</span>
      </div>
    );
  } else {
    userAuthContent = (
      <Link to="/auth" className="action-link">
        <i className="fa-regular fa-user"></i>
        <span>Войти</span>
      </Link>
    );
  }

  return (
    <header className="header-wrapper-main">
      <div className="top-bar">
        <i className="fa-solid fa-location-arrow"></i>
        <span>Москва и область</span>
      </div>

      <div className="main-nav">
        <Link to="/" className="logo-link">onlyteka</Link>

        <button className="catalog-btn">
          <i className="fa-solid fa-bars"></i> Каталог
        </button>

        <div className="search-wrapper">
          <input type="text" className="search-input" placeholder="Искать..." />
          <button className="search-btn-icon">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>

        <div className="user-actions">
          <Link to="/cart" className="action-link">
            <i className="fa-solid fa-cart-shopping"></i>
            <span>Корзина</span>
          </Link>

          {isAuthenticated && (
            <Link to="/orders" className="action-link">
              <i className="fa-solid fa-box"></i>
              <span>Мои заказы</span>
            </Link>
          )}

          {isAuthenticated && (user.role === 'seller' || user.role === 'admin') && (
            <Link to="/add" className="action-link">
              <i className="fa-solid fa-plus"></i>
              <span>Добавить товар</span>
            </Link>
          )}

          {isAuthenticated && user.role === 'admin' && (
            <Link to="/admin/users" className="action-link">
              <i className="fa-solid fa-users-cog"></i>
              <span>Пользователи</span>
            </Link>
          )}

          <a href="#" className="action-link">
            <i className="fa-regular fa-heart"></i>
            <span>Избранное</span>
          </a>
          {userAuthContent}
        </div>
      </div>
    </header>
  );
};

export default Header;