import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaFileInvoice, FaExclamationTriangle } from 'react-icons/fa';
import ApiService from '../components/ApiService';

const InvoiceManagement = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [storeCreditStatus, setStoreCreditStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    outlet_sale: 0,
    credit: 0,
    paid: 0,
    totalValue: 0
  });

  const clientToken = localStorage.getItem('token');

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (id) {
      const invoice = invoices.find(inv => inv.id.toString() === id);
      setSelectedInvoice(invoice);
      if (invoice && invoice.type === 'credit' && invoice.Store) {
        checkStoreCredit(invoice.Store, invoice.totalAmount);
      }
    }
  }, [id, invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/invoice/allNonDistributed/Invoices/admin', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.invoices) {
        const transformedInvoices = response.invoices.map(invoice => {
          // Calculate total items from invoice items
          const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
          
          // Map status
          const mapStatus = (status) => {
            switch (status) {
              case 'pending': return 'pending';
              case 'completed': return 'completed';
              case 'cancelled': return 'cancelled';
              default: return status;
            }
          };

          // Map payment method to display text
          const mapPaymentMethod = (method) => {
            switch (method) {
              case 'paid': return 'Paid';
              case 'credit': return 'Credit';
              case 'mixed': return 'Mixed';
              default: return method.charAt(0).toUpperCase() + method.slice(1);
            }
          };

          return {
            id: invoice.invoiceNumber,
            invoiceId: invoice.id,
            outletName: invoice.Outlet?.name || 'N/A',
            storeName: invoice.Store?.name || 'N/A',
            storeId: invoice.storeId,
            managerName: invoice.StoreManager?.name || invoice.Admin?.name || 'Unassigned',
            date: new Date(invoice.invoiceDate).toLocaleDateString(),
            totalAmount: parseFloat(invoice.totalAmount),
            creditAmount: parseFloat(invoice.creditAmount),
            paidAmount: parseFloat(invoice.paidAmount),
            paymentMethod: invoice.paymentMethod,
            paymentType: mapPaymentMethod(invoice.paymentMethod),
            type: invoice.type,
            status: mapStatus(invoice.status),
            createdAt: invoice.createdAt,
            totalItems: totalItems,
            products: invoice.items.map(item => ({
              productId: item.productId,
              productName: item.Product?.name || 'Unknown Product',
              sku: item.Product?.sku || 'N/A',
              quantity: item.quantity,
              price: parseFloat(item.price),
              total: parseFloat(item.totalPrice)
            })),
            // Store details for credit checking
            Store: invoice.Store,
            Admin: invoice.Admin,
            items: invoice.items
          };
        });

        setInvoices(transformedInvoices);
        
        // Calculate statistics
        const total = transformedInvoices.length;
        const outlet_sale = transformedInvoices.filter(i => i.type === 'outlet_sale').length;
        const credit = transformedInvoices.filter(i => i.type === 'credit').length;
        const paid = transformedInvoices.filter(i => i.type === 'paid' || i.type === 'distribution').length;
        const totalValue = transformedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
        
        setStats({ total, outlet_sale, credit, paid, totalValue });
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      alert('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkStoreCredit = (store, invoiceAmount) => {
    if (!store) {
      setStoreCreditStatus(null);
      return;
    }

    const currentCredit = parseFloat(store.currentCredit) || 0;
    const creditLimit = parseFloat(store.creditLimit) || 0;
    
    // For credit invoices, check if store has enough credit
    const newCreditUsed = currentCredit + invoiceAmount;
    const percentage = Math.round((newCreditUsed / creditLimit) * 100);
    const isBlocked = newCreditUsed >= creditLimit;
    const isNearLimit = percentage >= 80 && percentage < 100;
    
    setStoreCreditStatus({
      store,
      currentCredit,
      newCreditUsed,
      percentage,
      isBlocked,
      isNearLimit,
      availableCredit: creditLimit - currentCredit
    });
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    if (invoice.type === 'credit' && invoice.Store) {
      checkStoreCredit(invoice.Store, invoice.totalAmount);
    }
  };

  const handleCloseDetails = () => {
    setSelectedInvoice(null);
    setStoreCreditStatus(null);
    if (id) {
      navigate('/invoices');
    }
  };

  const handleApproveInvoice = async (invoiceId) => {
    try {
      // Find the original invoice to get the database ID
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      // Check if this is a credit invoice
      if (invoice.type === 'credit' || invoice.paymentMethod === 'credit') {
        if (invoice.Store) {
          // Calculate new credit used
          const currentCredit = parseFloat(invoice.Store.currentCredit) || 0;
          const creditLimit = parseFloat(invoice.Store.creditLimit) || 0;
          const newCreditUsed = currentCredit + invoice.totalAmount;
          const percentage = Math.round((newCreditUsed / creditLimit) * 100);
          
          // Check if exceeds credit limit
          if (percentage >= 100) {
            alert(`⚠️ Store "${invoice.storeName}" credit limit would be exceeded (${percentage}%) if this invoice is approved.`);
            return;
          }
          
          if (percentage >= 80) {
            const confirmProceed = window.confirm(
              `⚠️ Warning: Store "${invoice.storeName}" credit usage would be at ${percentage}% (near limit). Do you want to proceed?`
            );
            if (!confirmProceed) return;
          }
        }
      }

      // Update invoice status to 'completed'
      const response = await ApiService.patch(
        `/invoice/updateStatus/${invoice.invoiceId}`,
        { status: 'completed' },
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response) {
        alert('Invoice approved successfully!');
        loadInvoices(); // Reload invoices
        
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          const updatedInvoice = { ...selectedInvoice, status: 'completed' };
          setSelectedInvoice(updatedInvoice);
        }
      }
    } catch (error) {
      console.error('Error approving invoice:', error);
      alert('Failed to approve invoice. Please try again.');
    }
  };

  const handleRejectInvoice = async (invoiceId) => {
    try {
      // Find the original invoice to get the database ID
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      // Update invoice status to 'cancelled'
      const response = await ApiService.patch(
        `/invoice/updateStatus/${invoice.invoiceId}`,
        { status: 'cancelled' },
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response) {
        alert('Invoice rejected successfully!');
        loadInvoices(); // Reload invoices
        
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          const updatedInvoice = { ...selectedInvoice, status: 'cancelled' };
          setSelectedInvoice(updatedInvoice);
        }
      }
    } catch (error) {
      console.error('Error rejecting invoice:', error);
      alert('Failed to reject invoice. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'outlet_sale': return 'bg-purple-100 text-purple-800';
      case 'credit': return 'bg-blue-100 text-blue-800';
      case 'paid':
      case 'distribution': 
        return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (paymentType) => {
    switch (paymentType) {
      case 'Paid': return 'bg-green-50 text-green-700 border border-green-200';
      case 'Credit': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Mixed': return 'bg-purple-50 text-purple-700 border border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Invoice Management" onLogout={onLogout} />
        
        <div className="flex-1 overflow-auto p-6">
          {/* Invoice Details Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Invoice Details - {selectedInvoice.id}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(selectedInvoice.type)}`}>
                          {selectedInvoice.type}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleCloseDetails}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* Credit Warning for Credit Invoices */}
                  {selectedInvoice.type === 'credit' && storeCreditStatus && (
                    <div className={`mb-6 p-4 rounded-lg border ${
                      storeCreditStatus.isBlocked 
                        ? 'bg-red-50 border-red-200' 
                        : storeCreditStatus.isNearLimit
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <FaExclamationTriangle className={`text-lg mt-1 ${
                          storeCreditStatus.isBlocked 
                            ? 'text-red-600' 
                            : storeCreditStatus.isNearLimit
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">Credit Status for {selectedInvoice.storeName}</h4>
                          <div className="text-sm space-y-1">
                            <p>Current Credit Used: ${storeCreditStatus.currentCredit.toLocaleString()}</p>
                            <p>Invoice Amount: ${selectedInvoice.totalAmount.toLocaleString()}</p>
                            <p>New Credit Used: ${storeCreditStatus.newCreditUsed.toLocaleString()} ({storeCreditStatus.percentage}% of limit)</p>
                            <p>Credit Limit: ${storeCreditStatus.store.creditLimit.toLocaleString()}</p>
                            {storeCreditStatus.isBlocked && (
                              <p className="font-bold text-red-700 mt-2">
                                ⚠️ This store's credit limit will be exceeded if invoice is approved!
                              </p>
                            )}
                            {storeCreditStatus.isNearLimit && !storeCreditStatus.isBlocked && (
                              <p className="font-bold text-yellow-700 mt-2">
                                ⚠️ This store is near credit limit ({storeCreditStatus.percentage}%)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Store</label>
                        <p className="text-lg font-semibold text-gray-900">{selectedInvoice.storeName}</p>
                        {selectedInvoice.outletName && selectedInvoice.outletName !== 'N/A' && (
                          <p className="text-sm text-gray-600 mt-1">Outlet: {selectedInvoice.outletName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Manager</label>
                        <p className="text-lg font-semibold text-gray-900">{selectedInvoice.managerName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Invoice Type</label>
                        <span className={`px-3 py-1 text-sm font-medium rounded ${getTypeColor(selectedInvoice.type)}`}>
                          {selectedInvoice.type}
                        </span>
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
                        {selectedInvoice.creditAmount > 0 && (
                          <p className="text-sm text-blue-600 mt-1">
                            Credit Amount: ${selectedInvoice.creditAmount.toFixed(2)}
                          </p>
                        )}
                        {selectedInvoice.paidAmount > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Paid Amount: ${selectedInvoice.paidAmount.toFixed(2)}
                          </p>
                        )}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Products ({selectedInvoice.totalItems} items)</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">SKU</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Quantity</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Price</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedInvoice.products.map((product, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.productName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${product.price.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">${product.total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-100">
                            <tr>
                              <td colSpan="4" className="px-4 py-3 text-right text-sm font-medium text-gray-900 whitespace-nowrap">Total Amount:</td>
                              <td className="px-4 py-3 text-lg font-bold text-gray-900">${selectedInvoice.totalAmount.toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    {selectedInvoice.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleRejectInvoice(selectedInvoice.id)}
                          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap"
                        >
                          <FaTimesCircle />
                          <span>Reject Invoice</span>
                        </button>
                        <button
                          onClick={() => handleApproveInvoice(selectedInvoice.id)}
                          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                          disabled={storeCreditStatus?.isBlocked && selectedInvoice.type === 'credit'}
                        >
                          <FaCheckCircle />
                          <span>Approve Invoice</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleCloseDetails}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 whitespace-nowrap"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('outlet_sale')}>
                <div className="text-sm text-gray-500 mb-1">Outlet Sales</div>
                <div className="text-2xl font-bold text-purple-600">{stats.outlet_sale}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('credit')}>
                <div className="text-sm text-gray-500 mb-1">Credit</div>
                <div className="text-2xl font-bold text-blue-600">{stats.credit}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => setStatusFilter('paid')}>
                <div className="text-sm text-gray-500 mb-1">Paid/Distribution</div>
                <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Value</div>
                <div className="text-2xl font-bold text-gray-800">${stats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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
                      placeholder="Search invoices by ID, store, outlet, or manager..."
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
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Invoices Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading invoices...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">INVOICE NUMBER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">STORE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">OUTLET</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">MANAGER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ITEMS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">AMOUNT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">TYPE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">PAYMENT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">STATUS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{invoice.id}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{invoice.storeName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{invoice.outletName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{invoice.managerName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{invoice.date}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{invoice.totalItems} items</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">${invoice.totalAmount.toFixed(2)}</div>
                            {invoice.creditAmount > 0 && (
                              <div className="text-xs text-blue-600">Credit: ${invoice.creditAmount.toFixed(2)}</div>
                            )}
                            {invoice.paidAmount > 0 && (
                              <div className="text-xs text-green-600">Paid: ${invoice.paidAmount.toFixed(2)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(invoice.type)} whitespace-nowrap`}>
                              {invoice.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPaymentColor(invoice.paymentType)} whitespace-nowrap`}>
                              {invoice.paymentType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)} whitespace-nowrap`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(invoice)}
                              className="text-blue-600 hover:text-blue-900 whitespace-nowrap"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;