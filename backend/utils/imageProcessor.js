const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');

/**
 * Создает превью изображение из оригинального файла
 * @param {string} inputPath - путь к оригинальному изображению
 * @param {string} outputPath - путь для сохранения превью
 * @param {number} width - ширина превью (по умолчанию 300px)
 * @param {number} height - высота превью (по умолчанию 300px)
 * @returns {Promise<string>} путь к созданному превью
 */
async function createPreviewImage(inputPath, outputPath, width = 300, height = 300) {
  try {
    // Создаем директорию для превью если её нет
    await fs.ensureDir(path.dirname(outputPath));

    // Создаем превью с сохранением пропорций
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(outputPath);

    console.log(`✅ Превью создано: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('❌ Ошибка создания превью:', error);
    throw error;
  }
}

/**
 * Генерирует уникальное имя файла для превью
 * @param {string} originalName - оригинальное имя файла
 * @param {string} taskId - ID задачи для уникальности
 * @returns {string} новое имя файла
 */
function generatePreviewFilename(originalName, taskId) {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${name}_preview_${taskId}.jpg`;
}

/**
 * Получает относительный путь к превью для сохранения в БД
 * @param {string} originalPath - путь к оригинальному изображению
 * @param {string} taskId - ID задачи
 * @returns {string} относительный путь к превью
 */
function getPreviewUrl(originalPath, taskId) {
  const originalName = path.basename(originalPath);
  const previewFilename = generatePreviewFilename(originalName, taskId);
  const relativePath = path.join('models', 'previews', previewFilename);
  return `/uploads/${relativePath}`;
}

module.exports = {
  createPreviewImage,
  generatePreviewFilename,
  getPreviewUrl
};
