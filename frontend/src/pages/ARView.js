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
  const modelViewerRef = useRef(null);

  useEffect(() => {
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (modelViewer && model) {
      // Принудительно устанавливаем src через setAttribute
      console.log('🎨 Setting model src:', model.modelUrl);
      modelViewer.setAttribute('src', model.modelUrl);
      modelViewer.setAttribute('alt', model.name || 'AR Model');
      
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
          offsetHeight: modelViewer.offsetHeight
        });
        console.log('🎥 Camera:', modelViewer.getCameraOrbit());
        console.log('🔍 Field of view:', modelViewer.fieldOfView);
        
        clearTimeout(timeout);
        // КРИТИЧЕСКИ ВАЖНО: скрываем overlay сразу!
        setModelLoading(false);
        
        // Принудительно обновляем рендер через 100ms
        setTimeout(() => {
          if (modelViewer) {
            console.log('🔄 Force jumpCameraToGoal');
            modelViewer.jumpCameraToGoal();
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

      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);
      modelViewer.addEventListener('progress', handleProgress);

      return () => {
        clearTimeout(timeout);
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
        modelViewer.removeEventListener('progress', handleProgress);
      };
    }
  }, [model]);

  const loadModel = async () => {
    try {
      setLoading(true);
      console.log('Загрузка модели:', modelId);
      
      const data = await getModel(modelId);
      console.log('Модель загружена:', data);
      
      if (!data || !data.modelUrl) {
        throw new Error('URL модели не найден');
      }
      
      setModel(data);
    } catch (err) {
      console.error('Ошибка загрузки модели:', err);
      setError(`Модель не найдена: ${err.message}`);
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

  if (error || !model) {
    return (
      <div className="ar-view-page error">
        <div className="ar-error">
          <h2>❌ {error || 'Модель не найдена'}</h2>
          <p>Возможные причины:</p>
          <ul style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <li>Модель еще не сохранена в базе данных</li>
            <li>Неверный ID модели в QR коде</li>
            <li>База данных не подключена</li>
          </ul>
          <p style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
            ID модели: <code style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>{modelId}</code>
          </p>
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

  // Настройки для AR
  const arScale = model.dimensions 
    ? `${model.dimensions.length / 1000} ${model.dimensions.width / 1000} ${model.dimensions.height / 1000}` 
    : 'auto';

  return (
    <div className="ar-view-page">
      <div className="ar-header">
        <h1>{model.name}</h1>
        {model.dimensions && (
          <p className="ar-dimensions">
            {model.dimensions.length} × {model.dimensions.width} × {model.dimensions.height} {model.dimensions.unit}
          </p>
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
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1.5"
          ar-scale={arScale}
          ios-src={model.modelUrl}
          loading="eager"
          reveal="auto"
          camera-orbit="0deg 75deg 105%"
          field-of-view="30deg"
          min-camera-orbit="auto auto 5%"
          max-camera-orbit="auto auto 200%"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a2e',
            display: 'block'
          }}
        >
          <button slot="ar-button" className="ar-button">
            👁️ Посмотреть в AR
          </button>
          
          <div className="ar-prompt" slot="ar-prompt">
            <div className="ar-prompt-content">
              <div className="ar-icon">📱</div>
              <h2>Просмотр в дополненной реальности</h2>
              <p>Нажмите кнопку ниже, чтобы увидеть модель в вашем пространстве</p>
            </div>
          </div>
        </model-viewer>
      </div>

      <div className="ar-instructions">
        <h3>📱 Как использовать AR:</h3>
        <ol>
          <li>Нажмите кнопку "Посмотреть в AR"</li>
          <li>Наведите камеру на ровную поверхность</li>
          <li>Дождитесь обнаружения плоскости</li>
          <li>Нажмите для размещения модели</li>
          <li>Двигайте модель пальцами</li>
        </ol>
        
        <div className="ar-compatibility">
          <p>✅ iOS 12+ (Quick Look)</p>
          <p>✅ Android 7.0+ (Scene Viewer)</p>
        </div>
      </div>
    </div>
  );
};

export default ARView;

