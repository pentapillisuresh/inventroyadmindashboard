// StockAlerts.js - Update to handle loading and error states
import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaBox, FaSpinner } from 'react-icons/fa';

const StockAlerts = ({ alerts, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Stock Alerts</h2>
          <Link to="/inventory" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All →
          </Link>
        </div>
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-2xl text-blue-600" />
          <span className="ml-2 text-gray-600">Loading stock alerts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Stock Alerts</h2>
          <Link to="/inventory" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All →
          </Link>
        </div>
        <div className="text-center py-4">
          <FaExclamationTriangle className="text-yellow-500 text-3xl mx-auto mb-2" />
          <p className="text-gray-600">Unable to load stock alerts</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Stock Alerts</h2>
        <Link to="/inventory" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All →
        </Link>
      </div>
      
      <div className="space-y-4">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <FaExclamationTriangle className="text-yellow-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray bold">{alert.storeName}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.status === 'Critical' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">SKU: {alert.sku}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">
                    Stock: <span className="font-semibold">{alert.currentStock}</span> / {alert.reorderLevel}
                  </span>
                  <span className="text-xs text-gray-500">
                    {alert.location}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full ${
                      alert.currentStock <= alert.reorderLevel / 2 
                        ? 'bg-red-500' 
                        : 'bg-yellow-500'
                    }`}
                    style={{ 
                      width: `${Math.min((alert.currentStock / alert.reorderLevel) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <FaBox className="text-gray-400 text-3xl mx-auto mb-2" />
            <p className="text-gray-600">No low stock alerts</p>
            <p className="text-sm text-gray-500 mt-1">All inventory levels are healthy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAlerts;