import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Trash2, Eye, Calendar } from 'lucide-react';
import './MyModels.css';

const MyModels = () => {
  const [models, setModels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = () => {
    const savedModels = JSON.parse(localStorage.getItem('savedModels') || '[]');
    setModels(savedModels);
  };

  const handleDelete = (modelId) => {
    if (window.confirm('Удалить эту модель?')) {
      const updatedModels = models.filter(m => m.id !== modelId);
      localStorage.setItem('savedModels', JSON.stringify(updatedModels));
      setModels(updatedModels);
    }
  };

  const handleView = (modelId) => {
    navigate(`/model/${modelId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="my-models-page">
      <div className="page-header">
        <div className="header-left">
          <Package className="page-icon" />
          <div>
            <h1 className="page-title">Мои модели</h1>
            <p className="page-subtitle">Ваши сохранённые 3D модели</p>
          </div>
        </div>
        <div className="models-count">
          <span className="count-value">{models.length}</span>
          <span className="count-label">моделей</span>
        </div>
      </div>

      {models.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-icon" />
          <h3>У вас пока нет сохранённых моделей</h3>
          <p>Создайте свою первую 3D модель из фотографии</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Создать модель
          </button>
        </div>
      ) : (
        <div className="models-grid">
          {models.map((model) => (
            <div key={model.id} className="model-card">
              <div className="model-preview">
                {model.previewImage ? (
                  <img src={model.previewImage} alt={model.name} />
                ) : (
                  <div className="no-preview">
                    <Package size={48} />
                  </div>
                )}
                <div className="model-overlay">
                  <button
                    className="overlay-btn"
                    onClick={() => handleView(model.id)}
                    title="Просмотр"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    className="overlay-btn delete"
                    onClick={() => handleDelete(model.id)}
                    title="Удалить"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="model-info">
                <h3 className="model-name">{model.name}</h3>
                {model.dimensions && (
                  <p className="model-dimensions">
                    {model.dimensions.length} × {model.dimensions.width} × {model.dimensions.height} {model.dimensions.unit}
                  </p>
                )}
                <div className="model-meta">
                  <Calendar size={14} />
                  <span>{formatDate(model.savedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyModels;

