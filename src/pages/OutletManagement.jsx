import React, { useState, useEffect } from 'react';
import { FaPhone, FaShoppingCart, FaCalendarAlt, FaEye, FaEdit, FaTrash, FaPlus, FaDollarSign, FaCheckCircle, FaTimes, FaSearch, FaHistory, FaStore, FaExclamationTriangle, FaUnlock, FaLock, FaSpinner } from 'react-icons/fa';
import Header from './Header';
import { storage } from '../data/storage';
import Sidebar from './Sidebar';
import axios from 'axios';
import ApiService from '../components/ApiService';

const API_BASE_URL = 'http://localhost:5001/api';
const clientToken = localStorage.getItem('token');

// Add Test Order Modal Component (FIXED ALIGNMENT)
const AddTestOrderModal = ({ isOpen, onClose, outlet, onSubmit }) => {
  const [orderData, setOrderData] = useState({
    items: 1,
    amount: 100,
    status: 'Delivered'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: name === 'items' || name === 'amount' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await ApiService.post(`/stores/${outlet.storeId}/invoices`, {
        outletId: outlet.id,
        totalAmount: orderData.amount,
        items: Array(orderData.items).fill().map((_, i) => ({
          productId: i + 1,
          quantity: 1,
          price: orderData.amount / orderData.items
        }))
      },{ 
        headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      }});
      
      onSubmit(response);
      alert(`✅ Test order added successfully!\n\nInvoice: ${response.data.invoice.invoiceNumber}\nAmount: $${orderData.amount}`);
    } catch (error) {
      console.error('Error adding test order:', error);
      alert('❌ Failed to add test order. Please try again.');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Add Test Order - {outlet?.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Number of Items *
                </label>
                <input
                  type="number"
                  name="items"
                  value={orderData.items}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter number of items"
                  required
                  min="1"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Order Amount ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={orderData.amount}
                    onChange={handleChange}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter order amount"
                    required
                    min="0"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Order Status *
                </label>
                <select
                  name="status"
                  value={orderData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                  disabled={loading}
                >
                  <option value="Delivered">Delivered</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Add Test Order'
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

// Create Outlet Modal (FIXED ALIGNMENT)
const CreateOutletModal = ({ isOpen, onClose, outlet, onSubmit }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    storeId: '',
    address: '',
    contactPerson: '',
    phoneNumber: '',
    creditLimit: 0
  });

  const loadStores = async () => {
    try {
      const storeResponse = await ApiService.get(`/stores`,{ 
        headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      }});
      console.log("rrr:",storeResponse.data)
      setStores(storeResponse.data)
    } catch (error) {
      console.error('Error loading stores:', error);
      setStores([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStores();
      
      if (outlet) {
        setFormData({
          name: outlet.name || '',
          storeId: outlet.storeId || '',
          address: outlet.address || '',
          contactPerson: outlet.contactPerson || '',
          phoneNumber: outlet.phoneNumber || '',
          creditLimit: outlet.creditLimit || 0,
          currentCredit: outlet.currentCredit || 0
        });
      } else {
        setFormData({
          name: '',
          storeId: '',
          address: '',
          contactPerson: '',
          phoneNumber: '',
          creditLimit: 300000
        });
      }
    }
  }, [outlet, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'creditLimit' || name === 'storeId' || name === 'currentCredit' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        name: formData.name,
        storeId: parseInt(formData.storeId),
        address: formData.address,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
        creditLimit: parseFloat(formData.creditLimit),
        type: 'custom'
      };
      
      if (outlet) {
        submitData.currentCredit = parseFloat(formData.currentCredit) || 0;
        await onSubmit(submitData);
      } else {
        await onSubmit(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('❌ Failed to save outlet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {outlet ? 'Edit Outlet' : 'Create New Outlet'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Outlet Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter outlet name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Associated Store *
                </label>
                <select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">Select Store</option>
                  {stores?.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                  placeholder="Enter outlet address"
                  required
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Person *
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter contact person name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="+1 (555) 123-4567"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Credit Limit ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="300000"
                    required
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Maximum credit amount allowed for this outlet
                </p>
              </div>

              {outlet && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Current Credit ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="currentCredit"
                      value={formData.currentCredit || 0}
                      onChange={handleChange}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      {outlet ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    outlet ? 'Update Outlet' : 'Create Outlet'
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

// View Details Modal (FIXED ALIGNMENT)
const OutletDetailsModal = ({ isOpen, onClose, outlet, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paid');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && outlet) {
      loadOutletOrders();
    }
  }, [isOpen, outlet]);

  const loadOutletOrders = async () => {
    if (!outlet?.storeId || !outlet?.id) return;
    
    try {
      const response = await ApiService.get(`/stores/${outlet.storeId}/outlets/${outlet.id}/orders`,{ 
        headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      }});
      
      if (response.success) {
        setOrders(response.outletsOrders || []);
        setInvoices(response.outletsInvoice || []);
      }
    } catch (error) {
      console.error('Error loading outlet orders:', error);
      setOrders([]);
      setInvoices([]);
    }
  };

  if (!isOpen || !outlet) return null;

  const calculatePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.round((used / limit) * 100);
  };

  const handleAddOrder = async (orderData) => {
    try {
      await onUpdate();
      loadOutletOrders();
    } catch (error) {
      console.error('Error after adding order:', error);
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return; 
    }

    if (!outlet?.storeId || !outlet?.id) {
      alert('Invalid outlet information');
      return;
    }

    setLoading(true);
    const paymentAmt = parseFloat(paymentAmount);

    try {
      const response = await ApiService.post(`/stores/${outlet.storeId}/invoices/payment/${outlet.id}`,
        {
          paymentMethod: paymentMethod,
          paidAmount: paymentAmt
        },{ 
          headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }}
      );

      if (response.message) {
        alert(`✅ ${response.message}\n\nInvoice: ${response.invoice?.invoiceNumber}\nAmount: $${paymentAmt}`);
        
        const newCredit = Math.max(0, (outlet.currentCredit || 0) - paymentAmt);
        
        const shouldUnblock = outlet.status === 'Blocked' && newCredit < outlet.creditLimit;
        
        if (shouldUnblock) {
          const updateData = {
            name: outlet.name,
            storeId: outlet.storeId,
            address: outlet.address,
            contactPerson: outlet.contactPerson,
            phoneNumber: outlet.phoneNumber,
            creditLimit: outlet.creditLimit,
            currentCredit: newCredit,
            type: 'custom'
          };
          
          try {
            await ApiService.put(`/outlets/${outlet.id}`, updateData,{ 
              headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json',
            }});
          } catch (updateError) {
            console.error('Error updating outlet status:', updateError);
          }
        }
        
        setPaymentAmount('');
        setShowPaymentForm(false);
        await onUpdate();
        loadOutletOrders();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('❌ Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockOutlet = async () => {
    if (window.confirm(`Are you sure you want to block "${outlet.name}"? This will prevent any new credit invoices.`)) {
      setLoading(true);
      try {
        const updateData = {
          name: outlet.name,
          storeId: outlet.storeId,
          address: outlet.address,
          contactPerson: outlet.contactPerson,
          phoneNumber: outlet.phoneNumber,
          creditLimit: outlet.creditLimit,
          currentCredit: outlet.currentCredit,
          type: 'custom',
          isActive: false
        };
        
        await ApiService.put(`/outlets/${outlet.id}`, updateData,{ 
          headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }});
        
        const outlets = storage.getOutlets();
        const updatedOutlets = outlets.map(o => {
          if (o.id === outlet.id) {
            return {
              ...o,
              status: 'Blocked',
              blockedAt: new Date().toISOString(),
              blockedReason: 'Manual block by admin'
            };
          }
          return o;
        });
        storage.saveOutlets(updatedOutlets);
        
        await onUpdate();
      } catch (error) {
        console.error('Error blocking outlet:', error);
        alert('❌ Failed to block outlet. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUnblockOutlet = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: outlet.name,
        storeId: outlet.storeId,
        address: outlet.address,
        contactPerson: outlet.contactPerson,
        phoneNumber: outlet.phoneNumber,
        creditLimit: outlet.creditLimit,
        currentCredit: outlet.currentCredit,
        type: 'custom'
      };
      
      await ApiService.put(`/outlets/${outlet.id}`, updateData,{ 
        headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      }});
      
      const outlets = storage.getOutlets();
      const updatedOutlets = outlets.map(o => {
        if (o.id === outlet.id) {
          return {
            ...o,
            status: 'Active',
          };
        }
        return o;
      });
      storage.saveOutlets(updatedOutlets);
      
      await onUpdate();
    } catch (error) {
      console.error('Error unblocking outlet:', error);
      alert('❌ Failed to unblock outlet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Outlet Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Credit Status Banner */}
          <div className={`mb-6 p-4 rounded-lg border ${
            outlet.status === 'Blocked' 
              ? 'bg-red-50 border-red-200' 
              : calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 0) >= 80
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                {outlet.status === 'Blocked' ? (
                  <FaLock className="text-red-600 text-xl" />
                ) : calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 0) >= 80 ? (
                  <FaExclamationTriangle className="text-yellow-600 text-xl" />
                ) : (
                  <FaCheckCircle className="text-blue-600 text-xl" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {outlet.status === 'Blocked' ? 'BLOCKED' : 
                     calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 0) >= 80 ? 'NEAR LIMIT' : 'ACTIVE'}
                  </h3>
                  <p className="text-sm">
                    Credit: ${(outlet.currentCredit || 0).toLocaleString()} / ${(outlet.creditLimit || 0).toLocaleString()} 
                    ({calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1)}%)
                  </p>
                </div>
              </div>
              {outlet.status === 'Blocked' ? (
                <button
                  onClick={handleUnblockOutlet}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaUnlock />}
                  <span>{loading ? 'Processing...' : 'Unblock Outlet'}</span>
                </button>
              ) : (
                <button
                  onClick={handleBlockOutlet}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaLock />}
                  <span>{loading ? 'Processing...' : 'Block Outlet'}</span>
                </button>
              )}
            </div>
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
                  <span className={`px-2 py-1 rounded text-sm bg-blue-100 text-blue-800`}>
                    {outlet.type || 'custom'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium flex items-center space-x-1">
                    <FaPhone className="text-sm" />
                    <span>{outlet.phoneNumber}</span>
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
                {outlet.Store?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store:</span>
                    <span className="font-medium flex items-center space-x-1">
                      <FaStore className="text-sm" />
                      <span>{outlet.Store.name}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Credit Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <FaDollarSign className="text-sm" />
                    <span>Credit Limit:</span>
                  </span>
                  <span className="font-medium">${(outlet.creditLimit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <FaDollarSign className="text-sm" />
                    <span>Current Credit:</span>
                  </span>
                  <span className="font-medium">${(outlet.currentCredit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <FaDollarSign className="text-sm" />
                    <span>Available Credit:</span>
                  </span>
                  <span className="font-medium">
                    ${((outlet.creditLimit || 0) - (outlet.currentCredit || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact Person:</span>
                  <span className="font-medium">{outlet.contactPerson}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          {outlet.address && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">{outlet.address}</p>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-700 mb-3">Receive Payment</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={loading}
                  >
                    <option value="paid">Cash</option>
                    <option value="credit">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter amount"
                      min="0"
                      max={outlet.currentCredit || 0}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleProcessPayment}
                    disabled={loading || !paymentAmount}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FaDollarSign />
                        <span>Process Payment</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    disabled={loading}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Credit Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Credit Usage</span>
              <span className="text-sm font-medium">
                {calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1)}% used
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1) > 80 
                    ? 'bg-red-600' 
                    : calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1) > 50 
                    ? 'bg-yellow-500' 
                    : 'bg-green-600'
                }`}
                style={{ width: `${calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1)}%` }}
              ></div>
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
                  onClick={() => setActiveTab('invoices')}
                  className={`pb-2 px-1 ${
                    activeTab === 'invoices'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Invoice History
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'orders' ? (
              <div>
                {orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Order ID</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Items</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map((order, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium">{order.id || `ORDER-${index + 1}`}</td>
                            <td className="px-4 py-3">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3">{order.items?.length || 0}</td>
                            <td className="px-4 py-3">${(order.totalAmount || 0).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                (order.status || 'pending') === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : (order.status || 'pending') === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : (order.status || 'pending') === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.status || 'pending'}
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
                {invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Invoice Number</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Payment Method</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {invoices.map((invoice, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                            <td className="px-4 py-3">
                              {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3">{invoice.type}</td>
                            <td className="px-4 py-3">${(invoice.totalAmount || 0).toLocaleString()}</td>
                            <td className="px-4 py-3">{invoice.paymentMethod}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                (invoice.status || 'pending') === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {invoice.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No invoice history available</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6">
            <button
              onClick={() => setShowPaymentForm(true)}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2"
            >
              <FaDollarSign />
              <span>Receive Payment</span>
            </button>
            <button
              onClick={() => setShowAddOrderModal(true)}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2"
            >
              <FaPlus />
              <span>Add Test Order</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Add Test Order Modal */}
      <AddTestOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        outlet={outlet}
        onSubmit={handleAddOrder}
      />
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
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOutlets: 0,
    totalCreditLimit: 0,
    totalCurrentCredit: 0,
    activeOutlets: 0
  });

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get(`/outlets`,{ 
        headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      }});
      
      if (response) {
        const apiOutlets = response.outlets.map(outlet => ({
          ...outlet,
          phone: outlet.phoneNumber,
          storeName: outlet.Store?.name,
          creditUsed: parseFloat(outlet.currentCredit || 0),
          creditLimit: parseFloat(outlet.creditLimit || 0),
          status: outlet.isActive ? 'Active' : 'Blocked',
          type: outlet.type === 'custom' ? 'Official' : outlet.type,
          totalOrders: 0,
          lastOrder: 'No orders yet'
        }));
        
        setOutlets(apiOutlets);
        
        setStats({
          totalOutlets: response.totalOutlets || 0,
          totalCreditLimit: response.totalCreditLimit || 0,
          totalCurrentCredit: response.totalCurrentCredit || 0,
          activeOutlets: apiOutlets.filter(o => o.isActive).length
        });
        
        storage.saveOutlets(apiOutlets);
      }
    } catch (error) {
      console.error('Error loading outlets:', error);
      const localOutlets = storage.getOutlets();
      setOutlets(localOutlets);
      
      const totalCreditLimit = localOutlets.reduce((sum, outlet) => sum + (outlet.creditLimit || 0), 0);
      const totalCreditUsed = localOutlets.reduce((sum, outlet) => sum + (outlet.creditUsed || 0), 0);
      
      setStats({
        totalOutlets: localOutlets.length,
        totalCreditLimit,
        totalCurrentCredit: totalCreditUsed,
        activeOutlets: localOutlets.filter(o => o.status === 'Active').length
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (used, limit) => {
    if (!limit) return 0;
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

  const handleDeleteOutlet = async (outlet) => {
    if (window.confirm(`Are you sure you want to delete "${outlet.name}"?`)) {
      setLoading(true);
      try {
        await ApiService.delete(`/outlets/${outlet.id}`,{ 
          headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        }});
        loadOutlets();
        alert('✅ Outlet deleted successfully');
      } catch (error) {
        console.error('Error deleting outlet:', error);
        alert('❌ Failed to delete outlet. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (outlet) => {
    setCurrentOutlet(outlet);
    setShowDetailsModal(true);
  };

  const handleModalSubmit = async (formData) => {
    setLoading(true);
  
    try {
      if (currentOutlet) {
        await ApiService.put(
          `/outlets/${currentOutlet.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${clientToken}`
            }
          }
        );
  
        alert('✅ Outlet updated successfully');
      } else {
        await ApiService.post(
          '/outlets',
          formData,
          {
            headers: {
              Authorization: `Bearer ${clientToken}`
            }
          }
        );
  
        alert('✅ Outlet created successfully');
      }
  
      await loadOutlets();
      setShowCreateModal(false);
  
    } catch (error) {
      console.error('Error saving outlet:', error);
  
      alert(
        error?.response?.data?.error ||
        '❌ Failed to save outlet. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setCurrentOutlet(null);
    loadOutlets();
  };

  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.phoneNumber?.includes(searchTerm) ||
    outlet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.Store?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Outlet Management" />
        
        <main className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Outlet Management</h1>
                <p className="text-gray-600">Manage outlets, credit limits, and status</p>
              </div>
              <button 
                onClick={handleCreateOutlet}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center space-x-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                <span>{loading ? 'Loading...' : 'Create Outlet'}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaShoppingCart className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Outlets</p>
                  <p className="text-2xl font-bold">{stats.totalOutlets}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Active Outlets</p>
                  <p className="text-2xl font-bold">{stats.activeOutlets}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Credit Limit</p>
                  <p className="text-2xl font-bold">${stats.totalCreditLimit.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-orange-600 text-xl" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Credit Used</p>
                  <p className="text-2xl font-bold">${stats.totalCurrentCredit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Refresh */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search outlets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <button 
              onClick={loadOutlets}
              disabled={loading}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaHistory />}
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* All Outlets Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">All Outlets ({filteredOutlets.length})</h3>
            
            {loading ? (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading outlets...</p>
              </div>
            ) : filteredOutlets.length === 0 ? (
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
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{outlet.name}</h3>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <FaPhone size={12} />
                          <span className="text-sm">{outlet.phoneNumber}</span>
                        </div>
                        {outlet.Store?.name && (
                          <div className="flex items-center space-x-2 text-gray-600 mt-1">
                            <FaStore size={12} />
                            <span className="text-sm">{outlet.Store.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          outlet.type === 'Official' || outlet.type === 'custom'
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {outlet.type === 'custom' ? 'Official' : outlet.type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          outlet.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {outlet.status}
                        </span>
                      </div>
                    </div>

                    {/* Credit Usage */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Credit Usage</span>
                        <span className="font-medium text-sm">
                          ${(outlet.currentCredit || 0).toLocaleString()} / ${(outlet.creditLimit || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1) > 80 
                              ? 'bg-red-600' 
                              : calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1) > 50 
                              ? 'bg-yellow-500' 
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1)}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {calculatePercentage(outlet.currentCredit || 0, outlet.creditLimit || 1)}% used
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-gray-600 mb-1">
                          <span className="text-sm">Contact Person</span>
                        </div>
                        <p className="font-medium text-sm">{outlet.contactPerson}</p>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">
                          <span className="text-sm">Address</span>
                        </div>
                        <p className="font-medium text-sm truncate" title={outlet.address}>
                          {outlet.address?.substring(0, 30)}...
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => handleViewDetails(outlet)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                      >
                        <FaEye size={14} />
                        <span>View Details</span>
                      </button>
                      <button 
                        onClick={() => handleEditOutlet(outlet)}
                        className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2"
                      >
                        <FaEdit size={14} />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteOutlet(outlet)}
                        className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition flex items-center justify-center space-x-2"
                      >
                        <FaTrash size={14} />
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
        onClose={handleModalClose}
        outlet={currentOutlet}
        onSubmit={handleModalSubmit}
      />

      <OutletDetailsModal
        isOpen={showDetailsModal}
        onClose={handleModalClose}
        outlet={currentOutlet}
        onUpdate={loadOutlets}
      />
    </div>
  );
};

export default OutletManagement;