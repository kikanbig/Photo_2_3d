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
      
      console.log('Отправляем запрос на генерацию 3D модели...');
      console.log(`Путь к файлу: ${imagePath}`);
      console.log(`Параметры запроса:`, options);
      
      // Создаем FormData для отправки файла
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Определяем тип файла на основе расширения
      const fileExt = path.extname(imagePath).toLowerCase();
      let contentType = 'image/jpeg';
      if (fileExt === '.png') contentType = 'image/png';
      else if (fileExt === '.gif') contentType = 'image/gif';
      else if (fileExt === '.webp') contentType = 'image/webp';
      
      // Добавляем файл как поток
      const fileStream = fs.createReadStream(imagePath);
      formData.append('image_url', fileStream, {
        filename: path.basename(imagePath),
        contentType: contentType,
      });
      
      // Добавляем опциональные параметры
      if (options.ss_guidance_strength !== undefined) formData.append('ss_guidance_strength', options.ss_guidance_strength.toString());
      if (options.ss_sampling_steps !== undefined) formData.append('ss_sampling_steps', options.ss_sampling_steps.toString());
      if (options.slat_guidance_strength !== undefined) formData.append('slat_guidance_strength', options.slat_guidance_strength.toString());
      if (options.slat_sampling_steps !== undefined) formData.append('slat_sampling_steps', options.slat_sampling_steps.toString());
      if (options.mesh_simplify !== undefined) formData.append('mesh_simplify', options.mesh_simplify.toString());
      if (options.texture_size !== undefined) formData.append('texture_size', options.texture_size.toString());
      
      // ПРАВИЛЬНЫЙ URL согласно документации
      const apiUrl = 'https://api.gen-api.ru/api/v1/networks/trellis';
      console.log(`URL API: ${apiUrl}`);
      console.log('API ключ (частично):', this.apiKey.substring(0, 10) + '...');
      
      try {
        console.log('Отправка запроса с файлом...');
        
        // Получаем заголовки из FormData
        const headers = formData.getHeaders();
        
        // ПРАВИЛЬНЫЕ ЗАГОЛОВКИ согласно документации
        const response = await axios.post(apiUrl, formData, {
          headers: {
            ...headers,
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}` // Bearer токен!
          },
          timeout: 300000, // 5 минут
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Прогресс загрузки: ${percentCompleted}%`);
          }
        });
        
        console.log('Получен ответ от API:', response.status);
        console.log('Тело ответа:', JSON.stringify(response.data, null, 2));
        
        return response.data;
      } catch (axiosError) {
        console.error('Ошибка запроса к API:', axiosError.message);
        if (axiosError.response) {
          console.error('Статус ответа:', axiosError.response.status);
          console.error('Данные ответа:', typeof axiosError.response.data === 'string' ? axiosError.response.data.substring(0, 500) : axiosError.response.data);
          console.error('Заголовки ответа:', axiosError.response.headers);
        } else if (axiosError.request) {
          console.error('Запрос был отправлен, но ответ не получен');
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
      const response = await axios.get(`https://api.gen-api.ru/api/v1/requests/${requestId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
