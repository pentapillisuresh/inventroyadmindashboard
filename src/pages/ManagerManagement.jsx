import React, { useState, useEffect } from 'react';
import {FaPhone,FaEnvelope,FaStore,FaUserTie,FaPlus,FaEdit,FaTrash,FaRedo,FaSearch,FaCheckCircle,FaTimesCircle,FaEye,FaUserCircle,FaBell,FaCog,FaSignOutAlt,FaTachometerAlt,FaShoppingBag,FaBox,FaTruck,FaFileInvoice,FaMoneyBill,FaChartBar, FaLock} from 'react-icons/fa';
import Header from './Header';
import { storage } from '../data/storage';
import Sidebar from './Sidebar';
import ApiService from '../components/ApiService';

// Create Manager Modal
const CreateManagerModal = ({ isOpen, onClose, manager, onSubmit, stores }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    storeId: '',
    password: '',
    permissions: {
      create_store: false,
      create_invoices: false,
      expenditure_management: false,
      create_outlets: false
    },
    expiryDate: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (manager) {
      setFormData({
        name: manager.name || '',
        email: manager.email || '',
        phoneNumber: manager.phoneNumber || '',
        storeId: manager.storeId || '',
        password: '',
        permissions: manager.permissions || {
          create_store: false,
          create_invoices: false,
          expenditure_management: false,
          create_outlets: false
        },
        expiryDate: manager.expiryDate || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        storeId: '',
        password: '',
        permissions: {
          create_store: false,
          create_invoices: false,
          expenditure_management: false,
          create_outlets: false
        },
        expiryDate: ''
      });
    }
  }, [manager, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('permissions.')) {
      const permissionName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionName]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare the data for API
    const submitData = {
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      storeId: parseInt(formData.storeId),
      password: formData.password,
      permissions: formData.permissions,
      expiryDate: formData.expiryDate || null
    };
    
    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                  Manager Name *
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
                  Phone *
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                    required
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

              {!manager && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password"
                      required={!manager}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Permissions Section */}
              <div className="pt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Permissions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(formData.permissions).map(permission => (
                    <div key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`permission-${permission}`}
                        name={`permissions.${permission}`}
                        checked={formData.permissions[permission]}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`permission-${permission}`} className="ml-2 text-sm text-gray-700">
                        {permission.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${
                    loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white py-3 rounded-lg transition font-medium flex items-center justify-center`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    manager ? 'Update Manager' : 'Create Manager'
                  )}
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
  const [stores, setStores] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentManager, setCurrentManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const clientToken = localStorage.getItem('token');
  useEffect(() => {
    loadManagers();
    loadStores();
  }, []);

  const loadStores = async () => {
      // You might need to fetch stores from an API here
      try {      
        const response = await ApiService.get('users/UnassignedStores', {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          }
        });
  
        if (!response) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (response.success) {
          // Transform API data to match UI format
          const transformedStore = response.data.map(store => ({
            id: store.id,
            name: store.name,
            email: store.email,
            phone: store.phoneNumber,
            phoneNumber: store.phoneNumber,
            address: store.address,
            status: store.isActive ? 'Active' : 'Inactive',
            isActive: store.isActive
          }));
          setStores(transformedStore);
        } else {
          console.error('API returned unsuccessful:', result);
          setStores([]);
        }
      } catch (error) {
        console.error('Error loading managers:', error);
        // Fallback to local storage if API fails
      } finally {
        setLoading(false);
      }
    };

  const loadManagers = async () => {
    setLoading(true);
    try {      
      const response = await ApiService.get('users/admin/all/store-managers', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (response.success) {
        // Transform API data to match UI format
        const transformedManagers = response.data.map(manager => ({
          id: manager.id,
          name: manager.name,
          email: manager.email,
          phone: manager.phoneNumber,
          phoneNumber: manager.phoneNumber,
          storeId: manager.storeId || '',
          storeName: manager.storeName || 'No Store Assigned',
          status: manager.isActive ? 'Active' : 'Inactive',
          lastLogin: manager.lastLogin || 'Never',
          invoices: manager.invoiceCount || 0,
          permissions: manager.permissions,
          expiryDate: manager.expiryDate,
          isActive: manager.isActive,
          createdBy: manager.createdBy
        }));
        
        setManagers(transformedManagers);
      } else {
        console.error('API returned unsuccessful:', result);
        setManagers([]);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
      // Fallback to local storage if API fails
      const loadedManagers = storage.getManagers();
      setManagers(loadedManagers);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = () => {
    setCurrentManager(null);
    setShowCreateModal(true);
  };

  const handleEditManager = (manager) => {
    setCurrentManager(manager);
    setShowCreateModal(true);
  };

  const handleDeleteManager = async (manager) => {
    if (window.confirm(`Are you sure you want to delete "${manager.name}"?`)) {
      try {        
        const response = await ApiService.delete(`/users/store-managers/${manager.id}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          }
          });

        if (!response) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (response.success) {
          alert(`Manager "${manager.name}" deleted successfully`);
          loadManagers();
        } else {
          alert(`Failed to delete manager: ${response.message}`);
        }
      } catch (error) {
        console.error('Error deleting manager:', error);
        alert('Error deleting manager. Please try again.');
      }
    }
  };

  const handleResendCredentials = async (manager) => {
    if (window.confirm(`Resend credentials to ${manager.email}?`)) {
      try {        
        const response = await ApiService.post(`/users/resend-credentials/${manager.id}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (response.success) {
          alert(`Credentials resent to ${manager.email}`);
        } else {
          alert(`Failed to resend credentials: ${response.message}`);
        }
      } catch (error) {
        console.error('Error resending credentials:', error);
        alert('Error resending credentials. Please try again.');
      }
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      const url = currentManager
        ? `/users/store-managers/${currentManager.id}`
        : '/users/store-managers';
  
      const method = currentManager ? 'put' : 'post';
  
      const response = await ApiService[method](url, formData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (!response) {
        throw new Error('No response from server');
      }
  
      if (response.success) {
        alert(`Manager ${currentManager ? 'updated' : 'created'} successfully!`);
        loadManagers();
      } else {
        throw new Error(response.message || 'Failed to save manager');
      }
  
    } catch (error) {
      console.error('Error saving manager:', error);
      alert(`Error: ${error.message}`);
      throw error;
    }
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

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            /* Managers Table */
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
                                {manager.phone || manager.phoneNumber}
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
                              manager.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {manager.isActive ? 'Active' : 'Inactive'}
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
          )}
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
        stores={stores}
      />
    </div>
  );
};

export default ManagerManagement;