import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import StatCard from './StatCard';
import PendingApprovals from './PendingApprovals';
import StockAlerts from './StockAlerts';
import RecentActivity from './RecentActivity';
import { FaStore, FaShoppingCart, FaFileInvoice, FaBoxes, FaCreditCard, FaUserTie, FaChartLine, FaExclamationTriangle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { storage } from '../data/storage';
import ApiService from '../components/ApiService';

const API_BASE_URL = 'http://localhost:5001/api';
const clientToken = localStorage.getItem('token');
// CreditDues Component (unchanged functionality)
const CreditDues = ({ dues }) => {
  const [blockedOutlets, setBlockedOutlets] = useState([]);
  const [warningOutlets, setWarningOutlets] = useState([]);

  useEffect(() => {
    if (dues && dues.length > 0) {
      const blocked = dues.filter(outlet => outlet.status === 'Blocked');
      const warning = dues.filter(outlet => {
        const percentage = Math.round((outlet.creditUsed / outlet.creditLimit) * 100);
        return percentage >= 80 && percentage < 100 && outlet.status !== 'Blocked';
      });
      setBlockedOutlets(blocked);
      setWarningOutlets(warning);
    }
  }, [dues]);

  const calculatePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  const handleUnblockOutlet = (outletId) => {
    const outlets = storage.getOutlets();
    const updatedOutlets = outlets.map(outlet => {
      if (outlet.id === outletId) {
        return {
          ...outlet,
          status: 'Active',
          blockedAt: null,
          blockedReason: null
        };
      }
      return outlet;
    });
    storage.saveOutlets(updatedOutlets);
    window.location.reload();
  };

  const handleProcessPayment = (outletId) => {
    window.location.href = `/outlets`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Credit Dues Control</h2>
        <Link to="/outlets" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All →
        </Link>
      </div>
      
      {/* Blocked Outlets Section */}
      {blockedOutlets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-6 bg-red-600 rounded"></div>
            <h3 className="font-semibold text-gray-700">Blocked Outlets ({blockedOutlets.length})</h3>
          </div>
          <div className="space-y-3">
            {blockedOutlets.slice(0, 3).map((outlet) => (
              <div key={outlet.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-800">{outlet.name}</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Blocked
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Due: ${outlet.creditUsed.toLocaleString()} / ${outlet.creditLimit.toLocaleString()}
                  </span>
                  <span className="font-medium text-red-700">
                    {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%
                  </span>
                </div>
                <div className="w-full bg-red-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                  ></div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleProcessPayment(outlet.id)}
                    className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700"
                  >
                    Receive Payment
                  </button>
                  <button
                    onClick={() => handleUnblockOutlet(outlet.id)}
                    className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700"
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Outlets Section */}
      {warningOutlets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-6 bg-yellow-600 rounded"></div>
            <h3 className="font-semibold text-gray-700">Warning Outlets ({warningOutlets.length})</h3>
          </div>
          <div className="space-y-3">
            {warningOutlets.slice(0, 2).map((outlet) => (
              <div key={outlet.id} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-800">{outlet.name}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Near Limit
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    ${outlet.creditUsed.toLocaleString()} / ${outlet.creditLimit.toLocaleString()}
                  </span>
                  <span className="font-medium text-yellow-700">
                    {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%
                  </span>
                </div>
                <div className="w-full bg-yellow-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                  ></div>
                </div>
                <button
                  onClick={() => handleProcessPayment(outlet.id)}
                  className="w-full mt-3 bg-yellow-600 text-white text-sm py-2 rounded hover:bg-yellow-700"
                >
                  Request Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credit Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-600">Total Outlets</div>
            <div className="text-2xl font-bold">{dues?.length || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Credit Used</div>
            <div className="text-2xl font-bold">
              ${dues?.reduce((sum, o) => sum + (o.creditUsed || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {blockedOutlets.length === 0 && warningOutlets.length === 0 && (
        <div className="text-center py-4">
          <div className="text-gray-400 mb-2">All outlets have healthy credit status</div>
          <div className="text-sm text-gray-500">No blocked or warning outlets</div>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ onLogout }) => {
  const [stats, setStats] = useState({
    totalStores: 0,
    activeOutlets: 0,
    pendingInvoices: 0,
    totalStockValue: 0,
    creditOutstanding: 0,
    activeManagers: 0,
    blockedOutlets: 0,
    warningOutlets: 0
  });

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [creditDuesData, setCreditDuesData] = useState([]);
  const [stockAlertsData, setStockAlertsData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStockAlerts, setLoadingStockAlerts] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [stockAlertsError, setStockAlertsError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    // fetchLowStockAlerts();
    
    // Keep existing local data for other sections
    loadLocalData();
  }, []);

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    setStatsError('');
    setLoadingStockAlerts(true);
    setStockAlertsError('');

    
    try {
      const response = await ApiService.get(`/reports/dashboard/stats`,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update stats with API data while preserving existing local data for other fields
      setStats(prevStats => ({
        ...prevStats,
        totalStores: response.myStores || 0,
        activeOutlets: response.outlets || 0,
        totalStockValue: response.inventoryValue || 0
      }));
      if (response.lowStockItems) {
        const lowStockItems=response.lowStockItems
        const transformedAlerts = lowStockItems.map(item => ({
          id: item.id,
          productName: item.Product?.name || 'Unknown Product',
          sku: item.Product?.sku || 'N/A',
          storeName: item.Store?.name || 'Unknown Store',
          currentStock: item.quantity,
          reorderLevel: item.reorderLevel,
          status: item.quantity <= item.reorderLevel ? 'Low Stock' : 'Critical',
          location: getLocationString(item)
        }));
        
        setStockAlertsData(transformedAlerts);
        } else {
          setStockAlertsError(`All Stoke are full`);
      }

    } catch (err) {
      setStockAlertsError(`Failed to load low stock alerts: ${err.message}`);
      setStatsError(`Failed to load dashboard stats: ${err.message}`);
      console.error('Error fetching dashboard stats:', err);
      
      // Fallback to local data if API fails
      loadLocalStats();
    } finally {
      setLoadingStats(false);
      setLoadingStockAlerts(false);
    }
  };

  // const fetchLowStockAlerts = async () => {
  //   setLoadingStockAlerts(true);
  //   setStockAlertsError('');
    
  //   try {
  //     // Using store ID 1 as per the API endpoint
  //     const response = await ApiService.get(`/stores/1/inventory/low-stock`,{
  //       headers: {
  //         Authorization: `Bearer ${clientToken}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });
      
  //     if (!response) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
      
  //     // Transform the API response to match the format expected by StockAlerts component
  //     const transformedAlerts = response.map(item => ({
  //       id: item.id,
  //       productName: item.Product?.name || 'Unknown Product',
  //       sku: item.Product?.sku || 'N/A',
  //       storeName: item.Store?.name || 'Unknown Store',
  //       currentStock: item.quantity,
  //       reorderLevel: item.reorderLevel,
  //       status: item.quantity <= item.reorderLevel ? 'Low Stock' : 'Critical',
  //       location: getLocationString(item)
  //     }));
      
  //     setStockAlertsData(transformedAlerts);
      
  //   } catch (err) {
  //     setStockAlertsError(`Failed to load low stock alerts: ${err.message}`);
  //     console.error('Error fetching low stock alerts:', err);
      
  //     // Fallback to local data if API fails
  //     setStockAlertsData(storage.getStores().slice(0, 3));
  //   } finally {
  //     setLoadingStockAlerts(false);
  //   }
  // };

  // Helper function to generate location string from inventory item
  const getLocationString = (item) => {
    const parts = [];
    if (item.Room) parts.push(item.Room.name);
    if (item.Rack) parts.push(item.Rack.name);
    if (item.Freezer) parts.push(item.Freezer.name);
    return parts.length > 0 ? parts.join(' > ') : 'Main Storage';
  };

  const loadLocalData = () => {
    // Load all local data for sections that don't have APIs yet
    const outlets = storage.getOutlets();
    const invoices = storage.getInvoices();
    const managers = storage.getManagers();
    const activities = storage.getRecentActivities();

    // Calculate statistics for local data
    const blockedOutlets = outlets.filter(o => o.status === 'Blocked').length;
    const warningOutlets = outlets.filter(o => {
      const percentage = Math.round(((o.creditUsed || 0) / (o.creditLimit || 1)) * 100);
      return percentage >= 80 && percentage < 100 && o.status !== 'Blocked';
    }).length;

    // Update local-only stats
    setStats(prevStats => ({
      ...prevStats,
      pendingInvoices: invoices.filter(i => i.status === 'Pending').length,
      creditOutstanding: outlets.reduce((sum, o) => sum + (o.creditUsed || 0), 0),
      activeManagers: managers.filter(m => m.status === 'Active').length,
      blockedOutlets: blockedOutlets,
      warningOutlets: warningOutlets
    }));

    setPendingApprovals(storage.getPendingApprovals());
    setCreditDuesData(outlets);
    setRecentActivities(activities.slice(0, 5));
  };

  const loadLocalStats = () => {
    // Fallback function to load stats from local storage
    const stores = storage.getStores();
    const outlets = storage.getOutlets();
    const products = storage.getProducts();

    setStats(prevStats => ({
      ...prevStats,
      totalStores: stores.length,
      activeOutlets: outlets.filter(o => o.status === 'Active').length,
      totalStockValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    }));
  };

  const handleApprove = (id) => {
    const updatedApprovals = pendingApprovals.filter(item => item.id !== id);
    setPendingApprovals(updatedApprovals);
    storage.savePendingApprovals(updatedApprovals);
  };

  const handleReject = (id) => {
    const updatedApprovals = pendingApprovals.filter(item => item.id !== id);
    setPendingApprovals(updatedApprovals);
    storage.savePendingApprovals(updatedApprovals);
  };

  // Show loading state while fetching initial data
  if (loadingStats && loadingStockAlerts) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={onLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Stores',
      value: loadingStats ? '...' : stats.totalStores,
      change: '+2 this month',
      icon: <FaStore className="text-blue-600" />,
      color: 'bg-blue-50'
    },
    {
      title: 'Active Outlets',
      value: loadingStats ? '...' : stats.activeOutlets,
      change: `${stats.blockedOutlets} blocked`,
      icon: <FaShoppingCart className="text-green-600" />,
      color: 'bg-green-50'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices,
      change: 'Needs approval',
      icon: <FaFileInvoice className="text-yellow-600" />,
      color: 'bg-yellow-50'
    },
    {
      title: 'Total Stock Value',
      value: loadingStats ? '...' : `$${stats.totalStockValue.toLocaleString()}`,
      change: '+12% from last month',
      icon: <FaBoxes className="text-purple-600" />,
      color: 'bg-purple-50'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Dashboard" showSearch={false}/>
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your inventory system.</p>
          </div>

          {/* Error Messages */}
          {statsError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{statsError}</p>
            </div>
          )}

          {stockAlertsError && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-700 text-sm">{stockAlertsError}</p>
            </div>
          )}

          {/* Credit Warning Banner */}
          {stats.blockedOutlets > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FaExclamationTriangle className="text-red-600 text-xl" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">
                    ⚠️ {stats.blockedOutlets} outlet(s) are blocked due to exceeding credit limits
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Total blocked credit: ${stats.creditOutstanding.toLocaleString()}
                  </p>
                </div>
                <Link 
                  to="/outlets" 
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  View Outlets
                </Link>
              </div>
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => (
              <StatCard key={index} {...card} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <CreditDues dues={creditDuesData} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <StockAlerts 
                alerts={stockAlertsData} 
                loading={loadingStockAlerts}
                error={stockAlertsError}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;