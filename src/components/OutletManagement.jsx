import React, { useState, useEffect } from 'react';
import {
  FaPhone,
  FaShoppingCart,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaDollarSign,
  FaCheckCircle,
  FaTimes,
  FaSearch,
  FaHistory,
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
  FaUserCircle,
  FaBell,
  FaCog
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { storage } from '../data/storage';

// Sidebar Component
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

// Header Component
const Header = ({ title }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-600">{currentDate}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Type here to search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FaBell className="text-gray-600 text-lg" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FaCog className="text-gray-600 text-lg" />
          </button>
          
          <div className="flex items-center space-x-3">
            <FaUserCircle className="text-gray-600 text-2xl" />
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-6">
          <span>ENG</span>
          <span>26°C</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{new Date().toLocaleDateString('en-GB').split('/').join('-')}</span>
        </div>
      </div>
    </header>
  );
};

// Create Outlet Modal
const CreateOutletModal = ({ isOpen, onClose, outlet, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Official',
    phone: '',
    creditLimit: 15000
  });

  useEffect(() => {
    if (outlet) {
      setFormData({
        name: outlet.name || '',
        type: outlet.type || 'Official',
        phone: outlet.phone || '',
        creditLimit: outlet.creditLimit || 15000
      });
    } else {
      setFormData({
        name: '',
        type: 'Official',
        phone: '',
        creditLimit: 15000
      });
    }
  }, [outlet, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'creditLimit' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {outlet ? 'Edit Outlet' : 'Create New Outlet'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlet Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter outlet name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlet Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="Official"
                      checked={formData.type === 'Official'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Official
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="Dummy"
                      checked={formData.type === 'Dummy'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Dummy
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">$</span>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="15000"
                    required
                    min="0"
                    max="1000000"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Maximum credit amount allowed for this outlet
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {outlet ? 'Update Outlet' : 'Create Outlet'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Details Modal
const OutletDetailsModal = ({ isOpen, onClose, outlet, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('orders');

  if (!isOpen || !outlet) return null;

  const calculatePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  const handleAddOrder = () => {
    const orderData = {
      items: Math.floor(Math.random() * 20) + 1,
      amount: Math.floor(Math.random() * 2000) + 500,
      status: Math.random() > 0.3 ? 'Delivered' : 'Pending'
    };
    
    storage.addOutletOrder(outlet.id, orderData);
    onUpdate();
  };

  const handleAddPayment = () => {
    const amount = 1000;
    storage.addPayment(outlet.id, { amount });
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Outlet Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{outlet.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    outlet.type === 'Official' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {outlet.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium flex items-center space-x-1">
                    <FaPhone className="text-sm" />
                    <span>{outlet.phone}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    outlet.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {outlet.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Order Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <FaShoppingCart className="text-sm" />
                    <span>Total Orders:</span>
                  </span>
                  <span className="font-medium">{outlet.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <FaCalendarAlt className="text-sm" />
                    <span>Last Order:</span>
                  </span>
                  <span className="font-medium">{outlet.lastOrder}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Information */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">Credit Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaDollarSign className="text-blue-600" />
                  <span className="text-gray-700">Credit Limit</span>
                </div>
                <p className="text-2xl font-bold">${outlet.creditLimit.toLocaleString()}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaDollarSign className="text-orange-600" />
                  <span className="text-gray-700">Credit Used</span>
                </div>
                <p className="text-2xl font-bold">${outlet.creditUsed.toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaDollarSign className="text-green-600" />
                  <span className="text-gray-700">Available Credit</span>
                </div>
                <p className="text-2xl font-bold">${(outlet.creditLimit - outlet.creditUsed).toLocaleString()}</p>
              </div>
            </div>

            {/* Credit Progress */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Credit Usage</span>
                <span className="text-sm font-medium">
                  {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}% used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 80 
                      ? 'bg-red-600' 
                      : calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 50 
                      ? 'bg-yellow-500' 
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`pb-2 px-1 ${
                    activeTab === 'orders'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Order History
                </button>
                <button
                  onClick={() => setActiveTab('credit')}
                  className={`pb-2 px-1 ${
                    activeTab === 'credit'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Credit History
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'orders' ? (
              <div>
                {outlet.orderHistory && outlet.orderHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Invoice ID</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Items</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {outlet.orderHistory.map((order, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium">{order.invoiceId}</td>
                            <td className="px-4 py-3">{order.date}</td>
                            <td className="px-4 py-3">{order.items}</td>
                            <td className="px-4 py-3">${order.amount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                order.status === 'Delivered' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No order history available</p>
                )}
              </div>
            ) : (
              <div>
                {outlet.creditHistory && outlet.creditHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {outlet.creditHistory.map((credit, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">{credit.date}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                credit.type === 'Payment' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {credit.type}
                              </span>
                            </td>
                            <td className="px-4 py-3">${credit.amount.toLocaleString()}</td>
                            <td className="px-4 py-3">${credit.balance?.toLocaleString() || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No credit history available</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleAddOrder}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2"
            >
              <FaPlus />
              <span>Add Test Order</span>
            </button>
            <button
              onClick={handleAddPayment}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2"
            >
              <FaDollarSign />
              <span>Add Payment</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main OutletManagement Component
const OutletManagement = ({ onLogout }) => {
  const [outlets, setOutlets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentOutlet, setCurrentOutlet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = () => {
    const loadedOutlets = storage.getOutlets();
    setOutlets(loadedOutlets);
  };

  const calculatePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  const handleCreateOutlet = () => {
    setCurrentOutlet(null);
    setShowCreateModal(true);
  };

  const handleEditOutlet = (outlet) => {
    setCurrentOutlet(outlet);
    setShowCreateModal(true);
  };

  const handleDeleteOutlet = (outlet) => {
    if (window.confirm(`Are you sure you want to delete "${outlet.name}"?`)) {
      storage.deleteOutlet(outlet.id);
      loadOutlets();
    }
  };

  const handleViewDetails = (outlet) => {
    setCurrentOutlet(outlet);
    setShowDetailsModal(true);
  };

  const handleModalSubmit = (formData) => {
    if (currentOutlet) {
      // Update existing outlet
      storage.updateOutlet(currentOutlet.id, formData);
    } else {
      // Create new outlet
      storage.addOutlet(formData);
    }
    loadOutlets();
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setCurrentOutlet(null);
    loadOutlets();
  };

  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.phone.includes(searchTerm) ||
    outlet.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Outlet Management" />
        
        <main className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Outlet Management</h1>
                <p className="text-gray-600">Manage outlets, credit limits, and status</p>
              </div>
              <button 
                onClick={handleCreateOutlet}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center space-x-2"
              >
                <FaPlus />
                <span>Create Outlet</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaShoppingCart className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Outlets</p>
                  <p className="text-2xl font-bold">{outlets.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Active Outlets</p>
                  <p className="text-2xl font-bold">{outlets.filter(o => o.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Credit Limit</p>
                  <p className="text-2xl font-bold">${outlets.reduce((sum, outlet) => sum + outlet.creditLimit, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-orange-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Credit Used</p>
                  <p className="text-2xl font-bold">${outlets.reduce((sum, outlet) => sum + outlet.creditUsed, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Refresh */}
          <div className="mb-6 flex items-center justify-between">
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search outlets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button 
              onClick={loadOutlets}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <FaHistory />
              <span>Refresh</span>
            </button>
          </div>

          {/* All Outlets Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">All Outlets</h3>
            
            {filteredOutlets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaShoppingCart className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No outlets found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try a different search term' : 'Create your first outlet to get started'}
                </p>
                {!searchTerm && (
                  <button 
                    onClick={handleCreateOutlet}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center space-x-2 mx-auto"
                  >
                    <FaPlus />
                    <span>Create First Outlet</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredOutlets.map((outlet) => (
                  <div key={outlet.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{outlet.name}</h3>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <FaPhone />
                          <span>{outlet.phone}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        outlet.type === 'Official' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {outlet.type}
                      </span>
                    </div>

                    {/* Credit Usage */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Credit Usage</span>
                        <span className="font-medium">
                          ${outlet.creditUsed?.toLocaleString()} / ${outlet.creditLimit?.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 80 
                              ? 'bg-red-600' 
                              : calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 50 
                              ? 'bg-yellow-500' 
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}% used
                      </div>
                    </div>

                    {/* Order Information */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <FaCalendarAlt />
                          <span className="text-sm">Last Order</span>
                        </div>
                        <p className="font-medium">{outlet.lastOrder}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <FaShoppingCart />
                          <span className="text-sm">Total Orders</span>
                        </div>
                        <p className="font-medium">{outlet.totalOrders}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleViewDetails(outlet)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                      >
                        <FaEye />
                        <span>View Details</span>
                      </button>
                      <button 
                        onClick={() => handleEditOutlet(outlet)}
                        className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2"
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteOutlet(outlet)}
                        className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition flex items-center justify-center space-x-2"
                      >
                        <FaTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateOutletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        outlet={currentOutlet}
        onSubmit={handleModalSubmit}
      />

      <OutletDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        outlet={currentOutlet}
        onUpdate={loadOutlets}
      />
    </div>
  );
};

export default OutletManagement;