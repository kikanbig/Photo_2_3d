import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MyModels from './pages/MyModels';
import ModelView from './pages/ModelView';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
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
    </Router>
  );
}

export default App;
