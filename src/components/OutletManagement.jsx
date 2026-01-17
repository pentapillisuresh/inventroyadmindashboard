import React, { useState, useEffect } from 'react';
import {
  FaPhone,
  FaShoppingCart,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaDollarSign,
  FaCheckCircle,
  FaTimes,
  FaSearch,
  FaHistory,
  FaTachometerAlt,
  FaStore,
  FaShoppingBag,
  FaUserTie,
  FaBox,
  FaTruck,
  FaFileInvoice,
  FaMoneyBill,
  FaChartBar,
  FaSignOutAlt,
  FaUserCircle,
  FaBell,
  FaCog,
  FaCreditCard,
  FaExclamationTriangle,
  FaUnlock,
  FaLock
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { storage } from '../data/storage';
import Sidebar from './Sidebar';



// Header Component (same as before)
const Header = ({ title }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-600">{currentDate}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Type here to search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FaBell className="text-gray-600 text-lg" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FaCog className="text-gray-600 text-lg" />
          </button>
          
          <div className="flex items-center space-x-3">
            <FaUserCircle className="text-gray-600 text-2xl" />
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-6">
          <span>ENG</span>
          <span>26°C</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{new Date().toLocaleDateString('en-GB').split('/').join('-')}</span>
        </div>
      </div>
    </header>
  );
};

// Credit Dues Control Component
const CreditDuesControl = () => {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [blockedOutlets, setBlockedOutlets] = useState([]);
  const [warningOutlets, setWarningOutlets] = useState([]);

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = () => {
    const outletsData = storage.getOutlets();
    setOutlets(outletsData);
    
    // Separate blocked and warning outlets
    const blocked = outletsData.filter(outlet => outlet.status === 'Blocked');
    const warning = outletsData.filter(outlet => {
      const percentage = calculatePercentage(outlet.creditUsed, outlet.creditLimit);
      return percentage >= 80 && percentage < 100 && outlet.status !== 'Blocked';
    });
    
    setBlockedOutlets(blocked);
    setWarningOutlets(warning);
  };

  const calculatePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  const handleProcessPayment = (outlet) => {
    setSelectedOutlet(outlet);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handleUnblockOutlet = (outletId) => {
    const outletsData = storage.getOutlets();
    const updatedOutlets = outletsData.map(outlet => {
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
    
    // Add to recent activities
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'outlet_unblocked',
      description: `Outlet "${outletsData.find(o => o.id === outletId)?.name}" unblocked manually`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
    
    loadOutlets();
  };

  const handlePaymentSubmit = () => {
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const paymentAmt = parseFloat(paymentAmount);
    const outletsData = storage.getOutlets();
    
    const updatedOutlets = outletsData.map(outlet => {
      if (outlet.id === selectedOutlet.id) {
        const newCreditUsed = Math.max(0, outlet.creditUsed - paymentAmt);
        const percentage = calculatePercentage(newCreditUsed, outlet.creditLimit);
        const shouldUnblock = outlet.status === 'Blocked' && newCreditUsed < outlet.creditLimit;
        
        return {
          ...outlet,
          creditUsed: newCreditUsed,
          status: shouldUnblock ? 'Active' : outlet.status,
          blockedAt: shouldUnblock ? null : outlet.blockedAt,
          blockedReason: shouldUnblock ? null : outlet.blockedReason
        };
      }
      return outlet;
    });

    storage.saveOutlets(updatedOutlets);
    
    // Add payment to credit history
    storage.addPayment(selectedOutlet.id, { amount: paymentAmt });

    // Show success message
    if (selectedOutlet.status === 'Blocked' && paymentAmt > selectedOutlet.creditUsed - selectedOutlet.creditLimit) {
      alert(`✅ Outlet "${selectedOutlet.name}" has been automatically unblocked after payment!`);
    } else {
      alert(`✅ Payment of $${paymentAmt} processed successfully for "${selectedOutlet.name}"`);
    }

    // Reset and reload
    setShowPaymentModal(false);
    setSelectedOutlet(null);
    setPaymentAmount('');
    loadOutlets();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FaLock className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Blocked Outlets</p>
              <p className="text-2xl font-bold text-red-600">{blockedOutlets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Near Limit</p>
              <p className="text-2xl font-bold text-yellow-600">{warningOutlets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCreditCard className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Credit Used</p>
              <p className="text-2xl font-bold text-gray-800">
                ${outlets.reduce((sum, o) => sum + (o.creditUsed || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Outlets Section */}
      {blockedOutlets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-2 h-6 bg-red-600 rounded"></div>
            <h3 className="text-lg font-bold text-gray-800">Blocked Outlets ({blockedOutlets.length})</h3>
          </div>
          
          <div className="space-y-4">
            {blockedOutlets.map((outlet) => (
              <div key={outlet.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-800">{outlet.name}</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Blocked
                    </span>
                    {outlet.blockedAt && (
                      <span className="text-xs text-gray-500">
                        Since: {new Date(outlet.blockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-700">
                      ${outlet.creditUsed.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      of ${outlet.creditLimit.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Credit Usage</span>
                    <span className="font-medium">
                      {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%
                    </span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                    ></div>
                  </div>
                </div>

                {outlet.blockedReason && (
                  <div className="mb-4 p-3 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Reason: </span>
                      {outlet.blockedReason}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleProcessPayment(outlet)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Receive Payment
                  </button>
                  <button
                    onClick={() => handleUnblockOutlet(outlet.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <FaUnlock />
                    <span>Unblock Outlet</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Outlets Section */}
      {warningOutlets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-2 h-6 bg-yellow-600 rounded"></div>
            <h3 className="text-lg font-bold text-gray-800">Warning Outlets ({warningOutlets.length})</h3>
          </div>
          
          <div className="space-y-4">
            {warningOutlets.map((outlet) => (
              <div key={outlet.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-800">{outlet.name}</h3>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Near Limit
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-700">
                      ${outlet.creditUsed.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      of ${outlet.creditLimit.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Credit Usage</span>
                    <span className="font-medium">
                      {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%
                    </span>
                  </div>
                  <div className="w-full bg-yellow-100 rounded-full h-2.5">
                    <div
                      className="bg-yellow-500 h-2.5 rounded-full"
                      style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleProcessPayment(outlet)}
                    className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition font-medium"
                  >
                    Request Payment
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to block "${outlet.name}"? This will prevent any new credit invoices.`)) {
                        const updatedOutlets = outlets.map(o => {
                          if (o.id === outlet.id) {
                            return {
                              ...o,
                              status: 'Blocked',
                              blockedAt: new Date().toISOString(),
                              blockedReason: 'Preventive block due to near credit limit'
                            };
                          }
                          return o;
                        });
                        storage.saveOutlets(updatedOutlets);
                        loadOutlets();
                      }
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center space-x-2"
                  >
                    <FaLock />
                    <span>Preventive Block</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOutlet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Receive Payment - {selectedOutlet.name}
            </h3>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Current Due</div>
                  <div className="font-bold text-lg">${selectedOutlet.creditUsed.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Credit Limit</div>
                  <div className="font-bold text-lg">${selectedOutlet.creditLimit.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-gray-500">Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedOutlet.status === 'Blocked' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedOutlet.status}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount ($)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter payment amount"
                min="0"
                max={selectedOutlet.creditUsed}
                step="0.01"
              />
              {paymentAmount && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">After payment:</span><br />
                    New due: ${(selectedOutlet.creditUsed - parseFloat(paymentAmount || 0)).toLocaleString()}<br />
                    Available credit: ${(selectedOutlet.creditLimit - (selectedOutlet.creditUsed - parseFloat(paymentAmount || 0))).toLocaleString()}
                  </p>
                  {selectedOutlet.status === 'Blocked' && 
                   (selectedOutlet.creditUsed - parseFloat(paymentAmount || 0)) < selectedOutlet.creditLimit && (
                    <p className="text-sm text-green-700 font-medium mt-2">
                      ✅ This outlet will be automatically unblocked!
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOutlet(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Outlet Modal (same as before)
const CreateOutletModal = ({ isOpen, onClose, outlet, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Official',
    phone: '',
    creditLimit: 15000
  });

  useEffect(() => {
    if (outlet) {
      setFormData({
        name: outlet.name || '',
        type: outlet.type || 'Official',
        phone: outlet.phone || '',
        creditLimit: outlet.creditLimit || 15000
      });
    } else {
      setFormData({
        name: '',
        type: 'Official',
        phone: '',
        creditLimit: 15000
      });
    }
  }, [outlet, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'creditLimit' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {outlet ? 'Edit Outlet' : 'Create New Outlet'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlet Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter outlet name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlet Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="Official"
                      checked={formData.type === 'Official'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Official
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="Dummy"
                      checked={formData.type === 'Dummy'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Dummy
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">$</span>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="15000"
                    required
                    min="0"
                    max="1000000"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Maximum credit amount allowed for this outlet
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {outlet ? 'Update Outlet' : 'Create Outlet'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Details Modal (updated with credit control)
const OutletDetailsModal = ({ isOpen, onClose, outlet, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!isOpen || !outlet) return null;

  const calculatePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  const handleAddOrder = () => {
    const orderData = {
      items: Math.floor(Math.random() * 20) + 1,
      amount: Math.floor(Math.random() * 2000) + 500,
      status: Math.random() > 0.3 ? 'Delivered' : 'Pending'
    };
    
    storage.addOutletOrder(outlet.id, orderData);
    onUpdate();
  };

  const handleProcessPayment = () => {
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const paymentAmt = parseFloat(paymentAmount);
    storage.addPayment(outlet.id, { amount: paymentAmt });
    
    // Check if outlet should be unblocked
    const outlets = storage.getOutlets();
    const updatedOutlets = outlets.map(o => {
      if (o.id === outlet.id) {
        const newCreditUsed = Math.max(0, outlet.creditUsed - paymentAmt);
        const shouldUnblock = outlet.status === 'Blocked' && newCreditUsed < outlet.creditLimit;
        
        return {
          ...o,
          creditUsed: newCreditUsed,
          status: shouldUnblock ? 'Active' : outlet.status,
          blockedAt: shouldUnblock ? null : outlet.blockedAt,
          blockedReason: shouldUnblock ? null : outlet.blockedReason
        };
      }
      return o;
    });
    
    storage.saveOutlets(updatedOutlets);
    
    // Show success message
    if (outlet.status === 'Blocked' && paymentAmt > outlet.creditUsed - outlet.creditLimit) {
      alert(`✅ Outlet "${outlet.name}" has been automatically unblocked!`);
    } else {
      alert(`✅ Payment of $${paymentAmt} processed successfully`);
    }
    
    setPaymentAmount('');
    setShowPaymentForm(false);
    onUpdate();
  };

  const handleBlockOutlet = () => {
    if (window.confirm(`Are you sure you want to block "${outlet.name}"? This will prevent any new credit invoices.`)) {
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
      onUpdate();
    }
  };

  const handleUnblockOutlet = () => {
    const outlets = storage.getOutlets();
    const updatedOutlets = outlets.map(o => {
      if (o.id === outlet.id) {
        return {
          ...o,
          status: 'Active',
          blockedAt: null,
          blockedReason: null
        };
      }
      return o;
    });
    storage.saveOutlets(updatedOutlets);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Outlet Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Credit Status Banner */}
          <div className={`mb-6 p-4 rounded-lg border ${
            outlet.status === 'Blocked' 
              ? 'bg-red-50 border-red-200' 
              : calculatePercentage(outlet.creditUsed, outlet.creditLimit) >= 80
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {outlet.status === 'Blocked' ? (
                  <FaLock className="text-red-600 text-xl" />
                ) : calculatePercentage(outlet.creditUsed, outlet.creditLimit) >= 80 ? (
                  <FaExclamationTriangle className="text-yellow-600 text-xl" />
                ) : (
                  <FaCreditCard className="text-blue-600 text-xl" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {outlet.status === 'Blocked' ? 'BLOCKED' : 
                     calculatePercentage(outlet.creditUsed, outlet.creditLimit) >= 80 ? 'NEAR LIMIT' : 'ACTIVE'}
                  </h3>
                  <p className="text-sm">
                    Credit: ${outlet.creditUsed.toLocaleString()} / ${outlet.creditLimit.toLocaleString()} 
                    ({calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%)
                  </p>
                </div>
              </div>
              {outlet.status === 'Blocked' ? (
                <button
                  onClick={handleUnblockOutlet}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <FaUnlock className="inline-block mr-2" />
                  Unblock Outlet
                </button>
              ) : (
                <button
                  onClick={handleBlockOutlet}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  <FaLock className="inline-block mr-2" />
                  Block Outlet
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
                  <span className={`px-2 py-1 rounded text-sm ${
                    outlet.type === 'Official' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {outlet.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium flex items-center space-x-1">
                    <FaPhone className="text-sm" />
                    <span>{outlet.phone}</span>
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
              </div>
            </div>

            {/* Order Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Order Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <FaShoppingCart className="text-sm" />
                    <span>Total Orders:</span>
                  </span>
                  <span className="font-medium">{outlet.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <FaCalendarAlt className="text-sm" />
                    <span>Last Order:</span>
                  </span>
                  <span className="font-medium">{outlet.lastOrder}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-700 mb-3">Receive Payment</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount ($)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter amount"
                    min="0"
                    max={outlet.creditUsed}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleProcessPayment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Process Payment
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Credit Information */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-4">Credit Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaDollarSign className="text-blue-600" />
                  <span className="text-gray-700">Credit Limit</span>
                </div>
                <p className="text-2xl font-bold">${outlet.creditLimit.toLocaleString()}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaDollarSign className="text-orange-600" />
                  <span className="text-gray-700">Credit Used</span>
                </div>
                <p className="text-2xl font-bold">${outlet.creditUsed.toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaDollarSign className="text-green-600" />
                  <span className="text-gray-700">Available Credit</span>
                </div>
                <p className="text-2xl font-bold">${(outlet.creditLimit - outlet.creditUsed).toLocaleString()}</p>
              </div>
            </div>

            {/* Credit Progress */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Credit Usage</span>
                <span className="text-sm font-medium">
                  {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}% used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 80 
                      ? 'bg-red-600' 
                      : calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 50 
                      ? 'bg-yellow-500' 
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                ></div>
              </div>
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
                  onClick={() => setActiveTab('credit')}
                  className={`pb-2 px-1 ${
                    activeTab === 'credit'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Credit History
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {activeTab === 'orders' ? (
              <div>
                {outlet.orderHistory && outlet.orderHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Invoice ID</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Items</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {outlet.orderHistory.map((order, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium">{order.invoiceId}</td>
                            <td className="px-4 py-3">{order.date}</td>
                            <td className="px-4 py-3">{order.items}</td>
                            <td className="px-4 py-3">${order.amount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                order.status === 'Delivered' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.status}
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
                {outlet.creditHistory && outlet.creditHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {outlet.creditHistory.map((credit, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">{credit.date}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                credit.type === 'Payment' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {credit.type}
                              </span>
                            </td>
                            <td className="px-4 py-3">${credit.amount.toLocaleString()}</td>
                            <td className="px-4 py-3">${credit.balance?.toLocaleString() || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No credit history available</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPaymentForm(true)}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center space-x-2"
            >
              <FaDollarSign />
              <span>Receive Payment</span>
            </button>
            <button
              onClick={handleAddOrder}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2"
            >
              <FaPlus />
              <span>Add Test Order</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
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
  const [activeTab, setActiveTab] = useState('outlets'); // 'outlets' or 'credit-dues'

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = () => {
    const loadedOutlets = storage.getOutlets();
    setOutlets(loadedOutlets);
  };

  const calculatePercentage = (used, limit) => {
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

  const handleDeleteOutlet = (outlet) => {
    if (window.confirm(`Are you sure you want to delete "${outlet.name}"?`)) {
      storage.deleteOutlet(outlet.id);
      loadOutlets();
    }
  };

  const handleViewDetails = (outlet) => {
    setCurrentOutlet(outlet);
    setShowDetailsModal(true);
  };

  const handleModalSubmit = (formData) => {
    if (currentOutlet) {
      // Update existing outlet
      storage.updateOutlet(currentOutlet.id, formData);
    } else {
      // Create new outlet
      storage.addOutlet(formData);
    }
    loadOutlets();
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setCurrentOutlet(null);
    loadOutlets();
  };

  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    outlet.phone.includes(searchTerm) ||
    outlet.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Outlet Management" />
        
        <main className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Outlet Management</h1>
                <p className="text-gray-600">Manage outlets, credit limits, and status</p>
              </div>
              <button 
                onClick={handleCreateOutlet}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center space-x-2"
              >
                <FaPlus />
                <span>Create Outlet</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('outlets')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'outlets'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Outlets
                </button>
                <button
                  onClick={() => setActiveTab('credit-dues')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'credit-dues'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Credit Dues Control
                </button>
              </nav>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'outlets' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaShoppingCart className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Outlets</p>
                      <p className="text-2xl font-bold">{outlets.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaCheckCircle className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Active Outlets</p>
                      <p className="text-2xl font-bold">{outlets.filter(o => o.status === 'Active').length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaDollarSign className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Credit Limit</p>
                      <p className="text-2xl font-bold">${outlets.reduce((sum, outlet) => sum + outlet.creditLimit, 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FaDollarSign className="text-orange-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Credit Used</p>
                      <p className="text-2xl font-bold">${outlets.reduce((sum, outlet) => sum + outlet.creditUsed, 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Refresh */}
              <div className="mb-6 flex items-center justify-between">
                <div className="relative w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search outlets"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button 
                  onClick={loadOutlets}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <FaHistory />
                  <span>Refresh</span>
                </button>
              </div>

              {/* All Outlets Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">All Outlets</h3>
                
                {filteredOutlets.length === 0 ? (
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
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{outlet.name}</h3>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <FaPhone />
                              <span>{outlet.phone}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              outlet.type === 'Official' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {outlet.type}
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
                            <span className="font-medium">
                              ${outlet.creditUsed?.toLocaleString()} / ${outlet.creditLimit?.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 80 
                                  ? 'bg-red-600' 
                                  : calculatePercentage(outlet.creditUsed, outlet.creditLimit) > 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-600'
                              }`}
                              style={{ width: `${calculatePercentage(outlet.creditUsed, outlet.creditLimit)}%` }}
                            ></div>
                          </div>
                          <div className="text-right text-sm text-gray-500 mt-1">
                            {calculatePercentage(outlet.creditUsed, outlet.creditLimit)}% used
                          </div>
                        </div>

                        {/* Order Information */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <FaCalendarAlt />
                              <span className="text-sm">Last Order</span>
                            </div>
                            <p className="font-medium">{outlet.lastOrder}</p>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 text-gray-600 mb-1">
                              <FaShoppingCart />
                              <span className="text-sm">Total Orders</span>
                            </div>
                            <p className="font-medium">{outlet.totalOrders}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button 
                            onClick={() => handleViewDetails(outlet)}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                          >
                            <FaEye />
                            <span>View Details</span>
                          </button>
                          <button 
                            onClick={() => handleEditOutlet(outlet)}
                            className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2"
                          >
                            <FaEdit />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteOutlet(outlet)}
                            className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition flex items-center justify-center space-x-2"
                          >
                            <FaTrash />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <CreditDuesControl />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateOutletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        outlet={currentOutlet}
        onSubmit={handleModalSubmit}
      />

      <OutletDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        outlet={currentOutlet}
        onUpdate={loadOutlets}
      />
    </div>
  );
};

export default OutletManagement;