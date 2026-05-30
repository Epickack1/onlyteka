import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/App.css';

// Lazy loading маршрутов (практика 25): каждая страница — отдельный чанк,
// который браузер загружает только при первом переходе на маршрут.
const Catalog = lazy(() => import('./components/Catalog'));
const Auth = lazy(() => import('./components/Auth'));
const ProductForm = lazy(() => import('./components/ProductForm'));
const AdminUsers = lazy(() => import('./components/AdminUsers'));
const About = lazy(() => import('./components/About'));
const Reminders = lazy(() => import('./components/Reminders'));
const Cart = lazy(() => import('./components/Cart'));
const MyOrders = lazy(() => import('./components/MyOrders'));

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content-area">
        <Suspense fallback={<p style={{ padding: 20 }}>Загрузка…</p>}>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={
              <ProtectedRoute allowedRoles={['user', 'seller', 'admin']}>
                <MyOrders />
              </ProtectedRoute>
            } />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/add" element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <ProductForm isEdit={false} />
              </ProtectedRoute>
            } />
            <Route path="/edit/:id" element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <ProductForm isEdit={true} />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
