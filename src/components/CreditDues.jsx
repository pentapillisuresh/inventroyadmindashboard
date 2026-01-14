 import React from 'react';

const CreditDues = ({ dues }) => {
  const calculatePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Credit Dues</h2>
      
      <div className="space-y-4">
        {dues.map((outlet) => (
          <div key={outlet.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{outlet.name}</h3>
              <span className="text-sm text-gray-500">Due: {outlet.dueDate || 'N/A'}</span>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Credit Used</span>
                <span className="font-medium">
                  ${outlet.creditUsed?.toLocaleString()} / ${outlet.creditLimit?.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">
                {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}% used
              </div>
            </div>
            
            {calculatePercentage(outlet.creditUsed, outlet.creditLimit) >= 100 && (
              <button className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition font-medium">
                Unblock Outlet
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditDues;