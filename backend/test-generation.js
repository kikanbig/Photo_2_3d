/**
 * Тестовый скрипт для проверки генерации 3D модели
 * 
 * Использование:
 * 1. Убедитесь, что переменные окружения настроены (GENAPI_API_KEY)
 * 2. Поместите тестовое изображение в папку test-images
 * 3. Запустите скрипт: node test-generation.js
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const GenAPIService = require('./services/genapi');

// Создаем директории для тестов, если не существуют
const TEST_DIR = path.join(__dirname, 'test-images');
const OUTPUT_DIR = path.join(__dirname, 'test-output');
fs.ensureDirSync(TEST_DIR);
fs.ensureDirSync(OUTPUT_DIR);

// Тестовое изображение (должно существовать в папке test-images)
const TEST_IMAGE = 'test.jpg'; // Замените на имя вашего тестового изображения
const TEST_IMAGE_PATH = path.join(TEST_DIR, TEST_IMAGE);

async function runTest() {
  try {
    // Проверяем наличие тестового изображения
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`❌ Тестовое изображение не найдено: ${TEST_IMAGE_PATH}`);
      console.log('Пожалуйста, поместите тестовое изображение в папку test-images');
      return;
    }

    console.log('🔍 Проверка API ключа...');
    const genapi = new GenAPIService();
    console.log('✅ API ключ установлен');

    console.log(`📷 Используем тестовое изображение: ${TEST_IMAGE}`);
    
    console.log('🚀 Запускаем генерацию 3D модели...');
    const startTime = Date.now();
    
    const result = await genapi.generate3DModel(TEST_IMAGE_PATH);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Генерация завершена за ${duration.toFixed(2)} секунд`);
    console.log('📊 Результат:');
    console.log(JSON.stringify(result, null, 2));
    
    // Если есть URL модели, пробуем скачать
    if (result.output && result.output.model_url) {
      const modelUrl = result.output.model_url;
      const modelFileName = `model-${Date.now()}.glb`;
      const modelFilePath = path.join(OUTPUT_DIR, modelFileName);
      
      console.log(`💾 Скачиваем модель: ${modelUrl}`);
      await genapi.downloadResult(modelUrl, modelFilePath);
      console.log(`✅ Модель сохранена: ${modelFilePath}`);
    } else {
      console.log('⚠️ URL модели не найден в ответе API');
    }
    
    console.log('✅ Тест успешно завершен');
  } catch (error) {
    console.error('❌ Ошибка при выполнении теста:');
    console.error(error);
    
    if (error.response) {
      console.error('📡 Ответ API:');
      console.error(error.response.data);
    }
  }
}

// Запускаем тест
runTest();
