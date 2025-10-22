import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RotateCcw, Package, HelpCircle, Settings, Home, Sparkles } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Главная', path: '/' },
    { icon: RotateCcw, label: '3D из фото', path: '/create' },
    { icon: Package, label: 'Мои модели', path: '/my-models' },
    { icon: Sparkles, label: 'AI Рендер', path: '/render' },
  ];

  const bottomItems = [
    { icon: HelpCircle, label: 'Помощь', path: '/help' },
    { icon: Settings, label: 'Настройки', path: '/settings' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) {
      onToggle();
    }
  };

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
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={item.label}
                onClick={() => handleNavigate(item.path)}
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
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={item.label}
                onClick={() => handleNavigate(item.path)}
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

