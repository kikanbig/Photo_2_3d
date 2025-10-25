import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Trash2, Eye, Calendar } from 'lucide-react';
import { getModels, deleteModel } from '../services/api';
import './MyModels.css';

const MyModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await getModels();
      setModels(data);
    } catch (error) {
      console.error('Ошибка загрузки моделей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modelId) => {
    if (window.confirm('Удалить эту модель?')) {
      try {
        await deleteModel(modelId);
        setModels(models.filter(m => m.id !== modelId));
      } catch (error) {
        console.error('Ошибка удаления модели:', error);
        alert('Ошибка удаления модели: ' + error.message);
      }
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

  if (loading) {
    return (
      <div className="my-models-page loading">
        <div className="loading-spinner">
          <div className="spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p>Загрузка моделей...</p>
        </div>
      </div>
    );
  }

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
        <div className="models-list">
          {models.map((model) => (
            <div key={model.id} className="model-row" onClick={() => handleView(model.id)}>
              <div className="model-thumbnail">
                {model.imageUrl ? (
                  <img
                    src={model.imageUrl}
                    alt={model.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="thumbnail-placeholder" style={{ display: model.imageUrl ? 'none' : 'flex' }}>
                  <Package size={32} />
                </div>
              </div>
              
              <div className="model-details">
                <h3 className="model-name">{model.name}</h3>
                {model.dimensions && (
                  <p className="model-dimensions">
                    {model.dimensions.length} × {model.dimensions.width} × {model.dimensions.height} {model.dimensions.unit}
                  </p>
                )}
              </div>

              <div className="model-date">
                <Calendar size={16} />
                <span>{formatDate(model.createdAt)}</span>
              </div>

              <div className="model-actions">
                <button
                  className="action-btn view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(model.id);
                  }}
                  title="Просмотр"
                >
                  <Eye size={18} />
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(model.id);
                  }}
                  title="Удалить"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyModels;

