import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import StatCard from './StatCard';
import PendingApprovals from './PendingApprovals';
import CreditDues from './CreditDues';
import StockAlerts from './StockAlerts';
import RecentActivity from './RecentActivity';
import { 
  FaStore, 
  FaShoppingCart, 
  FaFileInvoice, 
  FaBoxes, 
  FaCreditCard, 
  FaUserTie,
  FaChartLine 
} from 'react-icons/fa';
import { storage } from '../data/storage';

const Dashboard = ({ onLogout }) => {
  const [stats, setStats] = useState({
    totalStores: 12,
    activeOutlets: 48,
    pendingInvoices: 23,
    totalStockValue: '$284,500',
    creditOutstanding: '$45,200',
    activeManagers: 15
  });

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [creditDuesData, setCreditDuesData] = useState([]);
  const [stockAlertsData, setStockAlertsData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Load data from localStorage
    setPendingApprovals(storage.getPendingApprovals());
    setCreditDuesData(storage.getOutlets());
    setStockAlertsData(storage.getStores().slice(0, 3)); // Using stores as example
    setRecentActivities([]); // Will be implemented with actual activities
  }, []);

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

  const statCards = [
    {
      title: 'Total Stores',
      value: stats.totalStores,
      change: '+2 this month',
      icon: <FaStore className="text-blue-600" />,
      color: 'bg-blue-50'
    },
    {
      title: 'Active Outlets',
      value: stats.activeOutlets,
      change: '+5 this week',
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
      value: stats.totalStockValue,
      change: '+12% from last month',
      icon: <FaBoxes className="text-purple-600" />,
      color: 'bg-purple-50'
    },
    {
      title: 'Credit Outstanding',
      value: stats.creditOutstanding,
      change: '8 outlets',
      icon: <FaCreditCard className="text-red-600" />,
      color: 'bg-red-50'
    },
    {
      title: 'Active Managers',
      value: stats.activeManagers,
      change: 'All logged in',
      icon: <FaUserTie className="text-indigo-600" />,
      color: 'bg-indigo-50'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Dashboard" />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your inventory system.</p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((card, index) => (
              <StatCard key={index} {...card} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <PendingApprovals 
                approvals={pendingApprovals} 
                onApprove={handleApprove}
                onReject={handleReject}
              />
              
              <CreditDues dues={creditDuesData} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <StockAlerts alerts={stockAlertsData} />
              
              <RecentActivity activities={recentActivities} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;