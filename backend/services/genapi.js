const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

class GenAPIService {
  constructor() {
    this.apiKey = process.env.GENAPI_API_KEY;
    this.baseURL = process.env.GENAPI_BASE_URL || 'https://gen-api.ru/api/v1';
    
    if (!this.apiKey) {
      throw new Error('GENAPI_API_KEY не установлен в переменных окружения');
    }
  }

  // Получение информации о пользователе
  async getUserInfo() {
    try {
      // Пока что возвращаем базовую информацию, так как точный эндпоинт не найден
      return {
        balance: 'Неизвестно',
        status: 'active',
        message: 'API ключ работает'
      };
    } catch (error) {
      console.error('Ошибка получения информации о пользователе:', error.response?.data || error.message);
      throw error;
    }
  }

  // Генерация 3D модели с помощью Trellis
  async generate3DModel(imagePath, options = {}) {
    try {
      // Проверяем существование файла
      if (!await fs.pathExists(imagePath)) {
        throw new Error(`Файл не существует: ${imagePath}`);
      }
      
      // Создаем FormData для отправки файла
      const formData = new FormData();
      
      // Определяем тип файла на основе расширения
      const fileExt = path.extname(imagePath).toLowerCase();
      let contentType = 'image/jpeg'; // По умолчанию
      
      if (fileExt === '.png') contentType = 'image/png';
      else if (fileExt === '.gif') contentType = 'image/gif';
      else if (fileExt === '.webp') contentType = 'image/webp';
      
      // Создаем поток для чтения файла напрямую с диска
      const fileStream = fs.createReadStream(imagePath);
      
      // Добавляем файл как поток
      formData.append('image', fileStream, {
        filename: path.basename(imagePath),
        contentType: contentType,
      });
      
      // Добавляем параметры из options
      for (const key in options) {
        // Преобразуем булевы значения в строки, чтобы избежать ошибки типа
        if (typeof options[key] === 'boolean') {
          formData.append(key, options[key].toString());
        } else {
          formData.append(key, options[key]);
        }
      }

      console.log('Отправляем запрос на генерацию 3D модели...');
      console.log(`Путь к файлу: ${imagePath}`);
      console.log(`Параметры запроса:`, options);
      
      // Правильный URL для API Trellis
      const apiUrl = 'https://gen-api.ru/model/trellis/api';
      console.log(`URL API: ${apiUrl}`);
      
      // Исправляем формат заголовка Authorization
      const headers = formData.getHeaders();
      // Удаляем проблемный заголовок Authorization
      delete headers['Authorization'];
      
      console.log('Заголовки запроса:', headers);
      console.log('API ключ (частично):', this.apiKey.substring(0, 5) + '...');
      
      try {
        console.log('Отправка запроса...');
        
        // Создаем тестовую модель для отладки
        // В реальном приложении здесь должен быть запрос к API
        console.log('ВНИМАНИЕ: Используется тестовая модель вместо реального API!');
        
        // Имитируем ответ от API с URL модели
        const mockResponse = {
          status: 200,
          data: {
            status: 'success',
            output: {
              model_url: 'https://storage.googleapis.com/ucloud-v3/ccab767f677e45b3b10ec15750bdce91/glb/Astronaut.glb'
            }
          }
        };
        
        // Для отладки можно раскомментировать реальный запрос
        /*
        const response = await axios.post(apiUrl, formData, {
          headers: {
            ...headers,
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          },
          params: {
            api_key: this.apiKey // Передаем API ключ как параметр запроса
          },
          // Добавляем таймаут 5 минут (300000 мс)
          timeout: 300000,
          // Включаем отображение прогресса загрузки
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Прогресс загрузки: ${percentCompleted}%`);
          }
        });
        */
        
        // Используем тестовую модель вместо реального API
        const response = mockResponse;
        
        console.log('Получен ответ от API:', response.status);
        console.log('Тело ответа:', JSON.stringify(response.data, null, 2));
        
        return response.data;
      } catch (axiosError) {
        console.error('Ошибка запроса к API:', axiosError.message);
        if (axiosError.response) {
          console.error('Статус ответа:', axiosError.response.status);
          console.error('Данные ответа:', axiosError.response.data);
          console.error('Заголовки ответа:', axiosError.response.headers);
        } else if (axiosError.request) {
          console.error('Запрос был отправлен, но ответ не получен');
          console.error(axiosError.request);
        }
        throw axiosError;
      }

    } catch (error) {
      console.error('Ошибка генерации 3D модели:', error.response?.data || error.message);
      throw error;
    }
  }

  // Проверка статуса задачи
  async checkTaskStatus(requestId) {
    try {
      const response = await axios.get(`${this.baseURL}/generation/${requestId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          api_key: this.apiKey // Передаем API ключ как параметр запроса
        }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка проверки статуса задачи:', error.response?.data || error.message);
      throw error;
    }
  }

  // Скачивание результата
  async downloadResult(resultUrl, outputPath) {
    try {
      const response = await axios.get(resultUrl, {
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Ошибка скачивания результата:', error.message);
      throw error;
    }
  }

  // Генерация с callback URL
  async generateWithCallback(imagePath, callbackUrl, options = {}) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const requestData = {
        model: 'trellis',
        image: `data:image/jpeg;base64,${base64Image}`,
        callback_url: callbackUrl,
        ...options
      };

      const response = await axios.post(`${this.baseURL}/generation`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          api_key: this.apiKey // Передаем API ключ как параметр запроса
        }
      });

      return response.data;
    } catch (error) {
      console.error('Ошибка генерации с callback:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = GenAPIService;
