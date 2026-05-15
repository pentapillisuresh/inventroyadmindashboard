// App.js

import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./contest/AuthContest";

// import { storage } from './data/storage';

import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import StoreManagement from "./pages/StoreManagement";
import StoreDetails from "./pages/StoreDetails";
import OutletManagement from "./pages/OutletManagement";
import ManagerManagement from "./pages/ManagerManagement";
import CreateStore from "./pages/CreateStore";
import ProductManagement from "./pages/ProductManagement";
import StockDistribution from "./pages/StockDistribution";
import InvoiceManagement from "./pages/InvoiceManagement";
import Expenditures from "./pages/Expenditures";
import ReportsAnalytics from "./pages/ReportsAnalytics";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show loading until auth initializes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-lg font-semibold">Loading...</h2>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// Public Route Component
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

    if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-lg font-semibold">Loading...</h2>
      </div>
    );
  }
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// App Routes
function AppRoutes() {
  const { logout, isAdmin,user, isExpired } = useAuth();
  useEffect(()=>{
    if(user){
      console.log("app:::",user)
    }
    },[user]);

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Stores */}
      <Route
        path="/stores"
        element={
          <ProtectedRoute>
            <StoreManagement onLogout={logout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stores/:id"
        element={
          <ProtectedRoute>
            <StoreDetails onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Outlets */}
      <Route
        path="/outlets"
        element={
          <ProtectedRoute>
            <OutletManagement onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Managers */}
      <Route
        path="/managers"
        element={
          <ProtectedRoute>
            <ManagerManagement onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Create Store */}
      <Route
        path="/create-store"
        element={
          <ProtectedRoute>
            <CreateStore onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Products */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductManagement onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Stock */}
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <StockDistribution onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Invoices */}
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoiceManagement onLogout={logout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute>
            <InvoiceManagement onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Expenditures */}
      <Route
        path="/expenditures"
        element={
          <ProtectedRoute>
            <Expenditures onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsAnalytics onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Unauthorized / Expired Example */}
      {isExpired && (
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center min-h-screen">
              <h1 className="text-red-500 text-2xl font-bold">
                Your subscription has expired.
              </h1>
            </div>
          }
        />
      )}
    </Routes>
  );
}

// Main App
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;