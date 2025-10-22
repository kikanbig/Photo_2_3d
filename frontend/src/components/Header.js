import React from 'react';
import { Zap, User, Menu } from 'lucide-react';
import './Header.css';

const Header = ({ onMenuToggle }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        {/* Кнопка меню для мобильных */}
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>

        {/* Заголовок страницы */}
        <div className="header-title">
          <h1>AI Studio for 3D Generation</h1>
          <p className="header-subtitle">Превращайте фотографии в 3D модели</p>
        </div>

        {/* Правая часть */}
        <div className="header-actions">
          {/* Кредиты */}
          <div className="credits-badge">
            <Zap className="credits-icon" />
            <div className="credits-info">
              <span className="credits-label">Кредиты</span>
              <span className="credits-value">32</span>
            </div>
          </div>

          {/* Аватар и меню пользователя */}
          <div className="user-menu">
            <button className="user-button">
              <div className="avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">Demo User</span>
                <span className="user-plan">Free Plan</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

