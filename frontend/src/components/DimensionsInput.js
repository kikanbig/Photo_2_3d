import React, { useState } from 'react';
import { Ruler } from 'lucide-react';
import './DimensionsInput.css';

const DimensionsInput = ({ onDimensionsChange }) => {
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    unit: 'mm'
  });

  const handleChange = (field, value) => {
    const newDimensions = {
      ...dimensions,
      [field]: value
    };
    setDimensions(newDimensions);
    onDimensionsChange(newDimensions);
  };

  const handleUnitToggle = () => {
    const newUnit = dimensions.unit === 'mm' ? 'cm' : 'mm';
    const newDimensions = {
      ...dimensions,
      unit: newUnit
    };
    setDimensions(newDimensions);
    onDimensionsChange(newDimensions);
  };

  return (
    <div className="dimensions-input">
      <div className="dimensions-header">
        <Ruler className="dimensions-icon" />
        <h3 className="dimensions-title">Размеры объекта</h3>
        <span className="dimensions-subtitle">Для правильного масштаба в AR</span>
      </div>

      <div className="dimensions-fields">
        <div className="dimension-field">
          <label htmlFor="length">Длина</label>
          <div className="input-wrapper">
            <input
              id="length"
              type="number"
              placeholder="0"
              value={dimensions.length}
              onChange={(e) => handleChange('length', e.target.value)}
              min="0"
              step="0.1"
            />
            <span className="unit-label">{dimensions.unit}</span>
          </div>
        </div>

        <div className="dimension-field">
          <label htmlFor="width">Ширина</label>
          <div className="input-wrapper">
            <input
              id="width"
              type="number"
              placeholder="0"
              value={dimensions.width}
              onChange={(e) => handleChange('width', e.target.value)}
              min="0"
              step="0.1"
            />
            <span className="unit-label">{dimensions.unit}</span>
          </div>
        </div>

        <div className="dimension-field">
          <label htmlFor="height">Высота</label>
          <div className="input-wrapper">
            <input
              id="height"
              type="number"
              placeholder="0"
              value={dimensions.height}
              onChange={(e) => handleChange('height', e.target.value)}
              min="0"
              step="0.1"
            />
            <span className="unit-label">{dimensions.unit}</span>
          </div>
        </div>

        <button 
          className="unit-toggle"
          onClick={handleUnitToggle}
          title={`Переключить на ${dimensions.unit === 'mm' ? 'см' : 'мм'}`}
        >
          {dimensions.unit === 'mm' ? 'мм' : 'см'}
        </button>
      </div>
    </div>
  );
};

export default DimensionsInput;

