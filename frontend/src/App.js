import React, { useState } from 'react';
import './App.css';
import ImageUpload from './components/ImageUpload';
import ModelViewer from './components/ModelViewer';
import LoadingSpinner from './components/LoadingSpinner';
import StatusCard from './components/StatusCard';
import { RotateCcw, Settings } from 'lucide-react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  // const [userInfo, setUserInfo] = useState(null); // Пока не используется

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setTaskId(null);
    setTaskStatus(null);
    setError(null);
  };

  const handleGenerate = async (imageFile) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('http://localhost:3001/api/generation/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setTaskId(data.taskId);
        setTaskStatus({ status: 'processing', message: 'Генерация 3D модели...' });
        
        // Начинаем опрос статуса
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
        const response = await fetch(`http://localhost:3001/api/generation/status/${currentTaskId}`);
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

          // Продолжаем опрос
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
      window.open(`http://localhost:3001/api/generation/download/${taskId}`, '_blank');
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
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <RotateCcw className="logo-icon" />
            <h1>Photo to 3D</h1>
          </div>
          <div className="header-actions">
            <button className="settings-btn">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="upload-section">
            <ImageUpload
              onImageSelect={handleImageSelect}
              onGenerate={handleGenerate}
              selectedImage={selectedImage}
              isGenerating={isGenerating}
            />
          </div>

          <div className="result-section">
            {isGenerating && (
              <div className="loading-container">
                <LoadingSpinner />
                <p className="loading-text">{taskStatus?.message || 'Генерация 3D модели...'}</p>
              </div>
            )}

            {taskStatus && !isGenerating && (
              <StatusCard
                status={taskStatus.status}
                message={taskStatus.message}
                error={taskStatus.error}
                onDownload={handleDownload}
                onReset={handleReset}
                canDownload={taskStatus.status === 'completed'}
              />
            )}

            {taskStatus?.status === 'completed' && taskStatus?.result?.url && (
              <ModelViewer
                modelUrl={taskStatus.result.url}
                onDownload={handleDownload}
              />
            )}

            {error && (
              <div className="error-container">
                <p className="error-text">{error}</p>
                <button onClick={handleReset} className="retry-btn">
                  Попробовать снова
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 Photo to 3D. Превращайте фотографии в 3D модели с помощью ИИ</p>
      </footer>
    </div>
  );
}

export default App;