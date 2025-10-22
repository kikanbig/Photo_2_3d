import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUpload from './components/ImageUpload';
import ModelViewer from './components/ModelViewer';
import LoadingSpinner from './components/LoadingSpinner';
import StatusCard from './components/StatusCard';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setTaskId(null);
    setTaskStatus(null);
    setError(null);
  };

  const handleGenerate = async (imageFile, dimensions) => {
    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Добавляем размеры если они указаны
      if (dimensions) {
        formData.append('dimensions', JSON.stringify(dimensions));
      }

      const apiUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${apiUrl}/api/generation/upload`, {
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
      const apiUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      window.open(`${apiUrl}/api/generation/download/${taskId}`, '_blank');
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setTaskId(null);
    setTaskStatus(null);
    setIsGenerating(false);
    setError(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="App">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header onMenuToggle={toggleSidebar} />

      <main className="app-main">
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

            <div className="result-section">
              {isGenerating && (
                <div className="loading-container">
                  <LoadingSpinner />
                  <p className="loading-text">{taskStatus?.message || 'Генерация 3D модели...'}</p>
                </div>
              )}

              {taskStatus?.status === 'completed' && taskStatus?.result?.url && (
                <ModelViewer
                  modelUrl={taskStatus.result.url}
                />
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
          </div>

          {taskStatus && !isGenerating && (
            <div className="actions-bar">
              <StatusCard
                status={taskStatus.status}
                message={taskStatus.message}
                error={taskStatus.error}
                onDownload={handleDownload}
                onReset={handleReset}
                canDownload={taskStatus.status === 'completed'}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
      </div>
    </div>
  );
}

export default App;