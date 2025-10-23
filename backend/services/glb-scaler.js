const fs = require('fs-extra');

/**
 * Масштабирует GLB модель по всем осям
 * GLB формат: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0
 * 
 * @param {Buffer} glbBuffer - исходный GLB файл
 * @param {number} scaleFactor - множитель масштаба (2.0 = увеличить в 2 раза)
 * @returns {Buffer} масштабированный GLB файл
 */
function scaleGLB(glbBuffer, scaleFactor = 2.0) {
  try {
    // GLB структура:
    // [0-11] Header: magic (0x46546C67), version (2), length
    // [12-15] JSON chunk size
    // [16-19] JSON chunk type (0x4E4F534A)
    // [20-...] JSON chunk data
    // [...-...] Binary chunk size
    // [...-...] Binary chunk type (0x004E4942)
    // [...-...] Binary chunk data (вершины, индексы, etc)

    if (glbBuffer.length < 20) {
      console.warn('⚠️ GLB файл слишком маленький, пропускаем масштабирование');
      return glbBuffer;
    }

    // Проверяем магическое число GLB (0x46546C67 = "glTF" в little-endian)
    const magic = glbBuffer.readUInt32LE(0);
    if (magic !== 0x46546C67) {
      console.warn('⚠️ Не валидный GLB файл, пропускаем масштабирование');
      return glbBuffer;
    }

    console.log(`🔄 Масштабирование GLB: multiplier=${scaleFactor}`);

    const version = glbBuffer.readUInt32LE(4);
    const length = glbBuffer.readUInt32LE(8);

    if (version !== 2) {
      console.warn(`⚠️ GLB версия ${version} не поддерживается, ожидается версия 2`);
      return glbBuffer;
    }

    let offset = 12;

    // Читаем JSON chunk
    const jsonChunkSize = glbBuffer.readUInt32LE(offset);
    offset += 4;
    const jsonChunkType = glbBuffer.readUInt32LE(offset);
    offset += 4;

    if (jsonChunkType !== 0x4E4F534A) { // "JSON"
      console.warn('⚠️ Первый chunk не JSON, пропускаем');
      return glbBuffer;
    }

    const jsonData = JSON.parse(glbBuffer.toString('utf8', offset, offset + jsonChunkSize));
    offset += jsonChunkSize;

    console.log('📄 JSON chunk обработан, размер:', jsonChunkSize);

    // Масштабируем все узлы и сетки
    if (jsonData.nodes) {
      for (const node of jsonData.nodes) {
        if (node.translation) {
          node.translation[0] *= scaleFactor;
          node.translation[1] *= scaleFactor;
          node.translation[2] *= scaleFactor;
        }
        if (node.scale) {
          node.scale[0] *= scaleFactor;
          node.scale[1] *= scaleFactor;
          node.scale[2] *= scaleFactor;
        }
      }
    }

    // Масштабируем все вершины в буферах
    if (jsonData.meshes) {
      for (const mesh of jsonData.meshes) {
        if (mesh.primitives) {
          for (const primitive of mesh.primitives) {
            if (primitive.attributes?.POSITION !== undefined) {
              primitive.attributes.POSITION_SCALE = scaleFactor;
            }
          }
        }
      }
    }

    // Масштабируем анимации
    if (jsonData.animations) {
      for (const animation of jsonData.animations) {
        if (animation.channels) {
          for (const channel of animation.channels) {
            if (channel.target?.path === 'translation') {
              // Для анимации трансляции нужно масштабировать значения
              channel.translation_scale = scaleFactor;
            }
          }
        }
      }
    }

    // Перестраиваем JSON chunk
    const newJsonBuffer = Buffer.from(JSON.stringify(jsonData), 'utf8');
    const newJsonChunkSize = newJsonBuffer.length;

    console.log(`📝 Новый JSON chunk размер: ${newJsonChunkSize} (было ${jsonChunkSize})`);

    // Читаем Binary chunk
    const binaryChunkSize = glbBuffer.readUInt32LE(offset);
    offset += 4;
    const binaryChunkType = glbBuffer.readUInt32LE(offset);
    offset += 4;

    if (binaryChunkType !== 0x004E4942) { // "BIN\0"
      console.warn('⚠️ Binary chunk не найден');
      // Возвращаем с обновлённым JSON
      return rebuildGLB(
        2,
        newJsonBuffer,
        glbBuffer.slice(offset + binaryChunkSize)
      );
    }

    const binaryData = glbBuffer.slice(offset, offset + binaryChunkSize);

    console.log(`💾 Binary chunk размер: ${binaryChunkSize}`);

    // Масштабируем вершины в бинарном буфере
    const scaledBinaryData = scaleVertices(binaryData, jsonData, scaleFactor);

    // Перестраиваем GLB файл
    const newGLB = rebuildGLB(2, newJsonBuffer, scaledBinaryData);

    console.log(`✅ GLB масштабирован: было ${glbBuffer.length} байт, стало ${newGLB.length} байт`);

    return newGLB;
  } catch (error) {
    console.error('❌ Ошибка при масштабировании GLB:', error.message);
    return glbBuffer; // Возвращаем оригинальный если ошибка
  }
}

/**
 * Масштабирует вершины в бинарном буфере
 */
function scaleVertices(binaryData, jsonData, scaleFactor) {
  try {
    // Ищем POSITION буфер
    if (!jsonData.meshes) return binaryData;

    const scaledData = Buffer.from(binaryData);
    let positionScaled = false;

    for (const mesh of jsonData.meshes) {
      if (!mesh.primitives) continue;

      for (const primitive of mesh.primitives) {
        const positionAccessorIdx = primitive.attributes?.POSITION;
        if (positionAccessorIdx === undefined) continue;

        const positionAccessor = jsonData.accessors[positionAccessorIdx];
        if (!positionAccessor) continue;

        const bufferViewIdx = positionAccessor.bufferView;
        const bufferView = jsonData.bufferViews[bufferViewIdx];
        const offset = (bufferView.byteOffset || 0) + (positionAccessor.byteOffset || 0);

        // POSITION обычно хранятся как VEC3 (3 float32)
        const stride = bufferView.byteStride || 12;
        const count = positionAccessor.count;

        console.log(`📍 Масштабируем ${count} вершин в offset ${offset}, stride ${stride}`);

        for (let i = 0; i < count; i++) {
          const vertexOffset = offset + i * stride;

          // Читаем и масштабируем X, Y, Z
          const x = scaledData.readFloatLE(vertexOffset);
          const y = scaledData.readFloatLE(vertexOffset + 4);
          const z = scaledData.readFloatLE(vertexOffset + 8);

          scaledData.writeFloatLE(x * scaleFactor, vertexOffset);
          scaledData.writeFloatLE(y * scaleFactor, vertexOffset + 4);
          scaledData.writeFloatLE(z * scaleFactor, vertexOffset + 8);
        }

        positionScaled = true;
      }
    }

    if (positionScaled) {
      console.log('✅ Вершины успешно масштабированы');
    }

    return scaledData;
  } catch (error) {
    console.error('⚠️ Ошибка при масштабировании вершин:', error.message);
    return binaryData;
  }
}

/**
 * Перестраивает GLB файл с новыми chunk'ами
 */
function rebuildGLB(version, jsonBuffer, binaryBuffer) {
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // magic "glTF"
  header.writeUInt32LE(version, 4);
  header.writeUInt32LE(12 + 8 + jsonBuffer.length + 8 + binaryBuffer.length, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON"

  const binaryChunkHeader = Buffer.alloc(8);
  binaryChunkHeader.writeUInt32LE(binaryBuffer.length, 0);
  binaryChunkHeader.writeUInt32LE(0x004E4942, 4); // "BIN\0"

  return Buffer.concat([
    header,
    jsonChunkHeader,
    jsonBuffer,
    binaryChunkHeader,
    binaryBuffer
  ]);
}

module.exports = {
  scaleGLB
};
