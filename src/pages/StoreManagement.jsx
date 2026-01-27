import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaEye, FaEdit, FaTrash, FaPlus, FaUser, FaPhone, FaBox, FaChartBar, FaTimes, FaSave } from 'react-icons/fa';
import { storage } from '../data/storage';

const StoreManagement = ({ onLogout }) => {
  const [stores, setStores] = useState([]);
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    managerId: '',
    phone: '',
    stockValue: '',
    status: 'Active'
  });

  useEffect(() => {
    // Load stores and managers from localStorage
    loadData();
  }, []);

  const loadData = () => {
    const loadedStores = storage.getStores();
    const loadedManagers = storage.getManagers();
    
    setStores(loadedStores);
    setManagers(loadedManagers.filter(manager => manager.status === 'Active'));
  };

  const handleDeleteStore = (id) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      const updatedStores = storage.deleteStore(id);
      setStores(updatedStores);
    }
  };

  const handleEditStore = (store) => {
    setEditingStore(store);
    
    // Find the manager for this store
    const storeManager = getStoreManager(store);
    
    setFormData({
      name: store.name || '',
      address: store.address || '',
      capacity: store.capacity || '',
      managerId: storeManager?.id?.toString() || '',
      phone: store.phone || '',
      stockValue: store.totalValue?.replace('$', '')?.replace('K', '000') || store.stockValue || '',
      status: store.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    
    if (!editingStore) return;
    
    // Get selected manager details
    const selectedManager = managers.find(m => m.id === parseInt(formData.managerId));
    
    // Prepare updated data
    const updatedData = {
      name: formData.name,
      address: formData.address,
      capacity: formData.capacity,
      phone: formData.phone,
      status: formData.status,
    };
    
    // Update store in localStorage
    const updatedStore = storage.updateStore(editingStore.id, updatedData);
    
    if (updatedStore) {
      // Update manager's store assignment if manager is selected
      if (selectedManager) {
        storage.updateManager(selectedManager.id, {
          storeId: editingStore.id,
          storeName: formData.name
        });
        
        // If manager was previously assigned to another store, update that store
        managers.forEach(manager => {
          if (manager.id !== selectedManager.id && manager.storeId === editingStore.id) {
            storage.updateManager(manager.id, {
              storeId: null,
              storeName: 'Unassigned'
            });
          }
        });
      } else {
        // If no manager selected, remove any existing assignment
        managers.forEach(manager => {
          if (manager.storeId === editingStore.id) {
            storage.updateManager(manager.id, {
              storeId: null,
              storeName: 'Unassigned'
            });
          }
        });
      }
      
      // Update local state
      const updatedStores = stores.map(store => 
        store.id === editingStore.id ? updatedStore : store
      );
      setStores(updatedStores);
      
      // Reload data to get updated manager assignments
      loadData();
      
      // Close modal
      setShowEditModal(false);
      setEditingStore(null);
      resetFormData();
      
      alert('Store updated successfully!');
    } else {
      alert('Error updating store!');
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
      status: 'Active'
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Fixed: Get store manager by matching storeId
  const getStoreManager = (store) => {
    return managers.find(manager => {
      // Match by storeId OR by store name (for backward compatibility)
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

  const calculateStoreStats = () => {
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

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (getStoreManager(store)?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = calculateStoreStats();

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

          {/* Stores Grid */}
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
                            store.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : store.status === 'Inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {store.status}
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
                          className="p2 hover:bg-blue-50 rounded-lg transition"
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
                          {storeManager ? storeManager.phone : store.phone || 'N/A'}
                        </div>
                        {storeManager && (
                          <p className="text-xs text-gray-500 mt-1">
                            {storeManager.email}
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
                        <p className="text-2xl font-bold text-gray-800">{store.totalProducts || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Stock Value</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {store.totalValue || '$0'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Infrastructure Info */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Rooms</p>
                        <p className="font-medium">{(store.infrastructure?.length || 0)}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Racks</p>
                        <p className="font-medium">{(store.racks?.length || 0)}</p>
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
                      <button 
                        onClick={() => handleEditStore(store)}
                        className="flex-1 text-sm text-gray-600 hover:text-gray-800 py-1 text-center border border-gray-200 rounded hover:bg-gray-50 transition"
                      >
                        Edit Store
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredStores.length === 0 && (
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
          {filteredStores.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredStores.length}</span> of <span className="font-medium">{stores.length}</span> stores
              </p>
            </div>
          )}
        </main>
      </div>

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

                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity *
                    </label>
                    <input
                      type="text"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g., 5000 sq ft"
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
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>

                  {/* Assign Manager */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Manager
                    </label>
                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="">Select a manager</option>
                      {getAvailableManagers().map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} - {manager.email}
                          {manager.storeId === editingStore?.id && ' (Current)'}
                          {!manager.storeId && ' (Available)'}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-sm text-gray-500">
                      {getAvailableManagers().length === 0 && (
                        <p className="text-red-600">No available managers. All managers are assigned to other stores.</p>
                      )}
                      {formData.managerId && (
                        <p className="text-green-600">
                          Selected manager will be assigned to this store.
                          {getAvailableManagers().find(m => m.id === parseInt(formData.managerId))?.storeId && 
                           ' Current assignment will be replaced.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Current Manager Info (if any) */}
                  {editingStore && getStoreManager(editingStore) && !formData.managerId && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Current Manager:</span> {getStoreManager(editingStore)?.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Selecting a new manager will replace the current assignment.
                      </p>
                    </div>
                  )}

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
                      <option value="Maintenance">Under Maintenance</option>
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