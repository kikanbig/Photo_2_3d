import React from 'react';
import { Github, Twitter, Mail, Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        {/* Левая часть - информация */}
        <div className="footer-section">
          <h3 className="footer-title">Photo to 3D</h3>
          <p className="footer-description">
            Превращайте фотографии в профессиональные 3D модели с помощью искусственного интеллекта
          </p>
        </div>

        {/* Навигация */}
        <div className="footer-section">
          <h4 className="footer-heading">Продукт</h4>
          <ul className="footer-links">
            <li><a href="#features">Возможности</a></li>
            <li><a href="#pricing">Тарифы</a></li>
            <li><a href="#api">API</a></li>
            <li><a href="#docs">Документация</a></li>
          </ul>
        </div>

        {/* Поддержка */}
        <div className="footer-section">
          <h4 className="footer-heading">Поддержка</h4>
          <ul className="footer-links">
            <li><a href="#help">Помощь</a></li>
            <li><a href="#contact">Контакты</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#status">Статус сервиса</a></li>
          </ul>
        </div>

        {/* Соцсети */}
        <div className="footer-section">
          <h4 className="footer-heading">Связаться</h4>
          <div className="social-links">
            <a href="#github" className="social-link" aria-label="GitHub">
              <Github size={20} />
            </a>
            <a href="#twitter" className="social-link" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="#email" className="social-link" aria-label="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Нижняя часть */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} Photo to 3D. Все права защищены.
        </p>
        <div className="footer-meta">
          <span className="made-with">
            Создано с <Heart size={14} className="heart-icon" /> using AI
          </span>
          <div className="footer-legal">
            <a href="#privacy">Политика конфиденциальности</a>
            <span className="separator">•</span>
            <a href="#terms">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

