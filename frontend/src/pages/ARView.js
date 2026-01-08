import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModel } from '../services/api';
import '@google/model-viewer';
import './ARView.css';

const ARView = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [arScale, setArScale] = useState(100); // Масштаб в процентах
  const [isInAR, setIsInAR] = useState(false);
  const modelViewerRef = useRef(null);

  useEffect(() => {
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (modelViewer && model) {
      // Принудительно устанавливаем src через setAttribute
      // Используем полный абсолютный URL для iOS
      const fullModelUrl = model.modelUrl.startsWith('http') 
        ? model.modelUrl 
        : `${window.location.origin}${model.modelUrl}`;
      
      console.log('🎨 Setting model src:', fullModelUrl);
      console.log('📱 User agent:', navigator.userAgent);
      console.log('🍎 Is iOS:', /iPhone|iPad|iPod/.test(navigator.userAgent));
      
      modelViewer.setAttribute('src', fullModelUrl);
      
      // Настройка Scene Viewer согласно документации Google
      const title = model.name || '3D Model';
      const link = window.location.href;
      
      modelViewer.setAttribute('alt', title);
      
      // ✅ GLB УЖЕ МАСШТАБИРОВАН НА БЭКЕНДЕ!
      // Никаких ar-scale параметров не нужно
      // Модель загружается в правильном размере сразу!
      
      // Создаём Scene Viewer URL с полным абсолютным URL
      const sceneViewerUrl = new URL('https://arvr.google.com/scene-viewer/1.1');
      sceneViewerUrl.searchParams.set('file', fullModelUrl);
      sceneViewerUrl.searchParams.set('mode', 'ar_preferred');
      sceneViewerUrl.searchParams.set('title', title);
      sceneViewerUrl.searchParams.set('link', link);
      sceneViewerUrl.searchParams.set('resizable', 'true');
      sceneViewerUrl.searchParams.set('enable_vertical_placement', 'true');
      
      console.log('📱 Scene Viewer URL:', sceneViewerUrl.toString());
      
      // Устанавливаем кастомный Intent для Android
      if (modelViewer.canActivateAR) {
        modelViewer.activateAR();
      }
      
      // Настраиваем WebXR DOM Overlay
      if (navigator.xr) {
        console.log('✅ WebXR доступен');
        
        // Проверяем поддержку DOM Overlay
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
          if (supported) {
            console.log('✅ AR сессия поддерживается');
            
            // Регистрируем overlay элемент
            const overlayElement = document.getElementById('ar-scale-info');
            if (overlayElement) {
              console.log('✅ Overlay элемент найден');
              // Устанавливаем как overlay для model-viewer
              modelViewer.xrEnvironment = true;
            }
          } else {
            console.log('⚠️ AR сессия не поддерживается');
          }
        });
      } else {
        console.log('⚠️ WebXR не доступен');
      }
      
      // Таймаут на случай если событие load не сработает
      const timeout = setTimeout(() => {
        console.log('⏱️ Timeout: Force hiding loading overlay');
        setModelLoading(false);
      }, 5000); // 5 секунд максимум
      
          const handleLoad = () => {
            console.log('✅ Model loaded successfully - hiding overlay');
            console.log('📐 Model viewer dimensions:', {
              width: modelViewer.clientWidth,
              height: modelViewer.clientHeight,
              offsetWidth: modelViewer.offsetWidth,
              offsetHeight: modelViewer.offsetHeight,
              scrollWidth: modelViewer.scrollWidth,
              scrollHeight: modelViewer.scrollHeight,
              parentWidth: modelViewer.parentElement?.clientWidth,
              parentHeight: modelViewer.parentElement?.clientHeight
            });
            console.log('🎥 Camera orbit:', modelViewer.getCameraOrbit());
            console.log('🎯 Camera target:', modelViewer.getCameraTarget());
            console.log('🔍 Field of view:', modelViewer.fieldOfView);
            console.log('📦 Model bounds:', modelViewer.getBoundingBoxCenter());
            
            // 🧪 ОТЛАДКА: получаем реальные размеры GLB модели
            try {
              const bbox = modelViewer.getBoundingBoxCenter();
              const dimensions = modelViewer.getDimensions();
              
              console.log('📦 Real GLB model dimensions:', {
                boundingBox: bbox,
                dimensions: dimensions,
                expected: model.dimensions,
                currentScale: modelViewer.scale
              });
              
              // Проверяем размеры модели в AR (информационно)
              if (model.dimensions && dimensions) {
                const expectedSizes = {
                  width: model.dimensions.width / 100,   // X ось
                  height: model.dimensions.height / 100, // Y ось
                  depth: model.dimensions.length / 100   // Z ось
                };

                const actualSizes = {
                  x: dimensions.x,
                  y: dimensions.y,
                  z: dimensions.z
                };

                console.log('📐 AR размеры модели:', {
                  expected: {
                    'Ширина (X)': expectedSizes.width.toFixed(3) + 'm',
                    'Высота (Y)': expectedSizes.height.toFixed(3) + 'm',
                    'Глубина (Z)': expectedSizes.depth.toFixed(3) + 'm'
                  },
                  actual: {
                    'X': actualSizes.x.toFixed(3) + 'm',
                    'Y': actualSizes.y.toFixed(3) + 'm',
                    'Z': actualSizes.z.toFixed(3) + 'm'
                  },
                  note: 'Реальные размеры зависят от ориентации модели в AR'
                });
              }
            } catch (e) {
              console.log('⚠️ Не удалось получить размеры модели:', e);
            }
            
            clearTimeout(timeout);
            // КРИТИЧЕСКИ ВАЖНО: скрываем overlay сразу!
            setModelLoading(false);
            
            // Принудительно сбрасываем камеру и рендерим
            setTimeout(() => {
              if (modelViewer) {
                console.log('🔄 Resetting camera and forcing render...');
                
                // Сбрасываем камеру к модели
                modelViewer.resetTurntableRotation();
                modelViewer.jumpCameraToGoal();
                
                // Принудительно вызываем рендер
                if (modelViewer.updateFraming) {
                  modelViewer.updateFraming();
                }
                
                // Начинаем авто-вращение
                modelViewer.play();
                
                console.log('✨ Camera reset complete');
                console.log('🎥 New camera orbit:', modelViewer.getCameraOrbit());
              }
            }, 100);
          };
      
      const handleError = (event) => {
        console.error('❌ Model failed to load:', event);
        clearTimeout(timeout);
        setModelLoading(false);
      };
      
      const handleProgress = (event) => {
        const progress = event.detail.totalProgress;
        console.log(`📊 Loading: ${(progress * 100).toFixed(1)}%`);
        
        // Если прогресс 100% (или очень близко), скрываем overlay
        if (progress >= 0.99) {
          console.log('✅ Progress 99%+ - hiding overlay');
          clearTimeout(timeout);
          setModelLoading(false);
        }
      };

      const handleArStatusChange = (event) => {
        console.log('🎯 AR Status event:', event);
        console.log('🎯 AR Status:', modelViewer.arStatus);
        
        const isInArMode = modelViewer.arStatus === 'session-started' || 
                           modelViewer.arStatus === 'object-placed';
        
        console.log('🎯 Is in AR mode:', isInArMode);
        setIsInAR(isInArMode);
      };
      
      // Перехватываем AR клик для добавления параметров Scene Viewer
      const handleArClick = (event) => {
        console.log('🎯 AR button clicked');
        
        // Для Android Scene Viewer добавляем параметры
        if (modelViewer && model.dimensions) {
          const sceneViewerParams = {
            resizable: true,
            enable_vertical_placement: true,
            disable_occlusion: false,
            title: model.name || '3D Model',
            link: window.location.href
          };
          
          console.log('📱 Scene Viewer params:', sceneViewerParams);
          
          // Параметры будут добавлены через model-viewer автоматически
          // если они поддерживаются в текущей версии
        }
      };
      
      // WebXR Session started - настраиваем overlay
      const handleSessionStart = async (event) => {
        console.log('🚀 WebXR Session started!');
        setIsInAR(true);
        
        const session = event.detail?.session || modelViewer.xrSession;
        if (session) {
          console.log('✅ XR Session получена');
          
          // Получаем overlay элемент
          const overlayElement = document.getElementById('ar-scale-info');
          if (overlayElement) {
            console.log('✅ Показываем overlay в WebXR');
            overlayElement.style.display = 'flex';
          }
        }
      };
      
      const handleSessionEnd = () => {
        console.log('🛑 WebXR Session ended');
        setIsInAR(false);
      };

      const handleScaleChange = () => {
        try {
          // В AR режиме нужно отслеживать через transform
          const updateScale = () => {
            if (modelViewer.arScale) {
              console.log('📏 AR Scale:', modelViewer.arScale);
            }
            
            // Пытаемся получить текущий масштаб разными способами
            if (modelViewer.scale) {
              const scale = parseFloat(modelViewer.scale);
              const scalePercent = Math.round(scale * 100);
              setArScale(scalePercent);
              console.log('📏 Scale changed:', scalePercent + '%');
            }
          };
          
          updateScale();
        } catch (e) {
          console.log('Scale change error:', e);
        }
      };
      
      // Интервал для постоянного обновления масштаба в AR
      const scaleInterval = setInterval(() => {
        if (isInAR && modelViewer) {
          handleScaleChange();
        }
      }, 500); // Каждые 500мс

      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);
      modelViewer.addEventListener('progress', handleProgress);
      modelViewer.addEventListener('ar-status', handleArStatusChange);
      modelViewer.addEventListener('scale-change', handleScaleChange);
      
      // WebXR события
      modelViewer.addEventListener('ar-session-start', handleSessionStart);
      modelViewer.addEventListener('ar-session-end', handleSessionEnd);
      
      // AR button click
      const arButton = modelViewer.querySelector('[slot="ar-button"]');
      if (arButton) {
        arButton.addEventListener('click', handleArClick);
      }

      return () => {
        clearTimeout(timeout);
        clearInterval(scaleInterval);
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
        modelViewer.removeEventListener('progress', handleProgress);
        modelViewer.removeEventListener('ar-status', handleArStatusChange);
        modelViewer.removeEventListener('scale-change', handleScaleChange);
        modelViewer.removeEventListener('ar-session-start', handleSessionStart);
        modelViewer.removeEventListener('ar-session-end', handleSessionEnd);
        if (arButton) {
          arButton.removeEventListener('click', handleArClick);
        }
      };
    }
  }, [model, isInAR]);

  const loadModel = async () => {
    try {
      setLoading(true);
      console.log('🔍 Загрузка модели:', modelId);
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🌐 Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Other');
      console.log('🍎 iOS:', /iPhone|iPad|iPod/.test(navigator.userAgent));
      
      const data = await getModel(modelId);
      console.log('✅ Модель загружена:', data);
      console.log('📊 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О МОДЕЛИ:');
      console.log('  - id:', data?.id);
      console.log('  - name:', data?.name);
      console.log('  - modelUrl:', data?.modelUrl);
      console.log('  - dimensions:', data?.dimensions);
      console.log('  - taskId:', data?.taskId);
      console.log('  - status:', data?.status);
      console.log('  - metadata:', data?.metadata);
      
      if (!data || !data.modelUrl) {
        throw new Error('URL модели не найден в ответе сервера');
      }
      
      setModel(data);
    } catch (err) {
      console.error('❌ Ошибка загрузки модели:', err);
      console.error('❌ Детали ошибки:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      // Более понятное сообщение об ошибке
      let errorMessage = 'Модель не найдена';
      if (err.message.includes('404')) {
        errorMessage = 'Модель не найдена или недоступна. Убедитесь, что модель была сохранена и имеет статус "активна".';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = `Не удалось загрузить модель: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ar-view-page loading">
        <div className="ar-loading">
          <div className="spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p>Загрузка модели...</p>
        </div>
      </div>
    );
  }

  // Проверка браузера для iOS
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isChrome = navigator.userAgent.includes('CriOS');

  if (error || !model) {
    return (
      <div className="ar-view-page error">
        <div className="ar-error">
          <h2>❌ {error || 'Модель не найдена'}</h2>
          
          {/* Предупреждение для Chrome на iOS */}
          {isIOS && isChrome && (
            <div style={{
              background: 'rgba(255, 165, 0, 0.1)',
              border: '2px solid rgba(255, 165, 0, 0.5)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff9500' }}>⚠️ Используйте Safari</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Chrome на iOS не поддерживает AR просмотр. 
                Пожалуйста, откройте эту ссылку в Safari для полного функционала.
              </p>
            </div>
          )}
          
          <p>Возможные причины:</p>
          <ul style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <li>Модель не сохранена или имеет статус "неактивна"</li>
            <li>Неверный ID модели в QR коде</li>
            <li>Ошибка подключения к серверу</li>
            {isIOS && isChrome && <li><strong>Chrome на iOS не поддерживает AR (используйте Safari)</strong></li>}
          </ul>
          <p style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
            ID модели: <code style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>{modelId}</code>
          </p>
          
          {/* Кнопка "Открыть в Safari" для iOS Chrome */}
          {isIOS && isChrome && (
            <button 
              className="btn"
              onClick={() => {
                // Копируем ссылку для открытия в Safari
                const currentUrl = window.location.href;
                navigator.clipboard.writeText(currentUrl).then(() => {
                  alert('✅ Ссылка скопирована!\n\n1. Откройте Safari\n2. Вставьте ссылку в адресную строку\n3. Модель откроется с поддержкой AR');
                });
              }}
              style={{
                background: 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
                color: 'white',
                border: 'none',
                padding: '0.875rem 1.5rem',
                marginBottom: '1rem'
              }}
            >
              📋 Скопировать ссылку для Safari
            </button>
          )}
          
          <button 
            className="btn" 
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #5744e2 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              padding: '0.875rem 1.5rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  // Форматируем размеры для отображения
  const getDimensionsText = () => {
    if (!model.dimensions) return 'Размеры не указаны';
    const { length, width, height, unit } = model.dimensions;
    return `${width} × ${height} × ${length} ${unit}`;
  };

  return (
    <div className="ar-view-page">
      <div className="ar-header">
        <h1>{model.name}</h1>
        {model.dimensions && (
          <p className="ar-dimensions">
            {model.dimensions.width} × {model.dimensions.height} × {model.dimensions.length} {model.dimensions.unit}
          </p>
        )}
        
        {/* Предупреждение для Chrome на iOS */}
        {isIOS && isChrome && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.15)',
            border: '2px solid rgba(255, 165, 0, 0.6)',
            borderRadius: '12px',
            padding: '1rem',
            marginTop: '1rem',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff9500', fontSize: '1rem' }}>
              ⚠️ Ограниченная функциональность
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
              Chrome на iOS не поддерживает AR просмотр. Для полного функционала откройте эту страницу в Safari.
            </p>
            <button 
              onClick={() => {
                const currentUrl = window.location.href;
                navigator.clipboard.writeText(currentUrl).then(() => {
                  alert('✅ Ссылка скопирована! Откройте Safari и вставьте ссылку.');
                });
              }}
              style={{
                background: '#ff9500',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginTop: '0.75rem',
                cursor: 'pointer'
              }}
            >
              📋 Скопировать ссылку
            </button>
          </div>
        )}
      </div>

      <div className="ar-viewer-container">
        {modelLoading && (
          <div 
            className="model-loading-overlay"
            onClick={() => {
              console.log('Overlay clicked - force hide');
              setModelLoading(false);
            }}
          >
            <div className="spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p>Загрузка 3D модели...</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '1rem' }}>
              Нажмите для пропуска
            </p>
          </div>
        )}

        <model-viewer
          ref={modelViewerRef}
          ar
          ar-modes="scene-viewer webxr quick-look"
          camera-controls
          touch-action="pan-y"
          auto-rotate
          auto-rotate-delay="0"
          rotation-per-second="30deg"
          shadow-intensity="1"
          environment-image="neutral"
          exposure="2"
          ar-placement="floor"
          ios-src={`${window.location.origin}/api/models/${model.id}/download-glb`}
          loading="eager"
          reveal="auto"
          camera-orbit="45deg 75deg 2m"
          field-of-view="45deg"
          min-camera-orbit="auto auto auto"
          max-camera-orbit="auto auto auto"
          interpolation-decay="100"
          alt={model.name || '3D Model'}
        >
          <button
            slot="ar-button"
            className="ar-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Создаем URL для Google Scene Viewer с полными AR параметрами
              const baseUrl = window.location.origin;
              const glbUrl = `${baseUrl}/api/models/${model.id}/download-glb`;

              // Параметры для идеального AR поведения (как в Telegram)
              const arParams = new URLSearchParams({
                file: glbUrl,
                mode: 'ar_preferred',
                title: model.name || '3D Model',
                link: window.location.href,
                // Ключевые параметры для правильного AR поведения:
                resizable: 'true',                    // Можно менять размер
                enable_vertical_placement: 'false',   // Запрещаем вертикальное размещение (ТОЛЬКО ПОЛ!)
                enable_horizontal_placement: 'true',  // Разрешаем размещение ТОЛЬКО на полу
                disable_occlusion: 'false',          // Включаем окклюзию (прозрачность при пересечении)
                // Дополнительные параметры для лучшего UX:
                environment_image: 'neutral',        // Нейтральное окружение
                disable_tap: 'false',               // Разрешаем тапы для взаимодействия
                magic_window: 'false',              // Отключаем magic window режим
                sound_name: '',                     // Без звука
                cardboard_magnet: 'false'          // Для Cardboard VR
              });

              const arUrl = `https://arvr.google.com/scene-viewer/1.1?${arParams.toString()}`;

              console.log('🚀 Открываем Google Scene Viewer с полными AR параметрами:', arUrl);
              console.log('📋 Полные AR параметры (как в Telegram):', {
                file: glbUrl,
                mode: 'ar_preferred',
                title: model.name || '3D Model',
                resizable: true,                    // Масштабирование включено
                enable_vertical_placement: false,   // ТОЛЬКО ПОЛ! (ключевой параметр)
                enable_horizontal_placement: true, // Размещение на полу
                disable_occlusion: false,          // Окклюзия ВКЛЮЧЕНА (прозрачность)
                environment_image: 'neutral',      // Нейтральное окружение
                magic_window: false               // Без magic window
              });
              console.log('🎯 Ожидаемое поведение: белый контур, полупрозрачность при пересечении, размещение на полу');

              window.open(arUrl, '_blank');
            }}
          >
            🏠 Примерить в комнате
          </button>
          
          <div className="ar-prompt" slot="ar-prompt">
            <div className="ar-prompt-content">
              <div className="ar-icon">📱</div>
              <h2>Просмотр в дополненной реальности</h2>
              <p>Нажмите кнопку ниже, чтобы увидеть модель в вашем пространстве</p>
            </div>
          </div>

        </model-viewer>
        
        {/* Floating AR info - для WebXR режима */}
        <div id="ar-scale-info" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          pointerEvents: 'none',
          display: isInAR ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '90%',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '12px 20px',
            borderRadius: '20px',
            border: '2px solid rgba(87, 68, 226, 0.6)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '1.75rem' }}>📏</div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '2px'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#ffffff',
                lineHeight: 1
              }}>
                {arScale}%
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                от реального размера
              </div>
              {model.dimensions && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(139, 92, 246, 1)',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  Реальный: {getDimensionsText()}
                </div>
              )}
            </div>
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            Жест «щипок» для изменения масштаба
          </div>
        </div>
      </div>

    </div>
  );
};

export default ARView;

