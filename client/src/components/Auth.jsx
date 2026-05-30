import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/');
      } else {
        await register(formData);
        alert('Регистрация успешна! Теперь войдите.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Произошла ошибка');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!isLogin && (
          <>
            <input name="first_name" placeholder="Имя" onChange={handleChange} required />
            <input name="last_name" placeholder="Фамилия" onChange={handleChange} required />
          </>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" className="auth-btn">
          {isLogin ? 'Войти' : 'Создать аккаунт'}
        </button>

        <p onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
          {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
        </p>
      </form>
    </div>
  );
};

export default Auth;