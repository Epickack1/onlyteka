import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import $api from '../api';
import '../styles/Catalog.css';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await $api.get('/products');
      // Контроллер возвращает { source: 'cache'|'server', data: [...] }
      const payload = response.data?.data ?? response.data;
      setProducts(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Ошибка при загрузке товаров:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить этот товар?")) return;
    
    try {
      await $api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      alert("Товар удален");
    } catch (error) {
      alert("Не удалось удалить товар. Возможно, у вас нет прав.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <p>Загрузка товаров...</p>;

  return (
    <section className="catalog-section">
      <h2 className="catalog-title">Каталог товаров</h2>
      <div className="catalog-grid">
        {products.length > 0 ? (
          products.map(item => (
            <ProductCard 
              key={item.id} 
              product={item} 
              onDelete={() => handleDelete(item.id)} 
            />
          ))
        ) : (
          <p>Товаров пока нет.</p>
        )}
      </div>
    </section>
  );
};

export default Catalog;