import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verify } = useAuth();

  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен подтверждения не найден в URL');
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        await verify(token);
        setStatus('success');
        setMessage('Email успешно подтвержден! Теперь вы можете войти в систему.');

        // Перенаправление через 3 секунды
        setTimeout(() => {
          navigate('/login');
        }, 3000);

      } catch (error) {
        setStatus('error');
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, verify, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-page">
      <div className="verify-container">
        <div className="verify-card">
          {status === 'loading' && (
            <>
              <div className="verify-icon loading">
                <RefreshCw className="spinning" size={48} />
              </div>
              <h1>Подтверждаем email...</h1>
              <p>Пожалуйста, подождите, мы проверяем ваш токен подтверждения.</p>
              {loading && (
                <div className="loading-bar">
                  <div className="loading-progress"></div>
                </div>
              )}
            </>
          )}

          {status === 'success' && (
            <>
              <div className="verify-icon success">
                <CheckCircle size={64} />
              </div>
              <h1>Email подтвержден!</h1>
              <p>{message}</p>
              <div className="verify-actions">
                <button
                  onClick={() => navigate('/login')}
                  className="verify-btn primary"
                >
                  Войти в аккаунт
                </button>
                <p className="redirect-notice">
                  Автоматический переход через 3 секунды...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="verify-icon error">
                <AlertCircle size={64} />
              </div>
              <h1>Ошибка подтверждения</h1>
              <p>{message}</p>
              <div className="verify-actions">
                <button
                  onClick={handleRetry}
                  className="verify-btn primary"
                >
                  Попробовать войти
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="verify-btn secondary"
                >
                  Зарегистрироваться заново
                </button>
              </div>

              <div className="error-help">
                <h3>Возможные причины ошибки:</h3>
                <ul>
                  <li>Ссылка устарела (действительна 24 часа)</li>
                  <li>Ссылка уже была использована</li>
                  <li>Неверный токен в URL</li>
                </ul>
                <p>Если проблема persists, зарегистрируйтесь заново.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
