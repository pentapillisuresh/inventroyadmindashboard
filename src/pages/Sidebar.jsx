import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {FaTachometerAlt,FaStore,FaShoppingBag,FaUserTie,FaBox,FaTruck,FaFileInvoice,FaMoneyBill,FaChartBar,FaSignOutAlt,FaBuilding,FaWarehouse,FaUserCircle} from 'react-icons/fa';

const Sidebar = ({ onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState({});

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          
          // Parse permissions if they exist
          if (parsedUser.permissions) {
            const parsedPermissions = typeof parsedUser.permissions === 'string' 
              ? JSON.parse(parsedUser.permissions) 
              : parsedUser.permissions;
            setPermissions(parsedPermissions);
          }
        }
      } catch (error) {
        console.error('Error loading user data from localStorage:', error);
      }
    };

    loadUserData();
  }, []);

  // Menu items with permission requirements
  const menuItems = [
    { 
      path: '/dashboard', 
      icon: <FaTachometerAlt />, 
      label: 'Overview',
      requiredPermission: null // Always visible
    },
    { 
      path: '/stores', 
      icon: <FaStore />, 
      label: 'Store Management',
      requiredPermission: 'create_store'
    },
    { 
      path: '/managers', 
      icon: <FaUserTie />, 
      label: 'Manager Management',
      requiredPermission: null // Admin only feature
    },
    { 
      path: '/outlets', 
      icon: <FaShoppingBag />, 
      label: 'Outlet Management',
      requiredPermission: 'create_outlets'
    },
    { 
      path: '/products', 
      icon: <FaBox />, 
      label: 'Product Management',
      requiredPermission: null // Essential feature
    },
    { 
      path: '/stock', 
      icon: <FaTruck />, 
      label: 'Stock Distribution',
      requiredPermission: null // Essential feature
    },
    { 
      path: '/invoices', 
      icon: <FaFileInvoice />, 
      label: 'Invoice Management',
      requiredPermission: 'create_invoices'
    },
    { 
      path: '/expenditures', 
      icon: <FaMoneyBill />, 
      label: 'Expenditures',
      requiredPermission: 'expenditure_management'
    },
    { 
      path: '/reports', 
      icon: <FaChartBar />, 
      label: 'Reports & Analytics',
      requiredPermission: null // Visible to all
    },
  ];

  // Check if user has permission to view a menu item
  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true; // No permission required
    if (userData?.role === 'admin') return true; // Super admin has all permissions
    
    // Check specific permission
    return permissions[requiredPermission] === true;
  };

  // Get user role badge color
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'manager':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Check if trial is expired
  const isTrialExpired = () => {
    if (!userData?.expiryDate) return false;
    const expiryDate = new Date(userData.expiryDate);
    const today = new Date();
    return expiryDate < today;
  };

  // Get plan expiry status
  const getPlanStatus = () => {
    if (!userData) return null;
    if (userData.planType === 'Trial') {
      const expired = isTrialExpired();
      return {
        text: expired ? 'Trial Expired' : 'Trial Active',
        className: expired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
      };
    }
    return {
      text: userData.planType || 'Premium',
      className: 'bg-green-100 text-green-800'
    };
  };

  const planStatus = getPlanStatus();

  return (
    <div className="w-64 min-w-[16rem] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      
      {/* ===== Header with User Info ===== */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Business Logo */}
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
            {userData?.BusinessLogo ? (
              <img 
                src={userData.BusinessLogo} 
                alt="Business Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2h1v2h-4v-2h1v-2h-1v-2h4v2h-1zm-8 2v2h1v-2h1v2h1v-2h-1v-2H7v2h1zm6-6v2h-2v-2h2z" clip-rule="evenodd"/></svg></div>';
                }}
              />
            ) : (
              <FaStore className="text-white text-xl" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 truncate">
              {userData?.name || 'InventoryPro'}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {userData?.businessType || 'Admin Panel'}
            </p>
          </div>
        </div>

        {/* User Details Section */}
        {userData && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Role:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userData.role)}`}>
                {userData.role?.charAt(0).toUpperCase() + userData.role?.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Plan:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${planStatus?.className}`}>
                {planStatus?.text}
              </span>
            </div>
            {userData.planType === 'Trial' && userData.expiryDate && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Expires:</span>
                <span className={`text-xs ${isTrialExpired() ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatDate(userData.expiryDate)}
                </span>
              </div>
            )}
            {userData.maxStores && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Max Stores:</span>
                <span className="text-xs font-semibold text-gray-700">{userData.maxStores}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Navigation ===== */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
          Navigation
        </h3>

        <ul className="space-y-1">
          {menuItems.map((item) => {
            // Check if user has permission to see this menu item
            if (!hasPermission(item.requiredPermission)) {
              return null;
            }
            
            return (
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
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
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
            );
          })}
        </ul>

        {/* Additional Info Section */}
        {userData && userData.BusinessImage && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="px-2">
              <p className="text-xs text-gray-500 mb-2">Business Image</p>
              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={userData.BusinessImage} 
                  alt="Business" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              </div>
            </div>
          </div>
        )}
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
        
        {/* Version info */}
        <p className="text-xs text-center text-gray-400 mt-3">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Sidebar;