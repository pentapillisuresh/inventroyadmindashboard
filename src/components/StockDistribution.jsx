import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AddDistributionModal from '../pages/AddDistributionModal';
import { FaPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaTruck, FaClock, FaCheckCircle } from 'react-icons/fa';
import { storage } from '../data/storage';

const StockDistribution = ({ onLogout }) => {
  const [distributions, setDistributions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    inTransit: 0,
    completed: 0
  });

  useEffect(() => {
    loadDistributions();
  }, []);

  const loadDistributions = () => {
    const allDistributions = storage.getDistributions();
    setDistributions(allDistributions);
    
    // Calculate statistics
    const all = allDistributions.length;
    const pending = allDistributions.filter(d => d.status === 'Pending').length;
    const inTransit = allDistributions.filter(d => d.status === 'In Transit').length;
    const completed = allDistributions.filter(d => d.status === 'Completed').length;
    
    setStats({ all, pending, inTransit, completed });
  };

  const handleCreateDistribution = () => {
    setShowModal(true);
  };

  const handleSaveDistribution = (distributionData) => {
    storage.addDistribution(distributionData);
    loadDistributions();
    setShowModal(false);
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
    const matchesSearch = distribution.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distribution.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distribution.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || distribution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Stock Distribution" onLogout={onLogout} />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8 max-w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">Distribute inventory to stores and track distribution history</h1>
                <p className="text-gray-600 mt-1">Manage stock distributions across all your stores</p>
              </div>
              <button
                onClick={handleCreateDistribution}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <FaPlus />
                <span>New Distribution</span>
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('All')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">All Distributions</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.all}</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaTruck className="text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
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
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
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
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
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
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search distributions by ID, store, or manager..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Distributions Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">DISTRIBUTION ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">STORE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">MANAGER</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">DATE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">PRODUCTS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">TOTAL VALUE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">PAYMENT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDistributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{distribution.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{distribution.storeName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{distribution.managerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{distribution.date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {distribution.totalItems} items
                            <div className="text-xs text-gray-500">
                              {distribution.products.length} products
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            ${distribution.totalValue.toFixed(2)}
                            {distribution.discount > 0 && (
                              <div className="text-xs text-green-600">
                                {distribution.discount}% discount applied
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getPaymentColor(distribution.paymentType)} whitespace-nowrap`}>
                            {distribution.paymentType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getStatusIcon(distribution.status)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(distribution.status)} whitespace-nowrap`}>
                              {distribution.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => alert(`Viewing details for ${distribution.id}`)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            {distribution.status === 'Pending' && (
                              <button
                                onClick={() => handleStatusUpdate(distribution.id, 'In Transit')}
                                className="text-yellow-600 hover:text-yellow-900 p-1"
                                title="Mark as In Transit"
                              >
                                <FaTruck />
                              </button>
                            )}
                            {distribution.status === 'In Transit' && (
                              <button
                                onClick={() => handleStatusUpdate(distribution.id, 'Completed')}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Mark as Completed"
                              >
                                <FaCheckCircle />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDistribution(distribution.id)}
                              className="text-red-600 hover:text-red-900 p-1"
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
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">No distributions found</div>
                    <div className="text-gray-500 text-sm">
                      {searchTerm || statusFilter !== 'All' 
                        ? 'Try adjusting your search or filters' 
                        : 'Create your first distribution'}
                    </div>
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
    </div>
  );
};

export default StockDistribution;