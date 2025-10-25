import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Menu, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Кнопка меню для мобильных */}
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>

        {/* Заголовок страницы */}
        <div className="header-title">
          <h1>Photo to 3D</h1>
          <p className="header-subtitle">AI генерация 3D моделей из фото</p>
        </div>

        {/* Правая часть */}
        <div className="header-actions">
          {/* Кредиты */}
          <div className="credits-badge">
            <Zap className="credits-icon" />
            <div className="credits-info">
              <span className="credits-label">Кредиты</span>
              <span className="credits-value">{user?.credits || 0}</span>
            </div>
          </div>

          {/* Аватар и меню пользователя */}
          <div className="user-menu">
            <button className="user-button" onClick={toggleUserMenu}>
              <div className="avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">
                  {user?.email ? user.email.split('@')[0] : 'Пользователь'}
                </span>
                <span className="user-plan">Бесплатный план</span>
              </div>
            </button>

            {/* Выпадающее меню */}
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-details">
                  <div className="user-email">{user?.email}</div>
                  <div className="user-credits">{user?.credits || 0} кредитов</div>
                </div>
                <div className="menu-divider"></div>
                <button className="menu-item" onClick={() => navigate('/my-models')}>
                  <User size={16} />
                  Мои модели
                </button>
                <button className="menu-item">
                  <Settings size={16} />
                  Настройки
                </button>
                <div className="menu-divider"></div>
                <button className="menu-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay для закрытия меню */}
      {showUserMenu && (
        <div className="menu-overlay" onClick={() => setShowUserMenu(false)}></div>
      )}
    </header>
  );
};

export default Header;

