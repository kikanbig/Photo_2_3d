import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' или 'error'
  const [showSuccess, setShowSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setMessage('Email, пароль и подтверждение пароля обязательны');
      setMessageType('error');
      return false;
    }

    if (formData.password.length < 6) {
      setMessage('Пароль должен содержать минимум 6 символов');
      setMessageType('error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Пароли не совпадают');
      setMessageType('error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Введите корректный email адрес');
      setMessageType('error');
      return false;
    }

    if (formData.username && (formData.username.length < 3 || formData.username.length > 30)) {
      setMessage('Username должен быть от 3 до 30 символов');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.email, formData.password, formData.username || undefined);

      if (result.success) {
        setShowSuccess(true);
        setMessage(result.message || 'Регистрация успешна! Теперь вы можете войти в систему.');
        setMessageType('success');
        // Перенаправляем на страницу входа через 2 секунды
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(result.error || 'Ошибка регистрации');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Неожиданная ошибка при регистрации');
      setMessageType('error');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="success-card">
            <CheckCircle size={64} className="success-icon" />
            <h1>Регистрация успешна!</h1>
            <p>
              Ваш аккаунт создан. Теперь вы можете войти в систему.
            </p>
            <div className="success-actions">
              <button
                onClick={() => navigate('/login')}
                className="success-btn primary"
              >
                Войти в аккаунт
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <User size={32} className="register-icon" />
            <h1>Регистрация</h1>
            <p>Создайте аккаунт и получите 100 бесплатных кредитов</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email адрес
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">
                <User size={18} />
                Имя пользователя (опционально)
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="От 3 до 30 символов"
                disabled={loading}
                minLength={3}
                maxLength={30}
              />
              <small className="field-hint">Оставьте пустым, если не хотите использовать username</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={18} />
                Пароль
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Минимум 6 символов"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={18} />
                Подтверждение пароля
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите пароль"
                required
                disabled={loading}
              />
            </div>

            {message && (
              <div className={`message ${messageType}`}>
                {messageType === 'error' ? (
                  <AlertCircle size={18} />
                ) : (
                  <CheckCircle size={18} />
                )}
                {message}
              </div>
            )}

            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Регистрация...
                </>
              ) : (
                <>
                  Зарегистрироваться
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="register-footer">
            <p>
              Уже есть аккаунт?{' '}
              <Link to="/login" className="login-link">
                Войти
              </Link>
            </p>
            <div className="features-list">
              <div className="feature-item">
                <CheckCircle size={16} className="feature-icon" />
                <span>100 бесплатных кредитов</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} className="feature-icon" />
                <span>Неограниченное хранение моделей</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} className="feature-icon" />
                <span>AR просмотр на мобильных</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
