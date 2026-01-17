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
  FaSignOutAlt,
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
    <div className="w-64 min-w-[16rem] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      
      {/* ===== Header ===== */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FaStore className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">InventoryPro</h2>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* ===== Navigation ===== */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
          Navigation
        </h3>

        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 h-11 px-3 rounded-md
                   leading-none transition-colors duration-150 relative
                   ${
                     isActive
                       ? 'text-blue-600 bg-blue-50'
                       : 'text-gray-700 hover:bg-gray-100'
                   }`
                }
                end
              >
                {({ isActive }) => (
                  <>
                    {/* Full-height left line for active item */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                    )}
                    
                    {/* Icon */}
                    <span className={`text-base ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>

                    {/* Label */}
                    <span className="text-sm font-normal whitespace-nowrap">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ===== Logout ===== */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                     bg-red-600 hover:bg-red-700 text-white rounded-md
                     transition-colors duration-150 text-sm font-medium"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;