const fs = require('fs-extra');
const path = require('path');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader');
const { USDZExporter } = require('three/examples/jsm/exporters/USDZExporter');

/**
 * Конвертер GLB → USDZ для iOS AR Quick Look
 * 
 * @class USDZConverter
 */
class USDZConverter {
  constructor() {
    this.loader = new GLTFLoader();
    this.exporter = new USDZExporter();
  }

  /**
   * Конвертирует GLB файл в USDZ
   * 
   * @param {string|Buffer} glbInput - Путь к GLB файлу или Buffer с содержимым
   * @param {string} outputPath - Путь для сохранения USDZ файла (опционально)
   * @returns {Promise<Buffer>} - Buffer с USDZ содержимым
   */
  async convertGLBtoUSDZ(glbInput, outputPath = null) {
    try {
      console.log('🔄 Начало конвертации GLB → USDZ');
      const startTime = Date.now();

      // Читаем GLB файл
      let glbBuffer;
      if (Buffer.isBuffer(glbInput)) {
        glbBuffer = glbInput;
        console.log('  📦 Использован GLB Buffer:', (glbBuffer.length / 1024 / 1024).toFixed(2), 'MB');
      } else {
        glbBuffer = await fs.readFile(glbInput);
        console.log('  📦 GLB файл прочитан:', (glbBuffer.length / 1024 / 1024).toFixed(2), 'MB');
      }

      // Загружаем GLB через three.js
      const gltf = await new Promise((resolve, reject) => {
        this.loader.parse(
          glbBuffer.buffer,
          '',
          (gltf) => resolve(gltf),
          (error) => reject(error)
        );
      });

      console.log('  ✅ GLB загружен в three.js');
      console.log('  📊 Сцена содержит:', gltf.scene.children.length, 'объектов');

      // Экспортируем в USDZ
      const usdzArrayBuffer = await this.exporter.parse(gltf.scene);
      const usdzBuffer = Buffer.from(usdzArrayBuffer);

      console.log('  ✅ USDZ создан:', (usdzBuffer.length / 1024 / 1024).toFixed(2), 'MB');

      // Сохраняем файл если указан путь
      if (outputPath) {
        await fs.writeFile(outputPath, usdzBuffer);
        console.log('  💾 USDZ сохранён:', outputPath);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Конвертация завершена за ${duration}с`);

      return usdzBuffer;

    } catch (error) {
      console.error('❌ Ошибка конвертации GLB → USDZ:', error);
      throw new Error(`Не удалось сконвертировать GLB в USDZ: ${error.message}`);
    }
  }

  /**
   * Конвертирует GLB Buffer в USDZ Buffer (для сохранения в БД)
   * 
   * @param {Buffer} glbBuffer - Buffer с GLB содержимым
   * @returns {Promise<Buffer>} - Buffer с USDZ содержимым
   */
  async convertBufferToBuffer(glbBuffer) {
    return await this.convertGLBtoUSDZ(glbBuffer);
  }

  /**
   * Конвертирует GLB файл в USDZ файл
   * 
   * @param {string} glbPath - Путь к GLB файлу
   * @param {string} usdzPath - Путь для сохранения USDZ
   * @returns {Promise<Buffer>} - Buffer с USDZ содержимым
   */
  async convertFileToFile(glbPath, usdzPath) {
    return await this.convertGLBtoUSDZ(glbPath, usdzPath);
  }

  /**
   * Проверяет валидность GLB файла
   * 
   * @param {Buffer} glbBuffer - Buffer с GLB содержимым
   * @returns {Promise<boolean>} - true если валидный GLB
   */
  async isValidGLB(glbBuffer) {
    try {
      // Проверяем magic number для GLB (glTF binary)
      // GLB начинается с 0x46546C67 (ASCII "glTF")
      if (glbBuffer.length < 12) return false;
      
      const magic = glbBuffer.readUInt32LE(0);
      const glbMagic = 0x46546C67; // "glTF" in little-endian
      
      return magic === glbMagic;
    } catch (error) {
      console.error('Ошибка проверки GLB:', error);
      return false;
    }
  }
}

// Singleton instance
let converterInstance = null;

/**
 * Получить экземпляр конвертера (singleton)
 * 
 * @returns {USDZConverter}
 */
function getConverter() {
  if (!converterInstance) {
    converterInstance = new USDZConverter();
  }
  return converterInstance;
}

/**
 * Конвертирует GLB в USDZ (упрощённая функция)
 * 
 * @param {string|Buffer} glbInput - Путь к GLB или Buffer
 * @param {string} outputPath - Путь для сохранения (опционально)
 * @returns {Promise<Buffer>}
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

