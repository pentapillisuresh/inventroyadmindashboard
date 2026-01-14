import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaFileInvoice } from 'react-icons/fa';
import { storage } from '../data/storage';

const InvoiceManagement = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalValue: 0
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (id) {
      const invoice = storage.getInvoiceById(id);
      setSelectedInvoice(invoice);
    }
  }, [id]);

  const loadInvoices = () => {
    const allInvoices = storage.getInvoices();
    setInvoices(allInvoices);
    
    // Calculate statistics
    const total = allInvoices.length;
    const pending = allInvoices.filter(i => i.status === 'Pending').length;
    const approved = allInvoices.filter(i => i.status === 'Approved').length;
    const rejected = allInvoices.filter(i => i.status === 'Rejected').length;
    const totalValue = allInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    setStats({ total, pending, approved, rejected, totalValue });
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseDetails = () => {
    setSelectedInvoice(null);
    if (id) {
      navigate('/invoices');
    }
  };

  const handleApproveInvoice = (invoiceId) => {
    storage.approveInvoice(invoiceId);
    loadInvoices();
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice(storage.getInvoiceById(invoiceId));
    }
  };

  const handleRejectInvoice = (invoiceId) => {
    storage.rejectInvoice(invoiceId);
    loadInvoices();
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice(storage.getInvoiceById(invoiceId));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col">
        <Header title="Invoice Management" />
        
        <div className="flex-1 p-6">
          {/* Invoice Details Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-lg w-full max-w-4xl my-8">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Invoice Details - {selectedInvoice.id}
                    </h2>
                    <button
                      onClick={handleCloseDetails}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Outlet</label>
                        <p className="text-lg font-semibold text-gray-900">{selectedInvoice.outletName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Manager</label>
                        <p className="text-lg font-semibold text-gray-900">{selectedInvoice.managerName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Store</label>
                        <p className="text-lg font-semibold text-gray-900">{selectedInvoice.storeName}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                        <p className="text-lg font-semibold text-gray-900">{selectedInvoice.date}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Payment Type</label>
                        <span className={`px-3 py-1 text-sm font-medium rounded ${getPaymentColor(selectedInvoice.paymentType)}`}>
                          {selectedInvoice.paymentType}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                          {selectedInvoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.products.map((product, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.productName}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${product.price.toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">${product.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Amount:</td>
                            <td className="px-4 py-3 text-lg font-bold text-gray-900">${selectedInvoice.totalAmount.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    {selectedInvoice.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleRejectInvoice(selectedInvoice.id)}
                          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <FaTimesCircle />
                          <span>Reject Invoice</span>
                        </button>
                        <button
                          onClick={() => handleApproveInvoice(selectedInvoice.id)}
                          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <FaCheckCircle />
                          <span>Approve Invoice</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleCloseDetails}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Manage and track all invoices</h1>
              <p className="text-gray-600 mt-1">Approve, reject, or view invoice details</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('Pending')}>
                <div className="text-sm text-gray-500 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('Approved')}>
                <div className="text-sm text-gray-500 mb-1">Approved</div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('Rejected')}>
                <div className="text-sm text-gray-500 mb-1">Rejected</div>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Value</div>
                <div className="text-2xl font-bold text-gray-800">${stats.totalValue.toFixed(2)}</div>
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
                      placeholder="Search invoices by ID, outlet, or manager..."
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
                    <option value="All">All (5)</option>
                    <option value="Pending">Pending ({stats.pending})</option>
                    <option value="Approved">Approved ({stats.approved})</option>
                    <option value="Rejected">Rejected ({stats.rejected})</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Invoices Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INVOICE ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OUTLET</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MANAGER</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STORE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEMS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYMENT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{invoice.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.outletName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invoice.managerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invoice.storeName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{invoice.date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invoice.totalItems} items</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">${invoice.totalAmount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getPaymentColor(invoice.paymentType)}`}>
                            {invoice.paymentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEye className="inline-block mr-1" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredInvoices.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">No invoices found</div>
                    <div className="text-gray-500 text-sm">
                      {searchTerm || statusFilter !== 'All' 
                        ? 'Try adjusting your search or filters' 
                        : 'No invoices available'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;