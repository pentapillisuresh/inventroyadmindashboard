import React from 'react';
import { FaCheckCircle, FaTruck, FaUserPlus, FaMoneyBill, FaBan, FaBox } from 'react-icons/fa';

const RecentActivity = ({ activities }) => {
  const dummyActivities = [
    { action: "Invoice INV-2024-001 approved", user: "Admin", time: "5 minutes ago", icon: <FaCheckCircle className="text-green-500" /> },
    { action: "Stock distributed to Downtown Store", user: "Admin", time: "15 minutes ago", icon: <FaTruck className="text-blue-500" /> },
    { action: "New manager created: Emily Brown", user: "Admin", time: "1 hour ago", icon: <FaUserPlus className="text-purple-500" /> },
    { action: "Payment received from Central Plaza", user: "System", time: "2 hours ago", icon: <FaMoneyBill className="text-green-500" /> },
    { action: "Outlet blocked: Westside Outlet", user: "System", time: "3 hours ago", icon: <FaBan className="text-red-500" /> },
    { action: "New product added: Premium Coffee", user: "Admin", time: "4 hours ago", icon: <FaBox className="text-blue-500" /> },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h2>
      
      <div className="space-y-4">
        {dummyActivities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="mt-1">
              {activity.icon}
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">{activity.action}</p>
              <p className="text-sm text-gray-500">
                {activity.user} • {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;