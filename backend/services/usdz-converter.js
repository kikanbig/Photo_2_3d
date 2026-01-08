const fs = require('fs-extra');
const axios = require('axios');
const FormData = require('form-data');

/**
 * Конвертер GLB → USDZ для iOS AR Quick Look
 * Использует внешний Python микросервис
 * 
 * @class USDZConverter
 */
class USDZConverter {
  constructor() {
    // URL Python микросервиса (настраивается через env)
    this.converterUrl = process.env.USDZ_CONVERTER_URL || null;
    this.timeout = 120000; // 2 минуты на конвертацию
  }

  /**
   * Проверяет доступность конвертера
   */
  async isAvailable() {
    if (!this.converterUrl) {
      console.log('⚠️ USDZ_CONVERTER_URL не установлен - конвертация отключена');
      return false;
    }

    try {
      const response = await axios.get(`${this.converterUrl}/health`, {
        timeout: 5000
      });
      return response.data?.status === 'healthy';
    } catch (error) {
      console.log('⚠️ USDZ конвертер недоступен:', error.message);
      return false;
    }
  }

  /**
   * Конвертирует GLB в USDZ через Python микросервис
   * 
   * @param {string|Buffer} glbInput - Путь к GLB файлу или Buffer
   * @param {string} outputPath - Путь для сохранения USDZ (опционально)
   * @returns {Promise<Buffer|null>} - Buffer с USDZ содержимым или null
   */
  async convertGLBtoUSDZ(glbInput, outputPath = null) {
    // Проверяем доступность конвертера
    if (!this.converterUrl) {
      console.log('⚠️ USDZ конвертация пропущена - USDZ_CONVERTER_URL не установлен');
      return null;
    }

    try {
      console.log('🔄 Начало конвертации GLB → USDZ через микросервис');
      const startTime = Date.now();

      // Подготовка данных
      let glbBuffer;
      if (Buffer.isBuffer(glbInput)) {
        glbBuffer = glbInput;
      } else {
        glbBuffer = await fs.readFile(glbInput);
      }

      console.log(`  📦 GLB размер: ${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Отправляем на конвертацию
      const formData = new FormData();
      formData.append('file', glbBuffer, {
        filename: 'model.glb',
        contentType: 'model/gltf-binary'
      });

      console.log(`  🌐 Отправка на ${this.converterUrl}/convert...`);
      
      const response = await axios.post(`${this.converterUrl}/convert`, formData, {
        headers: formData.getHeaders(),
        responseType: 'arraybuffer',
        timeout: this.timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const usdzBuffer = Buffer.from(response.data);
      
      console.log(`  ✅ USDZ получен: ${(usdzBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Сохраняем если нужен outputPath
      if (outputPath) {
        await fs.writeFile(outputPath, usdzBuffer);
        console.log(`  💾 USDZ сохранён: ${outputPath}`);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Конвертация завершена за ${duration}с`);

      return usdzBuffer;

    } catch (error) {
      console.error('❌ Ошибка конвертации GLB → USDZ:', error.message);
      
      if (error.response) {
        console.error('  Статус:', error.response.status);
        console.error('  Данные:', error.response.data?.toString?.() || error.response.data);
      }
      
      // Возвращаем null вместо throw - graceful degradation
      return null;
    }
  }

  /**
   * Проверяет валидность GLB файла
   */
  async isValidGLB(glbBuffer) {
    try {
      if (glbBuffer.length < 12) return false;
      
      const magic = glbBuffer.readUInt32LE(0);
      const glbMagic = 0x46546C67; // "glTF"
      
      return magic === glbMagic;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let converterInstance = null;

/**
 * Получить экземпляр конвертера (singleton)
 */
function getConverter() {
  if (!converterInstance) {
    converterInstance = new USDZConverter();
  }
  return converterInstance;
}

/**
 * Конвертирует GLB в USDZ через микросервис
 * Возвращает null если конвертер недоступен
 */
async function convertGLBtoUSDZ(glbInput, outputPath = null) {
  const converter = getConverter();
  return await converter.convertGLBtoUSDZ(glbInput, outputPath);
}

module.exports = {
  USDZConverter,
  getConverter,
  convertGLBtoUSDZ
};
