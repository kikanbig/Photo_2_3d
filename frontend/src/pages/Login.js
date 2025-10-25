import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { login, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем URL для перенаправления после входа
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setMessage('Заполните все поля');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setShowResend(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      setMessage(`Добро пожаловать! У вас ${result.user.credits} кредитов.`);
      setMessageType('success');

      // Перенаправляем через 1.5 секунды
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);

    } catch (error) {
      setMessage(error.message);
      setMessageType('error');

      // Показываем кнопку повторной отправки если email не подтвержден
      if (error.message.includes('Email не подтвержден')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await resendVerificationEmail(formData.email);
      setMessage('Письмо подтверждения отправлено повторно');
      setMessageType('success');
      setShowResend(false);
    } catch (error) {
      setMessage('Ошибка отправки письма: ' + error.message);
      setMessageType('error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <LogIn size={32} className="login-icon" />
            <h1>Вход в систему</h1>
            <p>Войдите в свой аккаунт Photo to 3D</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
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
                placeholder="Ваш пароль"
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

            {showResend && (
              <div className="resend-section">
                <p>Email не подтвержден. Отправить письмо повторно?</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="resend-btn"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Отправить повторно
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Вход...
                </>
              ) : (
                <>
                  Войти
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Нет аккаунта?{' '}
              <Link to="/register" className="register-link">
                Зарегистрироваться
              </Link>
            </p>

            <div className="forgot-password">
              <Link to="/forgot-password" className="forgot-link">
                Забыли пароль?
              </Link>
            </div>

            <div className="features-preview">
              <div className="feature-item">
                <CheckCircle size={16} className="feature-icon" />
                <span>Генерация 3D моделей</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} className="feature-icon" />
                <span>AR просмотр</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} className="feature-icon" />
                <span>Кредитная система</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
