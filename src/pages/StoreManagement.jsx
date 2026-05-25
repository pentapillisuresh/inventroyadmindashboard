// storemanagment

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaEye, FaEdit, FaTrash, FaPlus, FaUser, FaPhone, FaBox, FaChartBar, FaTimes, FaSave, FaUserCheck } from 'react-icons/fa';
import { storage } from '../data/storage';
import ApiService from '../components/ApiService';

const StoreManagement = ({ onLogout }) => {
  const [stores, setStores] = useState([]);
  const [managers, setManagers] = useState([]);
  const [nonAssignedManagers, setNonAssignedManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [assigningStore, setAssigningStore] = useState(null);
  const [selectedManager, setSelectedManager] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalManagers: 0,
    assignedManagers: 0,
    totalItems: 0
  });
  const clientToken = localStorage.getItem('token');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    managerId: '',
    phone: '',
    stockValue: '',
    status: 'Active',
    officeAddress: '',
    FSSAI_No: '',
    GST_No: '',
    CIN_No: ''
  });

  // Get admin ID from localStorage
  const getAdminId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || 1; // Default to 1 if not found
    }
    return 1; // Default admin ID
  };

  useEffect(() => {
    // Load data from APIs
    loadData();
    loadNonAssignedManagers();
  }, []);

  const loadNonAssignedManagers = async () => {
    try {
      const response = await ApiService.get('/users/getNonAssignedManagers', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.success) {
        setNonAssignedManagers(response.data);
      }
    } catch (error) {
      console.error('Error loading non-assigned managers:', error);
      setNonAssignedManagers([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const adminId = getAdminId();
      
      // Load stores from API
      const storesResponse = await ApiService.get('/stores',{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      // Load stats from API
      const statsResponse = await ApiService.get('/users/admin/store/summery',{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (storesResponse.success) {
        // Filter stores for current admin
        const adminStores = storesResponse.data.filter(store => store.adminId === adminId);
        setStores(adminStores);
        
        // Calculate stats
        const activeStores = adminStores.filter(store => store.isActive).length;
        
        // Find stats for current admin
        const adminStats = statsResponse.data?.find(stat => stat.adminId === adminId) || {
          storeCount: 0,
          productItemCount: 0,
          activeManagerCount: 0
        };
        
        // Load managers from localStorage (or update with API if available)
        const loadedManagers = storage.getManagers();
        setManagers(loadedManagers.filter(manager => manager.status === 'Active'));
        
        // Calculate assigned managers
        const assignedManagers = adminStores.filter(store => store.managerId).length;
        
        setStats({
          totalStores: adminStats.storeCount,
          activeStores: activeStores,
          totalManagers: adminStats.activeManagerCount,
          assignedManagers: assignedManagers,
          totalItems: adminStats.productItemCount
        });
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage data
      const loadedStores = storage.getStores();
      const loadedManagers = storage.getManagers();
      setStores(loadedStores);
      setManagers(loadedManagers.filter(manager => manager.status === 'Active'));
      
      // Calculate fallback stats
      const fallbackStats = calculateFallbackStats(loadedStores, loadedManagers);
      setStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  };

  const calculateFallbackStats = (stores, managers) => {
    const totalStores = stores.length;
    const activeStores = stores.filter(store => store.status === 'Active').length;
    const totalManagers = managers.filter(manager => manager.status === 'Active').length;
    const assignedManagers = managers.filter(manager => manager.storeId).length;
    const totalItems = stores.reduce((sum, store) => sum + (store.totalItems || 0), 0);
    
    return {
      totalStores,
      activeStores,
      totalManagers,
      assignedManagers,
      totalItems
    };
  };

  const handleDeleteStore = async (id) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        const response = await ApiService.delete(`/stores/${id}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          }  
        });
        
        if (response) {
          // Update local state
          const updatedStores = stores.filter(store => store.id !== id);
          setStores(updatedStores);
          
          // Update localStorage for backup
          storage.deleteStore(id);
          
          // Reload stats
          await loadData();
          await loadNonAssignedManagers();
          
          alert('Store deleted successfully!');
        } else {
          throw new Error('Failed to delete store');
        }
      } catch (error) {
        console.error('Error deleting store:', error);
        alert('Failed to delete store. Please try again.');
      }
    }
  };

  const handleEditStore = (store) => {
    setEditingStore(store);
    
    // Find the manager for this store from API data
    const storeManager = store.Manager;
    
    setFormData({
      name: store.name || '',
      address: store.address || '',
      capacity: store.creditLimit ? `$${store.creditLimit}` : '',
      managerId: store.managerId || '',
      phone: store.phoneNumber || '',
      stockValue: store.stockValue || '0',
      status: store.isActive ? 'Active' : 'Inactive',
      officeAddress: store.officeAddress || '',
      FSSAI_No: store.FSSAI_No || '',
      GST_No: store.GST_No || '',
      CIN_No: store.CIN_No || ''
    });
    setShowEditModal(true);
  };

  const handleOpenAssignModal = (store) => {
    setAssigningStore(store);
    setSelectedManager('');
    setShowAssignModal(true);
    // Refresh non-assigned managers list when opening modal
    loadNonAssignedManagers();
  };

  const handleCloseAssignModal = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      setShowAssignModal(false);
      setAssigningStore(null);
      setSelectedManager('');
    }
  };

  const handleAssignManager = async () => {
    if (!selectedManager) {
      alert('Please select a manager to assign');
      return;
    }

    const selectedManagerData = nonAssignedManagers.find(m => m.id === parseInt(selectedManager));
    
    if (!selectedManagerData) {
      alert('Selected manager not found');
      return;
    }

    setAssignLoading(true);
    
    try {
      const response = await ApiService.put(
        `/stores/assignedStores/${assigningStore.id}`,
        { managerId: selectedManagerData.id },
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response) {
        alert(`Manager "${selectedManagerData.name}" assigned to "${assigningStore.name}" successfully!`);
        
        // Refresh data
        await loadData();
        await loadNonAssignedManagers();
        
        // Close modal
        setShowAssignModal(false);
        setAssigningStore(null);
        setSelectedManager('');
      } else {
        throw new Error('Failed to assign manager');
      }
    } catch (error) {
      console.error("Assign failed:", error);
      alert(
        error?.response?.data?.message ||
        "Failed to assign manager. Please try again."
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignStore = async (store) => {
    // Check if manager is assigned
    if (!store?.managerId) {
      alert(`No manager was assigned to ${store?.name} store`);
      return;
    }
  
    // Confirmation popup
    const isConfirmed = window.confirm(
      `Are you sure you want to unassign the manager from ${store?.name} store?`
    );
  
    // If cancelled
    if (!isConfirmed) {
      return;
    }
  
    try {
      const response = await ApiService.put(
        `/stores/UnassignedStores/${store.id}`,
        {}, // request body
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response) {
        alert("Manager unassigned successfully");
        
        // Refresh data
        await loadData();
        await loadNonAssignedManagers();
      } else {
        throw new Error('Failed to unassign manager');
      }
    } catch (error) {
      console.error("Unassign failed:", error);
      alert(
        error?.response?.data?.message ||
        "Failed to unassign manager"
      );
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!editingStore) return;
    
    try {
      // Get selected manager from localStorage (or you might want to fetch from API)
      const selectedManager = managers.find(m => m.id === parseInt(formData.managerId));
      
      // Prepare updated data according to API structure
      const updatedData = {
        name: formData.name,
        address: formData.address,
        phoneNumber: formData.phone,
        email: editingStore.email || '',
        creditLimit: parseFloat(formData.capacity.replace(/[^0-9.-]+/g, '')) || editingStore.creditLimit,
        isActive: formData.status === 'Active',
        managerId: formData.managerId || null,
        officeAddress: formData.officeAddress,
        FSSAI_No: formData.FSSAI_No,
        GST_No: formData.GST_No,
        CIN_No: formData.CIN_No
      };
      
      // Call API to update store
      const response = await ApiService.put(`/stores/${editingStore.id}`,updatedData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response) {
        
        // Update local state
        const updatedStores = stores.map(store => 
          store.id === editingStore.id ? response : store
        );
        setStores(updatedStores);
        
        // Update localStorage for backup
        const localStorageStore = {
          id: response.id,
          name: response.name,
          address: response.address,
          capacity: response.creditLimit,
          phone: response.phoneNumber,
          email: response.email,
          status: response.isActive ? 'Active' : 'Inactive',
          totalProducts: response.totalProductQuantity || 0,
          totalValue: `$${response.stockValue || 0}`,
          totalItems: parseInt(response.totalProductQuantity) || 0,
          creditLimit: response.creditLimit,
          currentCredit: response.currentCredit,
          officeAddress: response.officeAddress,
          FSSAI_No: response.FSSAI_No,
          GST_No: response.GST_No,
          CIN_No: response.CIN_No
        };
        storage.updateStore(response.id, localStorageStore);
        
        // Update manager assignment in localStorage
        if (selectedManager) {
          storage.updateManager(selectedManager.id, {
            storeId: editingStore.id,
            storeName: formData.name
          });
        }
        
        // Reload data to get updated stats
        await loadData();
        await loadNonAssignedManagers();
        
        // Close modal
        setShowEditModal(false);
        setEditingStore(null);
        resetFormData();
        
        alert('Store updated successfully!');
      } else {
        throw new Error('Failed to update store');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Error updating store! Please try again.');
    }
  };

  const handleCancelEdit = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      setShowEditModal(false);
      setEditingStore(null);
      resetFormData();
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      address: '',
      capacity: '',
      managerId: '',
      phone: '',
      stockValue: '',
      status: 'Active',
      officeAddress: '',
      FSSAI_No: '',
      GST_No: '',
      CIN_No: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Get store manager from API data or localStorage
  const getStoreManager = (store) => {
    // First try to get from API data
    if (store.Manager) {
      return store.Manager;
    }
    
    // Fallback to localStorage
    return managers.find(manager => {
      return manager.storeId === store.id || manager.storeName === store.name;
    });
  };

  const getAvailableManagers = () => {
    return managers.filter(manager => {
      // Manager is available if:
      // 1. Not assigned to any store (storeId is null/undefined), OR
      // 2. Currently assigned to the store being edited
      const isAssignedToOtherStore = manager.storeId && manager.storeId !== editingStore?.id;
      return !isAssignedToOtherStore;
    });
  };

  const filteredStores = stores.filter(store =>
    store?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (getStoreManager(store)?.name?.toLowerCase().includes(searchTerm?.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Store Management" showSearch={false} />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Store Management</h1>
            <p className="text-gray-600">Manage your stores, infrastructure, and inventory distribution</p>
          </div>

          {/* Search and Create Button */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stores..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            
            <Link
              to="/create-store"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 whitespace-nowrap"
            >
              <FaPlus />
              <span className="font-medium">Create Store</span>
            </Link>
          </div>

          {/* Overview Stats */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Stores</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalStores}</p>
                </div>
                <FaBox className="text-blue-600 text-2xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Managers</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalManagers}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.assignedManagers} assigned, {stats.totalManagers - stats.assignedManagers} available
                  </p>
                </div>
                <FaUser className="text-green-600 text-2xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalItems.toLocaleString()}</p>
                </div>
                <FaChartBar className="text-purple-600 text-2xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Stores</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.activeStores}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalStores - stats.activeStores} inactive
                  </p>
                </div>
                <FaBox className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading stores...</p>
            </div>
          )}

          {/* Stores Grid */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStores.map((store) => {
                const storeManager = getStoreManager(store);
                
                return (
                  <div key={store.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Store Header */}
                    <div className="p-6 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{store.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">{store.address}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              store.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {store.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {storeManager && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Managed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-2">
                          <Link
                            to={`/stores/${store.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="View Details"
                          >
                            <FaEye className="text-gray-600" />
                          </Link>
                          <button
                            onClick={() => handleEditStore(store)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FaEdit className="text-blue-600" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Manager Info */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {storeManager ? storeManager.name : 'Manager Not Assigned'}
                          </p>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaPhone className="mr-2 text-xs" />
                            {store.phoneNumber || 'N/A'}
                          </div>
                          {store.email && (
                            <p className="text-xs text-gray-500 mt-1">
                              {store.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Store Stats */}
                    <div className="border-t border-gray-200 p-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Products</p>
                          <p className="text-2xl font-bold text-gray-800">{store.totalProductQuantity || 0}</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Stock Value</p>
                          <p className="text-2xl font-bold text-gray-800">
                            ${store.stockValue || '0'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Infrastructure Info */}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Rooms</p>
                          <p className="font-medium">{store.roomCount || 0}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Racks</p>
                          <p className="font-medium">{store.rackCount || 0}</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <Link
                          to={`/stores/${store.id}`}
                          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-center font-medium flex items-center justify-center space-x-2"
                        >
                          <FaEye />
                          <span>View Details</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition text-center font-medium flex items-center justify-center space-x-2"
                        >
                          <FaTrash />
                          <span>Delete Store</span>
                        </button>
                      </div>
                      
                      {/* Additional Actions */}
                      <div className="mt-4 flex space-x-2">
                        <Link
                          to={`/stores/${store.id}`}
                          className="flex-1 text-sm text-blue-600 hover:text-blue-800 py-1 text-center border border-blue-200 rounded hover:bg-blue-50 transition"
                        >
                          View Reports
                        </Link>
                        {Boolean(store.managerId) ? (
                          <button 
                            onClick={() => handleUnassignStore(store)}
                            className="flex-1 text-sm text-gray-600 hover:text-gray-800 py-1 text-center border border-gray-200 rounded hover:bg-gray-50 transition"
                          >
                            Unassign
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenAssignModal(store)}
                            className="flex-1 text-sm text-green-600 hover:text-green-800 py-1 text-center border border-green-200 rounded hover:bg-green-50 transition"
                          >
                            <FaUserCheck className="inline mr-1" />
                            Assign
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredStores.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaPlus className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                {searchTerm ? 'No stores found' : 'No stores yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search terms or create a new store.'
                  : 'Create your first store to start managing inventory and infrastructure.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Clear Search
                  </button>
                )}
                <Link
                  to="/create-store"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create First Store
                </Link>
              </div>
            </div>
          )}

          {/* Total Stores Count */}
          {!loading && filteredStores.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredStores.length}</span> of <span className="font-medium">{stores.length}</span> stores
              </p>
            </div>
          )}
        </main> 
      </div>

      {/* Assign Manager Modal */}
      {showAssignModal && assigningStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Assign Manager</h2>
                <p className="text-gray-600 mt-1">
                  Assign a manager to <strong>{assigningStore.name}</strong>
                </p>
              </div>
              <button
                onClick={handleCloseAssignModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Manager *
                  </label>
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  >
                    <option value="">Select a manager</option>
                    {nonAssignedManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} - {manager.email} ({manager.phoneNumber})
                      </option>
                    ))}
                  </select>
                  {nonAssignedManagers.length === 0 && (
                    <p className="mt-2 text-sm text-yellow-600">
                      No unassigned managers available. All managers are already assigned to stores.
                    </p>
                  )}
                </div>

                {/* Store Info Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Store Information:</p>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {assigningStore.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Address:</strong> {assigningStore.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Phone:</strong> {assigningStore.phoneNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 flex space-x-3">
              <button
                type="button"
                onClick={handleCloseAssignModal}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition font-medium flex items-center justify-center space-x-2"
                disabled={assignLoading}
              >
                <FaTimes />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleAssignManager}
                disabled={assignLoading || !selectedManager || nonAssignedManagers.length === 0}
                className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition ${
                  assignLoading || !selectedManager || nonAssignedManagers.length === 0
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {assignLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <FaUserCheck />
                    <span>Assign Manager</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Edit Store</h2>
                <p className="text-gray-600 mt-1">Update store information</p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={handleSaveEdit}>
                <div className="space-y-6">
                  {/* Store Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter store name"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter full address"
                      rows="3"
                      required
                    />
                  </div>

                  {/* Office Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Address
                    </label>
                    <textarea
                      name="officeAddress"
                      value={formData.officeAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter office address"
                      rows="2"
                    />
                  </div>

                  {/* FSSAI Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      FSSAI Number
                    </label>
                    <input
                      type="text"
                      name="FSSAI_No"
                      value={formData.FSSAI_No}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter FSSAI number"
                    />
                  </div>

                  {/* GST Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="GST_No"
                      value={formData.GST_No}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter GST number"
                    />
                  </div>

                  {/* CIN Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CIN Number
                    </label>
                    <input
                      type="text"
                      name="CIN_No"
                      value={formData.CIN_No}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter CIN number"
                    />
                  </div>

                  {/* Capacity (Credit Limit) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Limit *
                    </label>
                    <input
                      type="text"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g., $50000"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g., 91105423536"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <FaTimes />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <FaSave />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagement;