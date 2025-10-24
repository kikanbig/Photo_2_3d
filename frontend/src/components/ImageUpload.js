import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import './ImageUpload.css';

const ImageUpload = ({ onImageSelect, selectedImage }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageSelect({
        file: file,
        preview: e.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload">
      <h2 className="upload-title">Загрузите фотографию</h2>
      <p className="upload-subtitle">
        Выберите изображение для создания 3D модели
      </p>

      {!selectedImage ? (
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="upload-content">
            <Upload className="upload-icon" size={48} />
            <h3>Перетащите изображение сюда</h3>
            <p>или нажмите для выбора файла</p>
            <div className="supported-formats">
              <span>Поддерживаемые форматы: JPG, PNG, GIF, WebP</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="image-preview">
          <div className="preview-container">
            <img
              src={selectedImage.preview}
              alt="Предварительный просмотр"
              className="preview-image"
            />
            <button
              className="remove-btn"
              onClick={handleRemoveImage}
            >
              <X size={20} />
            </button>
          </div>
          <div className="image-info">
            <div className="info-item">
              <ImageIcon size={16} />
              <span>{selectedImage.file.name}</span>
            </div>
            <div className="info-item">
              <span>Размер: {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageUpload;
