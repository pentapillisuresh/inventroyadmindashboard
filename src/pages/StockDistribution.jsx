import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AddDistributionModal from '../components/AddDistributionModal';
import {
  FaPlus, FaSearch, FaFilter, FaEye, FaTrash, FaTruck, FaClock,
  FaCheckCircle, FaBox, FaTimes, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import ApiService from '../components/ApiService';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
    paid: 0,
    credit: 0,
    totalValue: 0
  });

  const clientToken = localStorage.getItem('token');

  const authHeaders = {
    Authorization: `Bearer ${clientToken}`,
    'Content-Type': 'application/json',
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  const formatRupee = (amount) =>
    `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  const mapStatus = (apiStatus) => {
    switch (apiStatus) {
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'in_transit':
      case 'inTransit': return 'In Transit';
      default: return 'Pending';
    }
  };

  const mapPaymentType = (paymentMethod) => {
    switch (paymentMethod) {
      case 'paid': return 'Paid';
      case 'credit': return 'Credit';
      case 'mixed': return 'Mixed';
      default: return 'Paid';
    }
  };

  const mapToApiStatus = (uiStatus) => {
    switch (uiStatus) {
      case 'Pending': return 'pending';
      case 'In Transit': return 'in_transit';
      case 'Completed': return 'completed';
      case 'Cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  /* ------------------------------------------------------------------ */
  /* Data loading                                                       */
  /* ------------------------------------------------------------------ */

  const loadDistributions = useCallback(async () => {
    if (!clientToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await ApiService.get(
        '/invoice/allDistributed/Invoices/admin',
        { headers: authHeaders }
      );

      const invoices = response?.invoices || [];

      /* ---- Build manager lookup map ---- */
      const managerMap = {};
      try {
        const managersResponse = await ApiService.get(
          'users/admin/all/store-managers',
          { headers: authHeaders }
        );

        if (managersResponse?.success && Array.isArray(managersResponse.data)) {
          managersResponse.data.forEach((manager) => {
            if (manager.id) managerMap[manager.id] = manager.name;
          });
        }
      } catch (err) {
        console.error('Error loading managers for lookup:', err);
      }

      /* ---- Build unique store list (by real storeId) ---- */
      const storeMap = new Map();
      invoices.forEach((inv) => {
        if (inv.Store?.name && inv.storeId != null) {
          storeMap.set(String(inv.storeId), inv.Store.name);
        }
      });
      setStores(
        Array.from(storeMap.entries()).map(([id, name]) => ({ id, name }))
      );

      /* ---- Transform invoices for the UI ---- */
      const transformed = invoices.map((invoice) => {
        const items = invoice.items || [];

        const totalItems = items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );

        const products = items.map((item) => ({
          productId: item.productId,
          productName: item.Product?.name || 'Unknown product',
          quantity: item.quantity,
          price: parseFloat(item.price || 0),
          total: parseFloat(item.totalPrice || 0),
          sku: item.Product?.sku || '-'
        }));

        let managerName = 'Unassigned';
        if (invoice.Store?.managerId && managerMap[invoice.Store.managerId]) {
          managerName = managerMap[invoice.Store.managerId];
        }

        return {
          id: invoice.invoiceNumber,
          invoiceId: invoice.id,
          storeId: String(invoice.storeId),
          storeName: invoice.Store?.name || 'Unknown store',
          managerName,
          managerId: invoice.Store?.managerId,
          date: new Date(invoice.invoiceDate).toLocaleDateString(),
          createdAt: invoice.createdAt,
          totalItems,
          products,
          totalValue: parseFloat(invoice.totalAmount || 0),
          paymentType: mapPaymentType(invoice.paymentMethod),
          status: mapStatus(invoice.status),
          discount: 0,
          notes: '',
          creditAmount: parseFloat(invoice.creditAmount || 0),
          paidAmount: parseFloat(invoice.paidAmount || 0),
          adminName: invoice.Admin?.name || 'Admin',
          adminEmail: invoice.Admin?.email
        };
      });

      setDistributions(transformed);

      /* ---- Stats ---- */
      const all = transformed.length;
      const pending = transformed.filter((d) => d.status === 'Pending').length;
      const inTransit = transformed.filter((d) => d.status === 'In Transit').length;
      const completed = transformed.filter((d) => d.status === 'Completed').length;
      const paid = transformed.filter((d) => d.paymentType === 'Paid').length;
      const credit = transformed.filter((d) => d.paymentType === 'Credit').length;
      const totalValue = transformed.reduce((sum, d) => sum + d.totalValue, 0);

      setStats({ all, pending, inTransit, completed, paid, credit, totalValue });
    } catch (error) {
      console.error('Error loading distributions:', error);
      alert('Failed to load distributions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clientToken]);

  useEffect(() => {
    loadDistributions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                           */
  /* ------------------------------------------------------------------ */

  const handleCreateDistribution = () => setShowModal(true);

  const handleSaveDistribution = async (distributionData) => {
    try {
      setSaving(true);

      const isCredit = distributionData.paymentType === 'Credit';
      const isMixed = distributionData.paymentType === 'Mixed';

      const apiData = {
        storeId: parseInt(distributionData.storeId, 10),
        type: 'distribution',
        paymentMethod: distributionData.paymentType.toLowerCase(),
        totalAmount: distributionData.totalValue,
        creditAmount: isCredit
          ? distributionData.totalValue
          : isMixed
          ? distributionData.creditAmount || 0
          : 0,
        paidAmount: isCredit
          ? 0
          : isMixed
          ? distributionData.paidAmount || 0
          : distributionData.totalValue,
        items: (distributionData.products || []).map((product) => ({
          productId: product.productId,
          quantity: product.quantity,
          price: product.price
        }))
      };

      await ApiService.post('/invoice/create', apiData, { headers: authHeaders });

      alert('Distribution created successfully!');
      setShowModal(false);
      await loadDistributions();
    } catch (error) {
      console.error('Error saving distribution:', error);
      alert('Failed to create distribution. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = (distribution) => {
    setSelectedDistribution(distribution);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (invoiceNumber, newStatus) => {
    const distribution = distributions.find((d) => d.id === invoiceNumber);
    if (!distribution) {
      alert('Distribution not found');
      return;
    }

    try {
      const apiStatus = mapToApiStatus(newStatus);

      await ApiService.put(
        `/invoice/${distribution.invoiceId}`,
        { status: apiStatus },
        { headers: authHeaders }
      );

      // Update local state immediately (optimistic UI)
      setDistributions((prev) =>
        prev.map((d) =>
          d.id === invoiceNumber ? { ...d, status: newStatus } : d
        )
      );

      if (selectedDistribution && selectedDistribution.id === invoiceNumber) {
        setSelectedDistribution((prev) => ({ ...prev, status: newStatus }));
      }

      alert(`Distribution marked as ${newStatus}.`);
      await loadDistributions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update distribution status. Please try again.');
    }
  };

  const handleDeleteDistribution = async (invoiceNumber) => {
    if (!window.confirm('Are you sure you want to delete this distribution?')) {
      return;
    }

    const distribution = distributions.find((d) => d.id === invoiceNumber);
    if (!distribution) {
      alert('Distribution not found');
      return;
    }

    try {
      await ApiService.delete(`/invoice/${distribution.invoiceId}`, {
        headers: authHeaders
      });

      alert('Distribution deleted successfully!');
      await loadDistributions();
    } catch (error) {
      console.error('Error deleting distribution:', error);
      alert('Failed to delete distribution. Please try again.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* Styling helpers                                                    */
  /* ------------------------------------------------------------------ */

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <FaCheckCircle className="text-green-500" />;
      case 'In Transit': return <FaTruck className="text-blue-500" />;
      case 'Pending': return <FaClock className="text-yellow-500" />;
      case 'Cancelled': return <FaTimes className="text-red-500" />;
      default: return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Filtering                                                          */
  /* ------------------------------------------------------------------ */

  const filteredDistributions = distributions.filter((distribution) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      distribution.id.toLowerCase().includes(term) ||
      distribution.storeName.toLowerCase().includes(term) ||
      distribution.managerName.toLowerCase().includes(term) ||
      distribution.products.some((p) =>
        p.productName.toLowerCase().includes(term)
      );

    const matchesStatus =
      statusFilter === 'All' || distribution.status === statusFilter;
    const matchesPayment =
      paymentFilter === 'All' || distribution.paymentType === paymentFilter;
    const matchesStore =
      storeFilter === 'All' || distribution.storeId === storeFilter;

    return matchesSearch && matchesStatus && matchesPayment && matchesStore;
  });

  // Reset to first page whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, storeFilter]);

  // Pagination calculations
  const totalFilteredItems = filteredDistributions.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredItems / itemsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    totalFilteredItems
  );

  const paginatedDistributions = filteredDistributions.slice(
    startIndex,
    endIndex
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (safeCurrentPage > 1) {
      setCurrentPage(safeCurrentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage(safeCurrentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      safeCurrentPage - Math.floor(maxVisiblePages / 2)
    );

    let endPage = Math.min(
      totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(
        1,
        endPage - maxVisiblePages + 1
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Stock Distribution" />

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Stock Distribution
                </h1>
                <p className="text-gray-600 mt-2">
                  Distribute inventory to stores and track distribution history
                </p>
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
              <div
                className="col-span-2 lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter('All')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">All Distributions</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.all}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total Value: {formatRupee(stats.totalValue)}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaTruck className="text-blue-600 text-lg" />
                  </div>
                </div>
              </div>

              <div
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter('Pending')}
              >
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

              <div
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter('In Transit')}
              >
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

              <div
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter('Completed')}
              >
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

              <div
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setPaymentFilter('Paid')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Paid</div>
                    <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">₹</span>
                  </div>
                </div>
              </div>

              <div
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setPaymentFilter('Credit')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Credit</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.credit}</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">₹</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
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
                        <option value="Cancelled">Cancelled</option>
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
                      <option value="Mixed">Mixed</option>
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
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Distributions Table */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading distributions...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedDistributions.map((distribution) => (
                        <tr key={distribution.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{distribution.id}</div>
                            <div className="text-xs text-gray-500">
                              {distribution.createdAt
                                ? new Date(distribution.createdAt).toLocaleDateString()
                                : distribution.date}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{distribution.storeName}</div>
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
                                {distribution.products.length} product
                                {distribution.products.length !== 1 ? 's' : ''}
                              </div>
                              <div className="mt-1">
                                {distribution.products.slice(0, 2).map((p) => (
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
                            <div className="text-sm text-gray-600">
                              {distribution.products.slice(0, 1).map((p) => (
                                <div key={p.productId} className="text-xs">
                                  {p.sku}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatRupee(distribution.totalValue)}
                              {distribution.creditAmount > 0 && (
                                <div className="text-xs text-blue-600">
                                  Credit: {formatRupee(distribution.creditAmount)}
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
                                  onClick={() => handleStatusUpdate(distribution.id, 'Completed')}
                                  className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition"
                                  title="Mark as Completed"
                                >
                                  <FaCheckCircle />
                                </button>
                              )}
                              {distribution.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleStatusUpdate(distribution.id, 'Cancelled')}
                                  className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition"
                                  title="Cancel Distribution"
                                >
                                  <FaTimes />
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
                        {searchTerm ||
                        statusFilter !== 'All' ||
                        paymentFilter !== 'All' ||
                        storeFilter !== 'All'
                          ? 'No distributions found'
                          : 'No distributions yet'}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        {searchTerm ||
                        statusFilter !== 'All' ||
                        paymentFilter !== 'All' ||
                        storeFilter !== 'All'
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

                  {/* Pagination */}
                  {totalFilteredItems > 0 && (
                    <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-white">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing{' '}
                          <span className="font-medium text-gray-800">
                            {startIndex + 1}
                          </span>
                          {' '}to{' '}
                          <span className="font-medium text-gray-800">
                            {endIndex}
                          </span>
                          {' '}of{' '}
                          <span className="font-medium text-gray-800">
                            {totalFilteredItems}
                          </span>
                          {' '}distributions
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handlePreviousPage}
                            disabled={safeCurrentPage === 1}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                              safeCurrentPage === 1
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <FaChevronLeft />
                          </button>

                          {getPageNumbers().map((page) => (
                            <button
                              type="button"
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`min-w-[40px] px-3 py-2 rounded-lg border text-sm font-medium transition ${
                                safeCurrentPage === page
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={handleNextPage}
                            disabled={safeCurrentPage === totalPages}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                              safeCurrentPage === totalPages
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <FaChevronRight />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Distribution Modal */}
      {showModal && (
        <AddDistributionModal
          onSave={handleSaveDistribution}
          onClose={() => setShowModal(false)}
          saving={saving}
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
                  <p className="text-sm text-gray-500">Admin: {selectedDistribution.adminName}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Store</p>
                    <p className="font-medium">{selectedDistribution.storeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Manager</p>
                    <p className="font-medium">{selectedDistribution.managerName}</p>
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
                    <p className="text-xl font-bold text-gray-900">
                      {formatRupee(selectedDistribution.totalValue)}
                    </p>
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
                        <div className="w-full">
                          <h4 className="font-medium text-gray-900">{product.productName}</h4>
                          <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                          <div className="mt-2 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Quantity</p>
                              <p className="font-medium">{product.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Price</p>
                              <p className="font-medium">{formatRupee(product.price)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total</p>
                              <p className="font-medium">{formatRupee(product.total)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-lg font-semibold">
                        {formatRupee(selectedDistribution.totalValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Paid Amount</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatRupee(selectedDistribution.paidAmount || 0)}
                      </p>
                    </div>
                    {selectedDistribution.creditAmount > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Credit Amount</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatRupee(selectedDistribution.creditAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatRupee(selectedDistribution.totalValue)}
                    </span>
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