import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  getUserProfile,
  logoutUser,
  isAuthenticated,
  getCurrentUser,
  setCurrentUser
} from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Проверка авторизации при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const userData = getCurrentUser();
          if (userData) {
            setUser(userData);
          } else {
            // Пробуем получить профиль с сервера
            try {
              const profile = await getUserProfile();
              setUser(profile);
              setCurrentUser(profile);
            } catch (error) {
              console.warn('Не удалось получить профиль:', error);
              logoutUser();
            }
          }
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        logoutUser();
      } finally {
        setLoading(false);
        setIsAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Регистрация
  const register = async (email, password) => {
    try {
      const result = await registerUser(email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Подтверждение email
  const verify = async (token) => {
    try {
      const result = await verifyEmail(token);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Повторная отправка подтверждения
  const resendVerificationEmail = async (email) => {
    try {
      const result = await resendVerification(email);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Вход
  const login = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      setUser(result.user);
      setCurrentUser(result.user);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Выход
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  // Обновление профиля
  const refreshProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUser(profile);
      setCurrentUser(profile);
      return profile;
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthChecked,
    isAuthenticated: !!user,
    register,
    verify,
    resendVerificationEmail,
    login,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
