import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import './ModelViewer.css';

// Компонент для загрузки 3D модели
function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={3} />; // Увеличен масштаб в 3 раза
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
      <div className="viewer-container">
        <Canvas
          camera={{ position: [0, 0, 3], fov: 60 }}
          style={{ 
            width: '100%', 
            height: '100%', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
          }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Suspense fallback={null}>
            <Model url={modelUrl} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={8}
            />
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default ModelViewer;
