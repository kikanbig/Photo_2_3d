import React, { useState } from 'react';
import { Ruler, FileText } from 'lucide-react';
import './ModelSettings.css';

const ModelSettings = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    name: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    }
  });

  const handleNameChange = (name) => {
    const newSettings = {
      ...settings,
      name
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleDimensionChange = (field, value) => {
    const newSettings = {
      ...settings,
      dimensions: {
        ...settings.dimensions,
        [field]: value
      }
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleUnitToggle = () => {
    const newUnit = settings.dimensions.unit === 'mm' ? 'cm' : 'mm';
    const newSettings = {
      ...settings,
      dimensions: {
        ...settings.dimensions,
        unit: newUnit
      }
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="model-settings">
      <h2 className="settings-title">Настройки модели</h2>
      
      {/* Имя модели */}
      <div className="setting-section">
        <div className="section-header">
          <FileText className="section-icon" />
          <h3 className="section-title">Имя модели</h3>
        </div>
        <div className="input-field">
          <input
            type="text"
            placeholder="Введите название модели"
            value={settings.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-input"
          />
        </div>
      </div>

      {/* Размеры */}
      <div className="setting-section">
        <div className="section-header">
          <Ruler className="section-icon" />
          <h3 className="section-title">Размеры объекта</h3>
          <span className="section-subtitle">Для правильного масштаба в AR</span>
        </div>

        <div className="dimensions-fields">
          <div className="dimension-field">
            <label htmlFor="width">Ширина</label>
            <div className="input-wrapper">
              <input
                id="width"
                type="number"
                placeholder="0"
                value={settings.dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                min="0"
                step="0.1"
              />
              <span className="unit-label">{settings.dimensions.unit}</span>
            </div>
          </div>

          <div className="dimension-field">
            <label htmlFor="length">Глубина</label>
            <div className="input-wrapper">
              <input
                id="length"
                type="number"
                placeholder="0"
                value={settings.dimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                min="0"
                step="0.1"
              />
              <span className="unit-label">{settings.dimensions.unit}</span>
            </div>
          </div>

          <div className="dimension-field">
            <label htmlFor="height">Высота</label>
            <div className="input-wrapper">
              <input
                id="height"
                type="number"
                placeholder="0"
                value={settings.dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                min="0"
                step="0.1"
              />
              <span className="unit-label">{settings.dimensions.unit}</span>
            </div>
          </div>

          <button 
            className="unit-toggle"
            onClick={handleUnitToggle}
            title={`Переключить на ${settings.dimensions.unit === 'mm' ? 'см' : 'мм'}`}
          >
            {settings.dimensions.unit === 'mm' ? 'мм' : 'см'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelSettings;

