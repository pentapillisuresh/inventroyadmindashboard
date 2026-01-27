import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { storage } from './data/storage';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import StoreManagement from './pages/StoreManagement';
import StoreDetails from './pages/StoreDetails';
import OutletManagement from './pages/OutletManagement';
import ManagerManagement from './pages/ManagerManagement';
import CreateStore from './pages/CreateStore';
import ProductManagement from './pages/ProductManagement';
import StockDistribution from './pages/StockDistribution';
import InvoiceManagement from './pages/InvoiceManagement';
import Expenditures from './pages/Expenditures';
import ReportsAnalytics from './pages/ReportsAnalytics';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    setIsAuthenticated(loggedIn);
    
    // Initialize data
    storage.initializeData();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('adminLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminLoggedIn');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <AdminLogin onLogin={handleLogin} />
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/stores" 
            element={
              isAuthenticated ? 
              <StoreManagement onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/stores/:id" 
            element={
              isAuthenticated ? 
              <StoreDetails onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/outlets" 
            element={
              isAuthenticated ? 
              <OutletManagement onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/managers" 
            element={
              isAuthenticated ? 
              <ManagerManagement onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/create-store" 
            element={
              isAuthenticated ? 
              <CreateStore onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/products" 
            element={
              isAuthenticated ? 
              <ProductManagement onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/stock" 
            element={
              isAuthenticated ? 
              <StockDistribution onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/invoices" 
            element={
              isAuthenticated ? 
              <InvoiceManagement onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/invoices/:id" 
            element={
              isAuthenticated ? 
              <InvoiceManagement onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/expenditures" 
            element={
              isAuthenticated ? 
              <Expenditures onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/reports" 
            element={
              isAuthenticated ? 
              <ReportsAnalytics onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;