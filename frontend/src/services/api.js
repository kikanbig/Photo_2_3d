// API service для работы с бэкендом

const API_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// Получить все модели
export const getModels = async () => {
  try {
    const response = await fetch(`${API_URL}/api/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
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
      headers: {
        'Content-Type': 'application/json'
      }
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
      headers: {
        'Content-Type': 'application/json'
      }
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

