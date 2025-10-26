// API service для работы с бэкендом

const API_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// Получить JWT токен из localStorage
export const getAuthToken = () => localStorage.getItem('auth_token');

// Создать headers с авторизацией
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Получить все модели пользователя
export const getModels = async () => {
  try {
    const response = await fetch(`${API_URL}/api/models`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Ошибка загрузки моделей');
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка getModels:', error);
    throw error;
  }
};

// Получить одну модель
export const getModel = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/models/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Ошибка загрузки модели');
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка getModel:', error);
    throw error;
  }
};

// Сохранить модель
export const saveModel = async (modelData) => {
  try {
    const response = await fetch(`${API_URL}/api/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(modelData)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Ошибка сохранения модели');
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка saveModel:', error);
    throw error;
  }
};

// Обновить модель
export const updateModel = async (id, updates) => {
  try {
    const response = await fetch(`${API_URL}/api/models/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Ошибка обновления модели');
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка updateModel:', error);
    throw error;
  }
};

// Удалить модель
export const deleteModel = async (id, hard = false) => {
  try {
    const response = await fetch(`${API_URL}/api/models/${id}?hard=${hard}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Ошибка удаления модели');
    }

    return data;
  } catch (error) {
    console.error('Ошибка deleteModel:', error);
    throw error;
  }
};

// Поиск моделей
export const searchModels = async (query) => {
  try {
    const response = await fetch(`${API_URL}/api/models/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка поиска моделей');
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка searchModels:', error);
    throw error;
  }
};

// ========== АУТЕНТИФИКАЦИЯ ==========

// Регистрация пользователя
export const registerUser = async (email, password, username) => {
  try {
    const requestData = { email, password };
    if (username) {
      requestData.username = username;
    }

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка регистрации');
    }

    return data; // Возвращаем полный объект ответа сервера
  } catch (error) {
    console.error('Ошибка registerUser:', error);
    throw error;
  }
};

// Подтверждение email
export const verifyEmail = async (token) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка подтверждения email');
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка verifyEmail:', error);
    throw error;
  }
};

// Повторная отправка письма подтверждения
export const resendVerification = async (email) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка отправки письма');
    }

    return data;
  } catch (error) {
    console.error('Ошибка resendVerification:', error);
    throw error;
  }
};

// Вход в систему
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка входа');
    }

    // Сохраняем токен
    if (data.data.token) {
      localStorage.setItem('auth_token', data.data.token);
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка loginUser:', error);
    throw error;
  }
};

// Получение профиля пользователя
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка получения профиля');
    }

    return data.data;
  } catch (error) {
    console.error('Ошибка getUserProfile:', error);
    throw error;
  }
};

// Выход из системы
export const logoutUser = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
};

// Проверка авторизации
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Получить текущего пользователя
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Ошибка getCurrentUser:', error);
    return null;
  }
};

// Сохранить данные пользователя
export const setCurrentUser = (userData) => {
  localStorage.setItem('user_data', JSON.stringify(userData));
};

