import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaStore, 
  FaShoppingBag, 
  FaUserTie, 
  FaBox, 
  FaTruck, 
  FaFileInvoice, 
  FaMoneyBill, 
  FaChartBar,
  FaSignOutAlt
} from 'react-icons/fa';

const Sidebar = ({ onLogout }) => {
  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Overview' },
    { path: '/stores', icon: <FaStore />, label: 'Store Management' },
    { path: '/outlets', icon: <FaShoppingBag />, label: 'Outlet Management' },
    { path: '/managers', icon: <FaUserTie />, label: 'Manager Management' },
    { path: '/products', icon: <FaBox />, label: 'Product Management' },
    { path: '/stock', icon: <FaTruck />, label: 'Stock Distribution' },
    { path: '/invoices', icon: <FaFileInvoice />, label: 'Invoice Management' },
    { path: '/expenditures', icon: <FaMoneyBill />, label: 'Expenditures' },
    { path: '/reports', icon: <FaChartBar />, label: 'Reports & Analytics' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FaStore className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">InventoryPro</h2>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4">
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">
            Navigation
          </h3>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 w-full px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FaSignOutAlt />
          <span className="font-medium">Logout</span>
        </button>
        
        <div className="mt-4 px-3 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Online
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>Last login: Today, 17:18</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;