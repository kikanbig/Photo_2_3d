import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadModel();
  }, [modelId]);

  const loadModel = async () => {
    try {
      setLoading(true);
      const data = await getModel(modelId);
      setModel(data);
    } catch (err) {
      console.error('Ошибка загрузки модели:', err);
      setError('Модель не найдена');
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
          <p>Проверьте QR код и попробуйте снова</p>
          <button className="btn" onClick={() => navigate('/')}>
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
        <model-viewer
          src={model.modelUrl}
          alt={model.name}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          ar-scale={arScale}
          ios-src={model.modelUrl}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0f'
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

