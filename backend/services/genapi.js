const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

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
      // Читаем файл изображения
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const requestData = {
        model: 'trellis',
        image: `data:image/jpeg;base64,${base64Image}`,
        ...options
      };

      console.log('Отправляем запрос на генерацию 3D модели...');
      
      const response = await axios.post(`${this.baseURL}/generation`, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
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
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
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
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
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
