import React, { Suspense, useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import './ModelViewer.css';

// Компонент для загрузки 3D модели с авто-фитом
function Model({ url, onComputed }) {
  console.log('🗂️ ModelViewer: пытаемся загрузить URL:', url);
  const { scene } = useGLTF(url);
  const computedRef = useRef(false);

  useLayoutEffect(() => {
    if (!scene || computedRef.current) return;

    // Вычисляем bounding box модели
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Центрируем модель в (0,0,0)
    scene.position.sub(center);

    // Нормализуем масштаб: целевой размер 0.5 по максимальному измерению (влезает в окно)
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const targetSize = 0.5;
    const uniformScale = targetSize / maxDimension;
    scene.scale.setScalar(uniformScale);

    // Пересчитываем bounding sphere после масштабирования
    const fittedBox = new THREE.Box3().setFromObject(scene);
    const sphere = new THREE.Sphere();
    fittedBox.getBoundingSphere(sphere);

    // Передаём радиус для настройки камеры/контролов (только один раз)
    onComputed?.(sphere.radius);
    computedRef.current = true;
  }, [scene, onComputed]);

  return <primitive object={scene} />;
}

// Компонент для автоматической настройки камеры
function FitCamera({ radius }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!radius) return;
    
    const fovRadians = (camera.fov * Math.PI) / 180;
    const distance = (radius / Math.sin(fovRadians / 2)) * 3.0; // увеличен отступ для меньшей модели

    camera.near = Math.max(distance / 100, 0.01);
    camera.far = Math.max(distance * 100, camera.near + 1);
    camera.position.set(0, 0, distance);
    camera.updateProjectionMatrix();
  }, [radius, camera]);

  return null;
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
  const [radius, setRadius] = useState(null);

  const handleComputed = useCallback((r) => {
    setRadius(r);
  }, []);

  return (
    <div className="model-viewer">
      <div className="viewer-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ 
            width: '100%', 
            height: '100%', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
          }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Suspense fallback={null}>
            <FitCamera radius={radius} />
            <Model url={modelUrl} onComputed={handleComputed} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              target={[0, 0, 0]}
              minDistance={radius ? Math.max(0.05, radius * 0.2) : 0.1}
              maxDistance={radius ? radius * 10 : 100}
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
