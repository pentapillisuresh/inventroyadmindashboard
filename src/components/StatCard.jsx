import React from 'react';

const StatCard = ({ title, value, change, icon, color }) => {
  return (
    <div className={`${color} p-6 rounded-xl border border-gray-200`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{change}</p>
        </div>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
};

export default StatCard;