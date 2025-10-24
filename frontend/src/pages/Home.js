import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { saveModel } from '../services/api';
import ImageUpload from '../components/ImageUpload';
import ModelViewer from '../components/ModelViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusCard from '../components/StatusCard';
import './Home.css';

const Home = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState(null);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setTaskId(null);
    setTaskStatus(null);
    setError(null);
  };

  const handleGenerate = async (imageFile, dims) => {
    setIsGenerating(true);
    setError(null);
    setDimensions(dims);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      if (dims) {
        formData.append('dimensions', JSON.stringify(dims));
      }

      const apiUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${apiUrl}/api/generation/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setTaskId(data.taskId);
        setTaskStatus({
          status: 'processing',
          message: 'Генерация 3D модели...'
        });

        pollTaskStatus(data.taskId);
      } else {
        throw new Error(data.error || 'Ошибка при загрузке изображения');
      }
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const pollTaskStatus = async (currentTaskId) => {
    const poll = async () => {
      try {
        const apiUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const response = await fetch(`${apiUrl}/api/generation/status/${currentTaskId}`);
        const data = await response.json();

        if (data.success) {
          const task = data.task;
          setTaskStatus({
            status: task.status,
            message: getStatusMessage(task.status),
            result: task.result,
            error: task.error
          });

          if (task.status === 'completed' || task.status === 'failed' || task.status === 'timeout') {
            setIsGenerating(false);
            return;
          }

          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error('Ошибка проверки статуса:', err);
        setError('Ошибка проверки статуса задачи');
        setIsGenerating(false);
      }
    };

    poll();
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'processing':
        return 'Генерация 3D модели...';
      case 'completed':
        return '3D модель готова!';
      case 'failed':
        return 'Ошибка генерации';
      case 'timeout':
        return 'Превышено время ожидания';
      default:
        return 'Обработка...';
    }
  };

  const handleDownload = () => {
    if (taskId && taskStatus?.status === 'completed') {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      window.open(`${apiUrl}/api/generation/download/${taskId}`, '_blank');
    }
  };

  const handleSave = async () => {
    if (taskId && taskStatus?.status === 'completed' && taskStatus.result) {
      try {
        // Модель уже сохранена в БД при генерации, просто обновляем метаданные
        const apiUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const response = await fetch(`${apiUrl}/api/models/update-metadata/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: selectedImage?.file?.name?.replace(/\.[^/.]+$/, "") || `Model ${Date.now()}`,
            dimensions: dimensions,
            metadata: {
              originalFileName: selectedImage?.file?.name,
              fileSize: selectedImage?.file?.size,
              generatedAt: new Date().toISOString()
            }
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления метаданных');
        }

        alert('✅ Модель сохранена! Посмотреть её можно в разделе "Мои модели"');
      } catch (error) {
        console.error('Ошибка сохранения модели:', error);
        alert('❌ Ошибка сохранения модели: ' + error.message);
      }
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setTaskId(null);
    setTaskStatus(null);
    setIsGenerating(false);
    setError(null);
  };

  return (
    <main className="home-page">
      <div className="container">
        <div className="workspace">
          <div className="upload-section">
            <ImageUpload
              onImageSelect={handleImageSelect}
              onGenerate={handleGenerate}
              selectedImage={selectedImage}
              isGenerating={isGenerating}
            />
          </div>

          <div className="result-section-wrapper">
            <div className="result-section">
              {isGenerating && (
                <div className="loading-container">
                  <LoadingSpinner />
                  <p className="loading-text">{taskStatus?.message || 'Генерация 3D модели...'}</p>
                </div>
              )}

              {taskStatus?.status === 'completed' && taskStatus?.result?.url && (
                <ModelViewer modelUrl={taskStatus.result.url} />
              )}

              {!isGenerating && !taskStatus && !error && (
                <div className="placeholder-container">
                  <p className="placeholder-text">👈 Загрузите фото для генерации 3D модели</p>
                </div>
              )}

              {error && (
                <div className="error-container">
                  <p className="error-text">{error}</p>
                </div>
              )}
            </div>

            {/* Блок действий под моделью */}
            {taskStatus && !isGenerating && (
              <div className="actions-panel">
                <StatusCard
                  status={taskStatus.status}
                  message={taskStatus.message}
                  error={taskStatus.error}
                  onDownload={handleDownload}
                  onReset={handleReset}
                  canDownload={taskStatus.status === 'completed'}
                />
                {taskStatus.status === 'completed' && (
                  <button className="btn btn-success" onClick={handleSave}>
                    <Save size={20} />
                    Сохранить модель
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;

