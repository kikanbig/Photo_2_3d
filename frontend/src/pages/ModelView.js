import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowLeft, Download, Smartphone, Info } from 'lucide-react';
import { getModel } from '../services/api';
import ModelViewer from '../components/ModelViewer';
import './ModelView.css';

const ModelView = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arUrl, setArUrl] = useState('');

  useEffect(() => {
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const loadModel = async () => {
    try {
      setLoading(true);
      const data = await getModel(modelId);
      setModel(data);
      
      // Создаем URL для AR просмотра
      const baseUrl = window.location.origin;
      const arViewUrl = `${baseUrl}/ar-view/${modelId}`;
      setArUrl(arViewUrl);
    } catch (error) {
      console.error('Ошибка загрузки модели:', error);
      navigate('/my-models');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('.qr-canvas canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${model.name}.png`;
      link.href = url;
      link.click();
    }
  };

  if (loading || !model) {
    return (
      <div className="model-view-page loading">
        <div className="loading-spinner">
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

  return (
    <div className="model-view-page">
      {/* Header */}
      <div className="view-header">
        <button className="back-btn" onClick={() => navigate('/my-models')}>
          <ArrowLeft size={20} />
          Назад
        </button>
        <h1 className="model-title">{model.name}</h1>
      </div>

      {/* Split screen */}
      <div className="split-view">
        {/* Left - 3D Model */}
        <div className="view-section model-section">
          <div className="section-header">
            <h2>3D Модель</h2>
            {model.dimensions && (
              <div className="dimensions-badge">
                {model.dimensions.length} × {model.dimensions.width} × {model.dimensions.height} {model.dimensions.unit}
              </div>
            )}
          </div>
          <div className="model-viewer-container">
            {model.modelUrl ? (
              <ModelViewer modelUrl={model.modelUrl} />
            ) : (
              <div className="no-model">
                <Info size={48} />
                <p>Модель недоступна</p>
              </div>
            )}
          </div>
        </div>

        {/* Right - QR Code */}
        <div className="view-section qr-section">
          <div className="section-header">
            <h2>QR код для AR</h2>
            <Smartphone className="smartphone-icon" />
          </div>
          
          <div className="qr-container">
            <div className="qr-canvas">
              <QRCodeCanvas
                value={arUrl}
                size={280}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            <div className="qr-info">
              <h3>Как просмотреть в AR?</h3>
              <ol className="ar-instructions">
                <li>Откройте камеру на телефоне</li>
                <li>Наведите на QR код</li>
                <li>Нажмите на уведомление</li>
                <li>Модель откроется в AR режиме</li>
              </ol>
            </div>

            <button className="btn btn-primary download-qr-btn" onClick={downloadQR}>
              <Download size={20} />
              Скачать QR код
            </button>
          </div>

          <div className="ar-preview-link">
            <p>Или откройте ссылку напрямую:</p>
            <a href={arUrl} target="_blank" rel="noopener noreferrer" className="ar-link">
              {arUrl}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelView;

