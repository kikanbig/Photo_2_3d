import React from 'react';
import { RotateCcw, Package, HelpCircle, Settings, Home, Image, Sparkles } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const menuItems = [
    { icon: Home, label: 'Главная', active: false },
    { icon: RotateCcw, label: '3D из фото', active: true },
    { icon: Sparkles, label: 'AI Рендер', active: false },
    { icon: Image, label: 'Галерея', active: false },
  ];

  const bottomItems = [
    { icon: Package, label: 'Библиотека', active: false },
    { icon: HelpCircle, label: 'Помощь', active: false },
    { icon: Settings, label: 'Настройки', active: false },
  ];

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-content">
          {/* Логотип */}
          <div className="sidebar-logo">
            <RotateCcw className="logo-icon" />
            {isOpen && <span className="logo-text">Photo to 3D</span>}
          </div>

          {/* Основное меню */}
          <nav className="sidebar-nav">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${item.active ? 'active' : ''}`}
                title={item.label}
              >
                <item.icon className="nav-icon" />
                {isOpen && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Нижнее меню */}
          <div className="sidebar-bottom">
            {bottomItems.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${item.active ? 'active' : ''}`}
                title={item.label}
              >
                <item.icon className="nav-icon" />
                {isOpen && <span className="nav-label">{item.label}</span>}
              </button>
            ))}

            {/* Кнопка свернуть/развернуть */}
            <button className="toggle-button" onClick={onToggle}>
              <svg
                className={`toggle-icon ${isOpen ? 'open' : ''}`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay для мобильных */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onToggle} />
      )}
    </>
  );
};

export default Sidebar;

