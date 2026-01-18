import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AddDistributionModal from '../pages/AddDistributionModal';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaTruck, 
  FaClock, 
  FaCheckCircle,
  FaWarehouse,
  FaBox,
  FaInfoCircle
} from 'react-icons/fa';
import { storage } from '../data/storage';

const StockDistribution = ({ onLogout }) => {
  const [distributions, setDistributions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [storeFilter, setStoreFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
    paid: 0,
    credit: 0,
    totalValue: 0
  });

  useEffect(() => {
    loadDistributions();
    loadStores();
  }, []);

  const loadStores = () => {
    const loadedStores = storage.getStores();
    setStores(loadedStores);
  };

  const loadDistributions = () => {
    const allDistributions = storage.getDistributions();
    setDistributions(allDistributions);
    
    // Calculate statistics
    const all = allDistributions.length;
    const pending = allDistributions.filter(d => d.status === 'Pending').length;
    const inTransit = allDistributions.filter(d => d.status === 'In Transit').length;
    const completed = allDistributions.filter(d => d.status === 'Completed').length;
    const paid = allDistributions.filter(d => d.paymentType === 'Paid').length;
    const credit = allDistributions.filter(d => d.paymentType === 'Credit').length;
    const totalValue = allDistributions.reduce((sum, d) => sum + d.totalValue, 0);
    
    setStats({ all, pending, inTransit, completed, paid, credit, totalValue });
  };

  const handleCreateDistribution = () => {
    setShowModal(true);
  };

  const handleSaveDistribution = (distributionData) => {
    storage.addDistribution(distributionData);
    loadDistributions();
    setShowModal(false);
  };

  const handleViewDetails = (distribution) => {
    setSelectedDistribution(distribution);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = (id, newStatus) => {
    storage.updateDistributionStatus(id, newStatus);
    loadDistributions();
  };

  const handleDeleteDistribution = (id) => {
    if (window.confirm('Are you sure you want to delete this distribution?')) {
      storage.deleteDistribution(id);
      loadDistributions();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (paymentType) => {
    switch (paymentType) {
      case 'Paid': return 'bg-green-50 text-green-700 border border-green-200';
      case 'Credit': return 'bg-blue-50 text-blue-700 border border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <FaCheckCircle className="text-green-500" />;
      case 'In Transit': return <FaTruck className="text-blue-500" />;
      case 'Pending': return <FaClock className="text-yellow-500" />;
      default: return null;
    }
  };

  const filteredDistributions = distributions.filter(distribution => {
    const matchesSearch = 
      distribution.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distribution.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distribution.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distribution.products.some(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'All' || distribution.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || distribution.paymentType === paymentFilter;
    const matchesStore = storeFilter === 'All' || distribution.storeId.toString() === storeFilter;
    
    return matchesSearch && matchesStatus && matchesPayment && matchesStore;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Stock Distribution" />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Stock Distribution</h1>
                <p className="text-gray-600 mt-2">Distribute inventory to stores and track distribution history</p>
              </div>
              <button
                onClick={handleCreateDistribution}
                className="flex items-center justify-center space-x-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full lg:w-auto"
              >
                <FaPlus />
                <span className="font-medium">New Distribution</span>
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
              <div className="col-span-2 lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('All')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">All Distributions</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.all}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Value: ${stats.totalValue.toLocaleString()}</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaTruck className="text-blue-600 text-lg" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('Pending')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FaClock className="text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('In Transit')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">In Transit</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaTruck className="text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('Completed')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FaCheckCircle className="text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setPaymentFilter('Paid')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Paid</div>
                    <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">$</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setPaymentFilter('Credit')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Credit</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.credit}</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">CR</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search distributions by ID, store, manager, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div className="relative">
                    <div className="flex items-center space-x-2">
                      <FaFilter className="text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Payment Filter */}
                  <div className="relative">
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Payments</option>
                      <option value="Paid">Paid</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                  
                  {/* Store Filter */}
                  <div className="relative">
                    <select
                      value={storeFilter}
                      onChange={(e) => setStoreFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Stores</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id.toString()}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Distributions Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DISTRIBUTION ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STORE</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MANAGER</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCTS</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOCATION</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYMENT</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDistributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{distribution.id}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(distribution.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{distribution.storeName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{distribution.managerName || 'Unassigned'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{distribution.date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {distribution.totalItems} items
                            <div className="text-xs text-gray-500">
                              {distribution.products.length} product{distribution.products.length !== 1 ? 's' : ''}
                            </div>
                            <div className="mt-1">
                              {distribution.products.slice(0, 2).map(p => (
                                <div key={p.productId} className="text-xs text-gray-600">
                                  • {p.productName} ({p.quantity})
                                </div>
                              ))}
                              {distribution.products.length > 2 && (
                                <div className="text-xs text-gray-400">
                                  +{distribution.products.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {distribution.products.some(p => p.room) ? (
                              <div className="space-y-1">
                                {distribution.products.slice(0, 2).map(p => (
                                  <div key={p.productId} className="text-xs">
                                    {p.room && (
                                      <div className="flex items-center space-x-1">
                                        <FaWarehouse className="text-gray-400" />
                                        <span>{p.room}</span>
                                        {p.rack && (
                                          <>
                                            <span>/</span>
                                            <span>{p.rack}</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Not specified</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            ${distribution.totalValue.toFixed(2)}
                            {distribution.discount > 0 && (
                              <div className="text-xs text-green-600">
                                {distribution.discount}% discount
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentColor(distribution.paymentType)}`}>
                            {distribution.paymentType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getStatusIcon(distribution.status)}
                            <span className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(distribution.status)}`}>
                              {distribution.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(distribution)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            {distribution.status === 'Pending' && (
                              <button
                                onClick={() => handleStatusUpdate(distribution.id, 'In Transit')}
                                className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded-lg transition"
                                title="Mark as In Transit"
                              >
                                <FaTruck />
                              </button>
                            )}
                            {distribution.status === 'In Transit' && (
                              <button
                                onClick={() => handleStatusUpdate(distribution.id, 'Completed')}
                                className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition"
                                title="Mark as Completed"
                              >
                                <FaCheckCircle />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDistribution(distribution.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredDistributions.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaBox className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {searchTerm || statusFilter !== 'All' || paymentFilter !== 'All' || storeFilter !== 'All' 
                        ? 'No distributions found' 
                        : 'No distributions yet'}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      {searchTerm || statusFilter !== 'All' || paymentFilter !== 'All' || storeFilter !== 'All'
                        ? 'Try adjusting your search or filters' 
                        : 'Create your first distribution to start managing stock transfers'}
                    </p>
                    <button
                      onClick={handleCreateDistribution}
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                      <FaPlus />
                      <span>Create First Distribution</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Distribution Modal */}
      {showModal && (
        <AddDistributionModal
          onSave={handleSaveDistribution}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Distribution Details Modal */}
      {showDetailsModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Distribution Details</h2>
                  <p className="text-gray-600 mt-1">{selectedDistribution.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {/* Distribution Info */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Store</p>
                    <p className="font-medium">{selectedDistribution.storeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Manager</p>
                    <p className="font-medium">{selectedDistribution.managerName || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{selectedDistribution.date}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedDistribution.status)}`}>
                      {selectedDistribution.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Type</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentColor(selectedDistribution.paymentType)}`}>
                      {selectedDistribution.paymentType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-xl font-bold text-gray-900">${selectedDistribution.totalValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Products</h3>
                <div className="space-y-4">
                  {selectedDistribution.products.map((product, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.productName}</h4>
                          <div className="mt-2 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Quantity</p>
                              <p className="font-medium">{product.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Price</p>
                              <p className="font-medium">${product.price.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total</p>
                              <p className="font-medium">${product.total.toFixed(2)}</p>
                            </div>
                          </div>
                          {(product.room || product.rack) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Location</p>
                              <div className="flex items-center space-x-2">
                                {product.room && (
                                  <div className="flex items-center space-x-1 text-sm">
                                    <FaWarehouse className="text-gray-400" />
                                    <span>{product.room}</span>
                                  </div>
                                )}
                                {product.rack && (
                                  <div className="flex items-center space-x-1 text-sm">
                                    <FaBox className="text-gray-400" />
                                    <span>{product.rack}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedDistribution.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedDistribution.notes}</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items</span>
                    <span className="font-medium">{selectedDistribution.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Products</span>
                    <span className="font-medium">{selectedDistribution.products.length}</span>
                  </div>
                  {selectedDistribution.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">{selectedDistribution.discount}%</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-gray-900">${selectedDistribution.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDistribution;