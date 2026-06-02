import React, { useState, useEffect } from 'react';
import {FaPhone,FaEnvelope,FaStore,FaUserTie,FaPlus,FaEdit,FaTrash,FaRedo,FaSearch,FaCheckCircle,FaTimesCircle,FaEye,FaUserCircle,FaBell,FaCog,FaSignOutAlt,FaTachometerAlt,FaShoppingBag,FaBox,FaTruck,FaFileInvoice,FaMoneyBill,FaChartBar, FaLock, FaBuilding, FaIdCard, FaCalendarAlt, FaUserClock} from 'react-icons/fa';
import Header from './Header';
import { storage } from '../data/storage';
import Sidebar from './Sidebar';
import ApiService from '../components/ApiService';

// View Manager Details Modal
const ViewManagerModal = ({ isOpen, onClose, manager }) => {
  if (!isOpen || !manager) return null;

  const getStatusColor = (status) => {
    return status === 'Active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getPermissionLabel = (permission) => {
    return permission.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Parse permissions if it's a string
  const permissions = typeof manager.permissions === 'string' 
    ? JSON.parse(manager.permissions) 
    : manager.permissions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <FaUserTie className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Manager Details</h2>
              <p className="text-sm text-gray-500">Complete information about the manager</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimesCircle className="text-2xl" />
          </button>
        </div>

        <div className="p-6">
          {/* Basic Information Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 flex items-center">
              <FaUserCircle className="mr-2 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Full Name</label>
                <p className="text-gray-900 font-medium mt-1">{manager.name || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Status</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(manager.status)}`}>
                    {manager.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Email Address</label>
                <div className="flex items-center mt-1">
                  <FaEnvelope className="text-gray-400 mr-2 text-sm" />
                  <p className="text-gray-900">{manager.email || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Phone Number</label>
                <div className="flex items-center mt-1">
                  <FaPhone className="text-gray-400 mr-2 text-sm" />
                  <p className="text-gray-900">{manager.phone || manager.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Last Login</label>
                <div className="flex items-center mt-1">
                  <FaUserClock className="text-gray-400 mr-2 text-sm" />
                  <p className="text-gray-900">{manager.lastLogin || 'Never'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Total Invoices</label>
                <p className="text-gray-900 mt-1 font-semibold">{manager.invoices || 0}</p>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 flex items-center">
              <FaStore className="mr-2 text-blue-600" />
              Store Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Assigned Store</label>
                <div className="flex items-center mt-1">
                  <FaStore className="text-gray-400 mr-2 text-sm" />
                  <p className="text-gray-900 font-medium">{manager.storeName || 'No Store Assigned'}</p>
                </div>
              </div>
              {manager.storeId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase block">Store ID</label>
                  <p className="text-gray-900 mt-1">{manager.storeId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 flex items-center">
              <FaLock className="mr-2 text-blue-600" />
              Permissions & Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions && Object.keys(permissions).map(permission => (
                <div key={permission} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  {permissions[permission] ? (
                    <FaCheckCircle className="text-green-500 mr-3 text-lg" />
                  ) : (
                    <FaTimesCircle className="text-gray-400 mr-3 text-lg" />
                  )}
                  <span className={`text-sm ${permissions[permission] ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {getPermissionLabel(permission)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Business Registration Details - Show even if null, but indicate no data */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 flex items-center">
              <FaBuilding className="mr-2 text-blue-600" />
              Business Registration Details
            </h3>
            {(manager.officeAddress || manager.FSSAI_No || manager.GST_No || manager.CIN_No) ? (
              <div className="grid grid-cols-1 gap-4">
                {manager.officeAddress && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 uppercase block">Office Address</label>
                    <p className="text-gray-900 mt-1">{manager.officeAddress}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {manager.FSSAI_No && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase block">FSSAI Number</label>
                      <div className="flex items-center mt-1">
                        <FaIdCard className="text-gray-400 mr-2 text-sm" />
                        <p className="text-gray-900 font-mono text-sm">{manager.FSSAI_No}</p>
                      </div>
                    </div>
                  )}
                  {manager.GST_No && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase block">GST Number</label>
                      <div className="flex items-center mt-1">
                        <FaIdCard className="text-gray-400 mr-2 text-sm" />
                        <p className="text-gray-900 font-mono text-sm">{manager.GST_No}</p>
                      </div>
                    </div>
                  )}
                  {manager.CIN_No && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase block">CIN Number</label>
                      <div className="flex items-center mt-1">
                        <FaIdCard className="text-gray-400 mr-2 text-sm" />
                        <p className="text-gray-900 font-mono text-sm">{manager.CIN_No}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                <p>No business registration details available</p>
                <p className="text-sm mt-1">Office address, FSSAI, GST, and CIN numbers are not provided</p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-600" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manager.expiryDate && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase block">Account Expiry Date</label>
                  <p className="text-gray-900 mt-1">{new Date(manager.expiryDate).toLocaleDateString()}</p>
                </div>
              )}
              {manager.createdBy && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase block">Created By</label>
                  <p className="text-gray-900 mt-1">{manager.createdBy}</p>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase block">Manager ID</label>
                <p className="text-gray-900 mt-1 font-mono text-sm">{manager.id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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
    expiryDate: '',
    officeAddress: '',
    FSSAI_No: '',
    GST_No: '',
    CIN_No: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (manager) {
      // Parse permissions if it's a string
      let parsedPermissions = manager.permissions;
      if (typeof manager.permissions === 'string') {
        try {
          parsedPermissions = JSON.parse(manager.permissions);
        } catch (e) {
          parsedPermissions = {
            create_store: false,
            create_invoices: false,
            expenditure_management: false,
            create_outlets: false
          };
        }
      }
      
      setFormData({
        name: manager.name || '',
        email: manager.email || '',
        phoneNumber: manager.phoneNumber || '',
        storeId: manager.storeId || '', // Important: Keep the store ID for editing
        password: '', // Don't populate password for security
        permissions: parsedPermissions,
        expiryDate: manager.expiryDate || '',
        officeAddress: manager.officeAddress || '',
        FSSAI_No: manager.FSSAI_No || '',
        GST_No: manager.GST_No || '',
        CIN_No: manager.CIN_No || ''
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
        expiryDate: '',
        officeAddress: '',
        FSSAI_No: '',
        GST_No: '',
        CIN_No: ''
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
      permissions: formData.permissions,
      expiryDate: formData.expiryDate || null,
      officeAddress: formData.officeAddress || null,
      FSSAI_No: formData.FSSAI_No || null,
      GST_No: formData.GST_No || null,
      CIN_No: formData.CIN_No || null
    };
    
    // Only include password if it's provided (for create it's required, for edit it's optional)
    if (formData.password) {
      submitData.password = formData.password;
    }
    
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
              
              {/* Store Assignment - Always show for both create and edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Store {!manager && '*'}
                </label>
                <select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!manager}
                >
                  <option value="">{manager ? 'Select new store (optional)' : 'Select a store'}</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {manager && formData.storeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current store: {stores.find(s => s.id === parseInt(formData.storeId))?.name || formData.storeId}
                  </p>
                )}
              </div>
              
              {/* Password - Show for create, optional for edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {manager ? 'New Password (optional)' : 'Password *'}
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={manager ? "Leave blank to keep current password" : "Enter password"}
                    required={!manager}
                  />
                </div>
                {manager && (
                  <p className="text-xs text-gray-500 mt-1">
                    Only enter if you want to change the password
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Business Registration Fields */}
              <div className="pt-2">
                <h3 className="text-md font-medium text-gray-700 mb-2">Business Registration Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Office Address
                    </label>
                    <input
                      type="text"
                      name="officeAddress"
                      value={formData.officeAddress || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Full office address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      FSSAI Number
                    </label>
                    <input
                      type="text"
                      name="FSSAI_No"
                      value={formData.FSSAI_No || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="FSSAI registration number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="GST_No"
                      value={formData.GST_No || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="GST identification number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CIN Number
                    </label>
                    <input
                      type="text"
                      name="CIN_No"
                      value={formData.CIN_No || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Company Identification Number"
                    />
                  </div>
                </div>
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentManager, setCurrentManager] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const clientToken = localStorage.getItem('token');
  
  useEffect(() => {
    loadManagers();
    loadStores();
  }, []);

  const loadStores = async () => {
    try {      
      const response = await ApiService.get('users/UnassignedStores', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (response && response.success) {
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
        console.error('API returned unsuccessful:', response);
        setStores([]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]);
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

      if (response && response.success) {
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
          createdBy: manager.createdBy,
          officeAddress: manager.officeAddress || '',
          FSSAI_No: manager.FSSAI_No || '',
          GST_No: manager.GST_No || '',
          CIN_No: manager.CIN_No || ''
        }));
        setManagers(transformedManagers);
      } else {
        console.error('API returned unsuccessful:', response);
        setManagers([]);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
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

  const handleViewManager = (manager) => {
    setSelectedManager(manager);
    setShowViewModal(true);
  };

  const handleDeleteManager = async (manager) => {
    if (window.confirm(`Are you sure you want to delete "${manager.name}"?`)) {
      try {        
        const response = await ApiService.delete(`users/store-managers/${manager.id}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (response && response.success) {
          alert(`Manager "${manager.name}" deleted successfully`);
          loadManagers();
        } else {
          alert(`Failed to delete manager: ${response?.message || 'Unknown error'}`);
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
        const response = await ApiService.post(`users/resend-credentials/${manager.id}`, {}, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (response && response.success) {
          alert(`Credentials resent to ${manager.email}`);
        } else {
          alert(`Failed to resend credentials: ${response?.message || 'Unknown error'}`);
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
        ? `users/store-managers/${currentManager.id}`
        : 'users/store-managers';
  
      const method = currentManager ? 'put' : 'post';
  
      const response = await ApiService[method](url, formData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (response && response.success) {
        alert(`Manager ${currentManager ? 'updated' : 'created'} successfully!`);
        loadManagers();
      } else {
        throw new Error(response?.message || 'Failed to save manager');
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
                placeholder="Search by name, email or store..."
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
                                onClick={() => handleViewManager(manager)}
                                className="text-green-600 hover:text-green-900 text-sm font-medium flex items-center"
                                title="View Details"
                              >
                                <FaEye className="mr-1" />
                                View
                              </button>
                              <button
                                onClick={() => handleEditManager(manager)}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center"
                                title="Edit Manager"
                              >
                                <FaEdit className="mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleResendCredentials(manager)}
                                className="text-purple-600 hover:text-purple-900 text-sm font-medium flex items-center"
                                title="Resend Credentials"
                              >
                                <FaRedo className="mr-1" />
                                Resend
                              </button>
                              <button
                                onClick={() => handleDeleteManager(manager)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center"
                                title="Delete Manager"
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

      {/* View Manager Modal */}
      <ViewManagerModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedManager(null);
        }}
        manager={selectedManager}
      />
    </div>
  );
};

export default ManagerManagement;