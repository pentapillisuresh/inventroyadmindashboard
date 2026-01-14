import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const StockAlerts = ({ alerts }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Stock Alerts</h2>
      
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle className="text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{alert.name || 'Product Name'}</h3>
                <p className="text-sm text-gray-600">
                  {alert.store} • SKU: {alert.sku || 'SKU-001'}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Stock Level</span>
                    <span className="font-medium">
                      Current: {alert.current || 0} / Min: {alert.min || 100}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, ((alert.current || 0) / (alert.min || 100)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockAlerts;