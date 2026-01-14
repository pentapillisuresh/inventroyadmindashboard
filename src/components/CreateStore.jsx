import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaArrowLeft, FaStore, FaUser, FaMapMarkerAlt, FaCubes, FaExclamationCircle } from 'react-icons/fa';
import { storage } from '../data/storage';

const CreateStore = ({ onLogout }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    capacity: '',
    managerId: '',
    phone: '',
    email: ''
  });
  const [managers, setManagers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalStores: 0,
    activeManagers: 0,
    totalItems: 0
  });

  useEffect(() => {
    // Load managers from localStorage
    const loadedManagers = storage.getManagers();
    setManagers(loadedManagers.filter(manager => manager.status === 'Active'));
    
    // Load statistics
    const stores = storage.getStores();
    const totalItems = stores.reduce((sum, store) => sum + (store.totalItems || 0), 0);
    
    setStats({
      totalStores: stores.length,
      activeManagers: loadedManagers.filter(m => m.status === 'Active').length,
      totalItems: totalItems
    });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Store name must be at least 3 characters';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }
    
    if (!formData.capacity.trim()) {
      newErrors.capacity = 'Capacity is required';
    }
    
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the address
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`;
      
      // Prepare store data
      const storeData = {
        name: formData.name,
        address: fullAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        capacity: formData.capacity,
        managerId: formData.managerId || null,
        phone: formData.phone || '',
        email: formData.email || '',
        createdAt: new Date().toISOString()
      };
      
      // Add store to localStorage
      const newStore = storage.addStore(storeData);
      
      // Add recent activity
      const activities = storage.getRecentActivities();
      activities.unshift({
        id: Date.now(),
        type: 'store_created',
        description: `New store "${formData.name}" created`,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      });
      storage.saveRecentActivities(activities);
      
      // Show success message
      setTimeout(() => {
        alert(`Store "${formData.name}" created successfully!`);
        navigate('/stores');
      }, 500);
      
    } catch (error) {
      console.error('Error creating store:', error);
      alert('An error occurred while creating the store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = value;
    
    if (value.length > 0) {
      formattedValue = '(' + value.substring(0, 3);
      if (value.length > 3) {
        formattedValue += ') ' + value.substring(3, 6);
      }
      if (value.length > 6) {
        formattedValue += '-' + value.substring(6, 10);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      phone: formattedValue
    }));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Store Management" />
        
        <main className="p-6">
          <div className="mb-6">
            <Link
              to="/stores"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to Stores
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Store</h1>
            <p className="text-gray-600">Add a new store to your inventory system</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Store Name */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FaStore className="text-gray-400 mr-2" />
                        <label className="block text-sm font-medium text-gray-700">
                          Store Name *
                        </label>
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter store name (e.g., Downtown Store)"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <FaExclamationCircle className="mr-1" /> {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FaMapMarkerAlt className="text-gray-400 mr-2" />
                        <label className="block text-sm font-medium text-gray-700">
                          Address *
                        </label>
                      </div>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition mb-3 ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Street address"
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                              errors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="City"
                          />
                          {errors.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                              errors.state ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="State"
                          />
                          {errors.state && (
                            <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                              errors.zipCode ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="ZIP Code"
                          />
                          {errors.zipCode && (
                            <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="(123) 456-7890"
                          maxLength="14"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="store@example.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Capacity */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FaCubes className="text-gray-400 mr-2" />
                        <label className="block text-sm font-medium text-gray-700">
                          Capacity *
                        </label>
                      </div>
                      <input
                        type="text"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          errors.capacity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 5000 sq ft or 1000 units"
                      />
                      {errors.capacity && (
                        <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                      )}
                    </div>

                    {/* Assign Manager */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FaUser className="text-gray-400 mr-2" />
                        <label className="block text-sm font-medium text-gray-700">
                          Assign Manager (Optional)
                        </label>
                      </div>
                      <select
                        name="managerId"
                        value={formData.managerId}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="">Select a manager</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} - {manager.storeName || 'Unassigned'}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Only active managers without current store assignment are shown
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                          isSubmitting
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200'
                        } text-white`}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Store...
                          </span>
                        ) : (
                          'Create Store'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Stats Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <FaStore className="mr-2" />
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-lg">
                      <p className="text-sm text-gray-600">Total Stores</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalStores}</p>
                    </div>
                    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-lg">
                      <p className="text-sm text-gray-600">Active Managers</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.activeManagers}</p>
                    </div>
                    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-lg">
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalItems.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Store Examples */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Store Examples</h3>
                  <div className="space-y-4">
                    {storage.getStores().slice(0, 3).map(store => (
                      <div key={store.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <p className="font-medium text-gray-800 mb-1">{store.name}</p>
                        <p className="text-sm text-gray-600 truncate">{store.address}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">Capacity: {store.capacity || 'N/A'}</span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Tips for Creating Stores</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt-1 mr-2"></span>
                      Use a descriptive name that identifies the location
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt-1 mr-2"></span>
                      Include complete address for accurate deliveries
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt=1 mr-2"></span>
                      Assign managers to streamline operations
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mt=1 mr-2"></span>
                      Regular capacity updates help in inventory planning
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateStore;