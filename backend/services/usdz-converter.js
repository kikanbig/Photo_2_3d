const fs = require('fs-extra');

/**
 * Конвертер GLB → USDZ для iOS AR Quick Look
 * 
 * ВРЕМЕННО ОТКЛЮЧЕН
 * 
 * Причина: three.js требует браузерную среду (self, window, document)
 * Python usd_from_gltf требует сложную установку на Railway
 * 
 * TODO: Интегрировать внешний API для конвертации или использовать готовый сервис
 * 
 * @class USDZConverter
 */
class USDZConverter {
  /**
   * Конвертирует GLB в USDZ
   * ВРЕМЕННО: Возвращает null - конвертация отключена
   * 
   * @param {string|Buffer} glbInput - Путь к GLB файлу или Buffer
   * @param {string} outputPath - Путь для сохранения USDZ (опционально)
   * @returns {Promise<Buffer|null>} - Buffer с USDZ содержимым или null
   */
  async convertGLBtoUSDZ(glbInput, outputPath = null) {
    console.log('⚠️ USDZ конвертация временно отключена');
    console.log('💡 iOS будет использовать GLB напрямую через model-viewer');
    return null;
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
 * Конвертирует GLB в USDZ
 * ВРЕМЕННО: Всегда возвращает null
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
