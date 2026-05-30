import React, { useEffect, useState } from 'react';
import { usersApi } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminUsers.css';

const ROLES = ['user', 'seller', 'admin'];

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await usersApi.update(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? res.data : u));
    } catch (err) {
      alert('Не удалось сменить роль');
    }
  };

  const handleBlock = async (userId) => {
    if (!window.confirm('Заблокировать этого пользователя?')) return;
    try {
      await usersApi.block(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: true } : u));
    } catch (err) {
      alert(err.response?.data?.error || 'Не удалось заблокировать');
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await usersApi.unblock(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: false } : u));
    } catch (err) {
      alert('Не удалось разблокировать');
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="admin-users-container">
      <h2>Управление пользователями</h2>
      <p className="hint">Всего пользователей: {users.length}</p>

      <table className="users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isSelf = u.id === currentUser.id;
            return (
              <tr key={u.id} className={u.isBlocked ? 'blocked-row' : ''}>
                <td>{u.email}{isSelf && <span className="self-badge"> (вы)</span>}</td>
                <td>{u.first_name}</td>
                <td>{u.last_name}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={isSelf}
                    title={isSelf ? 'Нельзя менять свою роль' : ''}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {u.isBlocked
                    ? <span className="status-blocked">Заблокирован</span>
                    : <span className="status-active">Активен</span>
                  }
                </td>
                <td>
                  {!isSelf && (
                    u.isBlocked
                      ? <button onClick={() => handleUnblock(u.id)} className="btn-unblock">
                          Разблокировать
                        </button>
                      : <button onClick={() => handleBlock(u.id)} className="btn-block">
                          Заблокировать
                        </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;