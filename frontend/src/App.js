import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MyModels from './pages/MyModels';
import ModelView from './pages/ModelView';
import ARView from './pages/ARView';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <p>Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Страницы аутентификации - без сайдбара */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* AR View - без сайдбара и футера */}
          <Route path="/ar-view/:modelId" element={<ARView />} />

          {/* Защищенные страницы с сайдбаром */}
          <Route path="*" element={
            <ProtectedRoute>
              <div className="App">
                <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                  <Header onMenuToggle={toggleSidebar} />

                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/create" element={<Home />} />
                    <Route path="/my-models" element={<MyModels />} />
                    <Route path="/model/:modelId" element={<ModelView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>

                  <Footer />
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
