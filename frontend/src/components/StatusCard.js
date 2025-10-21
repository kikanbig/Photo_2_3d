import React from 'react';
import { CheckCircle, XCircle, Clock, Download, RotateCcw } from 'lucide-react';
import './StatusCard.css';

const StatusCard = ({ status, message, error, onDownload, onReset, canDownload }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon success" size={48} />;
      case 'failed':
      case 'timeout':
        return <XCircle className="status-icon error" size={48} />;
      case 'processing':
        return <Clock className="status-icon processing" size={48} />;
      default:
        return <Clock className="status-icon processing" size={48} />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'completed':
        return 'status-card success';
      case 'failed':
      case 'timeout':
        return 'status-card error';
      case 'processing':
        return 'status-card processing';
      default:
        return 'status-card processing';
    }
  };

  return (
    <div className={getStatusClass()}>
      <div className="status-content">
        {getStatusIcon()}
        <h3 className="status-title">{message}</h3>
        
        {error && (
          <div className="error-details">
            <p className="error-message">{error}</p>
          </div>
        )}

        {status === 'completed' && (
          <div className="success-details">
            <p className="success-message">
              Ваша 3D модель готова! Вы можете скачать её в формате GLB.
            </p>
          </div>
        )}

        <div className="status-actions">
          {canDownload && (
            <button className="btn btn-success" onClick={onDownload}>
              <Download size={20} />
              Скачать 3D модель
            </button>
          )}
          
          <button className="btn btn-secondary" onClick={onReset}>
            <RotateCcw size={20} />
            Создать новую модель
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
