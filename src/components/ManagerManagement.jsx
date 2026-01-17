import React, { useState, useEffect } from 'react';
import {
  FaPhone,
  FaEnvelope,
  FaStore,
  FaUserTie,
  FaPlus,
  FaEdit,
  FaTrash,
  FaRedo,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaUserCircle,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaTachometerAlt,
  FaShoppingBag,
  FaBox,
  FaTruck,
  FaFileInvoice,
  FaMoneyBill,
  FaChartBar
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { storage } from '../data/storage';
import Sidebar from './Sidebar';



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
          <span>23°C</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>21:32</span>
          <span>14-01-2026</span>
        </div>
      </div>
    </header>
  );
};

// Create Manager Modal
const CreateManagerModal = ({ isOpen, onClose, manager, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeId: '',
    credentialMethod: 'auto-generate',
    deliveryMethod: 'email'
  });

  const stores = storage.getStores();

  useEffect(() => {
    if (manager) {
      setFormData({
        name: manager.name || '',
        email: manager.email || '',
        phone: manager.phone || '',
        storeId: manager.storeId || '',
        credentialMethod: manager.credentialMethod || 'auto-generate',
        deliveryMethod: manager.deliveryMethod || 'email'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        storeId: '',
        credentialMethod: 'auto-generate',
        deliveryMethod: 'email'
      });
    }
  }, [manager, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'radio' ? value : value
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
      <div className="bg-white rounded-xl w-full max-w-sm">
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {manager ? 'Edit Manager' : 'Create Manager'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimesCircle className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter manager name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="manager@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
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
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Store *
                </label>
                <select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential Method *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="credentialMethod"
                      value="auto-generate"
                      checked={formData.credentialMethod === 'auto-generate'}
                      onChange={handleChange}
                      className="mr-2"
                      required
                    />
                    Auto-generate Password
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="credentialMethod"
                      value="invite-link"
                      checked={formData.credentialMethod === 'invite-link'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Send Invite Link
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Method *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="email"
                      checked={formData.deliveryMethod === 'email'}
                      onChange={handleChange}
                      className="mr-2"
                      required
                    />
                    Email
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="sms"
                      checked={formData.deliveryMethod === 'sms'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    SMS
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="whatsapp"
                      checked={formData.deliveryMethod === 'whatsapp'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    WhatsApp
                  </label>
                </div>
              </div>

              {/* What happens next section */}
              {/* <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Manager account will be created</li>
                  <li>• Credentials will be sent via selected method</li>
                </ul>
              </div> */}

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {manager ? 'Update Manager' : 'Create Manager'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main ManagerManagement Component
const ManagerManagement = ({ onLogout }) => {
  const [managers, setManagers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentManager, setCurrentManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = () => {
    const loadedManagers = storage.getManagers();
    setManagers(loadedManagers);
  };

  const handleCreateManager = () => {
    setCurrentManager(null);
    setShowCreateModal(true);
  };

  const handleEditManager = (manager) => {
    setCurrentManager(manager);
    setShowCreateModal(true);
  };

  const handleDeleteManager = (manager) => {
    if (window.confirm(`Are you sure you want to delete "${manager.name}"?`)) {
      storage.deleteManager(manager.id);
      loadManagers();
    }
  };

  const handleResendCredentials = (manager) => {
    if (window.confirm(`Resend credentials to ${manager.name}?`)) {
      storage.resendCredentials(manager.id);
      alert(`Credentials resent to ${manager.name}`);
      loadManagers();
    }
  };

  const handleModalSubmit = (formData) => {
    if (currentManager) {
      storage.updateManager(currentManager.id, formData);
    } else {
      storage.addManager(formData);
    }
    loadManagers();
  };

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1 overflow-x-auto">
        <Header title="Manager Management" />
        
        <main className="p-5">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Manager Management</h1>
                <p className="text-gray-600">Create and manage store managers with credentials</p>
              </div>
              <button 
                onClick={handleCreateManager}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center space-x-2"
              >
                <FaPlus />
                <span>Create Manager</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Type here to search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Managers Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MANAGER
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CONTACT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ASSIGNED STORE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LAST LOGIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      INVOICES
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredManagers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No managers found
                      </td>
                    </tr>
                  ) : (
                    filteredManagers.map((manager) => (
                      <tr key={manager.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <FaUserTie className="text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{manager.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <FaEnvelope className="mr-2 text-gray-400" />
                              {manager.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FaPhone className="mr-2 text-gray-400" />
                              {manager.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FaStore className="mr-2 text-gray-400" />
                            <span className="text-gray-900">{manager.storeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            manager.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {manager.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {manager.lastLogin}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {manager.invoices}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditManager(manager)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center"
                            >
                              <FaEdit className="mr-1" />
                              Edit
                            </button>
                            {manager.status === 'Not Logged In' && (
                              <button
                                onClick={() => handleResendCredentials(manager)}
                                className="text-green-600 hover:text-green-900 text-sm font-medium flex items-center"
                              >
                                <FaRedo className="mr-1" />
                                Resend
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteManager(manager)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center"
                            >
                              <FaTrash className="mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Manager Modal */}
      <CreateManagerModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCurrentManager(null);
        }}
        manager={currentManager}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default ManagerManagement;