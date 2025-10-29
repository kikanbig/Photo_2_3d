import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Trash2, Eye, Calendar, Edit } from 'lucide-react';
import { getModels, deleteModel, updateModel } from '../services/api';
import './MyModels.css';

const MyModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    }
  });
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

  const handleEdit = (model, e) => {
    e.stopPropagation();
    setEditingModel(model);
    setEditForm({
      name: model.name || '',
      dimensions: {
        length: model.dimensions?.length || '',
        width: model.dimensions?.width || '',
        height: model.dimensions?.height || '',
        unit: model.dimensions?.unit || 'cm'
      }
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        name: editForm.name,
        dimensions: {
          length: parseFloat(editForm.dimensions.length),
          width: parseFloat(editForm.dimensions.width),
          height: parseFloat(editForm.dimensions.height),
          unit: editForm.dimensions.unit
        }
      };

      await updateModel(editingModel.id, updatedData);

      // Обновляем модель в списке
      setModels(models.map(m =>
        m.id === editingModel.id
          ? { ...m, ...updatedData }
          : m
      ));

      setEditingModel(null);
      setEditForm({
        name: '',
        dimensions: { length: '', width: '', height: '', unit: 'cm' }
      });
    } catch (error) {
      console.error('Ошибка обновления модели:', error);
      alert('Ошибка обновления модели: ' + error.message);
    }
  };

  const handleEditCancel = () => {
    setEditingModel(null);
    setEditForm({
      name: '',
      dimensions: { length: '', width: '', height: '', unit: 'cm' }
    });
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
                      console.log('❌ Ошибка загрузки изображения:', model.imageUrl);
                      console.log('📊 Данные модели:', {
                        id: model.id,
                        name: model.name,
                        imageUrl: model.imageUrl,
                        originalImageUrl: model.originalImageUrl,
                        previewImageUrl: model.previewImageUrl
                      });
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
                    {model.dimensions.width} × {model.dimensions.height} × {model.dimensions.length} {model.dimensions.unit}
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
                  className="action-btn edit-btn"
                  onClick={(e) => handleEdit(model, e)}
                  title="Редактировать"
                >
                  <Edit size={18} />
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

      {/* Модальное окно редактирования */}
      {editingModel && (
        <div className="modal-overlay" onClick={handleEditCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Редактировать модель</h3>
              <button className="modal-close" onClick={handleEditCancel}>×</button>
            </div>

            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label htmlFor="name">Название модели</label>
                <input
                  type="text"
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Введите название модели"
                  required
                />
              </div>

              <div className="dimensions-section">
                <h4>Размеры модели</h4>
                <div className="dimensions-grid">
                  <div className="form-group">
                    <label htmlFor="width">Ширина</label>
                    <input
                      type="number"
                      id="width"
                      step="0.01"
                      value={editForm.dimensions.width}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        dimensions: { ...editForm.dimensions, width: e.target.value }
                      })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="length">Глубина</label>
                    <input
                      type="number"
                      id="length"
                      step="0.01"
                      value={editForm.dimensions.length}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        dimensions: { ...editForm.dimensions, length: e.target.value }
                      })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="height">Высота</label>
                    <input
                      type="number"
                      id="height"
                      step="0.01"
                      value={editForm.dimensions.height}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        dimensions: { ...editForm.dimensions, height: e.target.value }
                      })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="unit">Единица измерения</label>
                    <select
                      id="unit"
                      value={editForm.dimensions.unit}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        dimensions: { ...editForm.dimensions, unit: e.target.value }
                      })}
                    >
                      <option value="cm">см</option>
                      <option value="mm">мм</option>
                      <option value="m">м</option>
                      <option value="in">дюймы</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleEditCancel}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyModels;

