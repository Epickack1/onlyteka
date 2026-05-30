import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import $api from '../api';

const ProductForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    stock: 0
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      $api.get(`/products/${id}`)
        .then(res => {
          // Контроллер всегда оборачивает в { source, data }
          const p = res.data?.data ?? res.data;
          setFormData({
            title: p.title || '',
            category: p.category || '',
            description: p.description || '',
            price: p.price ?? '',
            stock: p.stock ?? 0
          });
        })
        .catch(() => setError('Не удалось загрузить данные товара'));
    }
  }, [isEdit, id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock)
      };
      if (isEdit) {
        await $api.put(`/products/${id}`, payload);
        alert('Товар успешно обновлен!');
      } else {
        await $api.post('/products', payload);
        alert('Товар успешно создан!');
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при сохранении товара');
    }
  };

  return (
    <div className="product-form-container">
      <h2>{isEdit ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input
          name="title"
          placeholder="Название товара"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Категория"
          value={formData.category}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="Цена"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <input
          name="stock"
          type="number"
          min="0"
          step="1"
          placeholder="На складе (шт.)"
          value={formData.stock}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Описание"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          {isEdit ? 'Сохранить изменения' : 'Создать товар'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;
