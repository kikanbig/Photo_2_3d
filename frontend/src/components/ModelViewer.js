import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import './ModelViewer.css';

// Компонент для загрузки 3D модели
function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1} />;
}

// Компонент загрузки (пока не используется)
// function LoadingFallback() {
//   return (
//     <div className="model-loading">
//       <div className="loading-spinner">
//         <div className="spinner">
//           <div className="spinner-ring"></div>
//           <div className="spinner-ring"></div>
//           <div className="spinner-ring"></div>
//           <div className="spinner-ring"></div>
//         </div>
//       </div>
//       <p>Загрузка 3D модели...</p>
//     </div>
//   );
// }

const ModelViewer = ({ modelUrl }) => {
  return (
    <div className="model-viewer">
      <div className="viewer-header">
        <h3>✨ Ваша 3D модель готова!</h3>
      </div>
      
      <div className="viewer-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
        >
          <Suspense fallback={null}>
            <Model url={modelUrl} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
            />
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="viewer-info">
        <p className="viewer-instructions">
          Используйте мышь для поворота, масштабирования и перемещения модели
        </p>
        <div className="viewer-controls">
          <div className="control-item">
            <span className="control-key">ЛКМ</span>
            <span>Поворот</span>
          </div>
          <div className="control-item">
            <span className="control-key">ПКМ</span>
            <span>Перемещение</span>
          </div>
          <div className="control-item">
            <span className="control-key">Колесо</span>
            <span>Масштаб</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;
