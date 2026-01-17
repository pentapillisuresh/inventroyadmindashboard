import React, { useState, useEffect } from 'react';
import { storage } from '../data/storage';

const CreditDuesControl = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = () => {
    const outletsData = storage.getOutlets();
    setOutlets(outletsData);
    setLoading(false);
  };

  const calculatePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  const getCreditStatus = (percentage) => {
    if (percentage >= 100) return { color: 'bg-red-600', text: 'Blocked', badge: 'bg-red-100 text-red-800' };
    if (percentage >= 80) return { color: 'bg-yellow-600', text: 'Warning', badge: 'bg-yellow-100 text-yellow-800' };
    return { color: 'bg-green-600', text: 'Good', badge: 'bg-green-100 text-green-800' };
  };

  const handleBlockOutlet = (outletId) => {
    const updatedOutlets = outlets.map(outlet => {
      if (outlet.id === outletId) {
        return {
          ...outlet,
          status: 'Blocked',
          blockedAt: new Date().toISOString(),
          blockedReason: 'Credit limit exceeded'
        };
      }
      return outlet;
    });

    storage.saveOutlets(updatedOutlets);
    setOutlets(updatedOutlets);

    // Add to recent activities
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'outlet_blocked',
      description: `Outlet "${outlets.find(o => o.id === outletId)?.name}" blocked due to credit limit exceeded`,
      timestamp: new Date().toISOString(),
      user: 'System'
    });
    storage.saveRecentActivities(activities);
  };

  const handleUnblockOutlet = (outletId) => {
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
    setOutlets(updatedOutlets);

    // Add to recent activities
    const activities = storage.getRecentActivities();
    activities.unshift({
      id: Date.now(),
      type: 'outlet_unblocked',
      description: `Outlet "${outlets.find(o => o.id === outletId)?.name}" unblocked`,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    });
    storage.saveRecentActivities(activities);
  };

  const handleOpenPaymentModal = (outlet) => {
    setSelectedOutlet(outlet);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const paymentAmt = parseFloat(paymentAmount);
    const updatedOutlets = outlets.map(outlet => {
      if (outlet.id === selectedOutlet.id) {
        const newCreditUsed = Math.max(0, outlet.creditUsed - paymentAmt);
        const isBlocked = newCreditUsed >= outlet.creditLimit;
        
        return {
          ...outlet,
          creditUsed: newCreditUsed,
          status: isBlocked ? 'Blocked' : 'Active',
          blockedAt: isBlocked ? new Date().toISOString() : null,
          blockedReason: isBlocked ? 'Credit limit exceeded' : null
        };
      }
      return outlet;
    });

    storage.saveOutlets(updatedOutlets);
    setOutlets(updatedOutlets);
    
    // Add payment to credit history
    storage.addPayment(selectedOutlet.id, { amount: paymentAmt });

    // Close modal and reset
    setShowPaymentModal(false);
    setSelectedOutlet(null);
    setPaymentAmount('');

    // Check and unblock if credit is now below limit
    const outletAfterPayment = updatedOutlets.find(o => o.id === selectedOutlet.id);
    if (outletAfterPayment.creditUsed < outletAfterPayment.creditLimit && outletAfterPayment.status === 'Blocked') {
      handleUnblockOutlet(selectedOutlet.id);
    }
  };

  // Automatic credit check on invoice approval
  const checkCreditOnInvoiceApproval = (outletId, invoiceAmount) => {
    const outlet = outlets.find(o => o.id === outletId);
    if (!outlet) return;

    const newCreditUsed = outlet.creditUsed + invoiceAmount;
    const percentage = calculatePercentage(newCreditUsed, outlet.creditLimit);

    if (percentage >= 100 && outlet.status !== 'Blocked') {
      handleBlockOutlet(outletId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading credit dues...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Credit Dues Control</h2>
            <p className="text-sm text-gray-500">Monitor and manage outlet credit limits</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{outlets.filter(o => o.status === 'Blocked').length}</span> outlets blocked
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {outlets.map((outlet) => {
            const percentage = calculatePercentage(outlet.creditUsed, outlet.creditLimit);
            const status = getCreditStatus(percentage);
            const isBlocked = outlet.status === 'Blocked';
            const isNearLimit = percentage >= 80 && percentage < 100;

            return (
              <div key={outlet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-800">{outlet.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.badge}`}>
                        {isBlocked ? 'Blocked' : status.text}
                      </span>
                      {outlet.type === 'Official' ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Official
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Dummy
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {outlet.phone} • {outlet.totalOrders || 0} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      ${outlet.creditUsed?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      of ${outlet.creditLimit?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Credit Usage</span>
                    <span className="font-medium">
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${status.color}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Last Order:</span>{' '}
                    {outlet.lastOrder || 'No orders yet'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(outlet.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => handleOpenPaymentModal(outlet)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                  >
                    Receive Payment
                  </button>
                  
                  {isBlocked ? (
                    <button
                      onClick={() => handleUnblockOutlet(outlet.id)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium text-sm"
                    >
                      Unblock Outlet
                    </button>
                  ) : isNearLimit ? (
                    <button
                      onClick={() => handleBlockOutlet(outlet.id)}
                      className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition font-medium text-sm"
                    >
                      Block Outlet
                    </button>
                  ) : null}
                </div>

                {isNearLimit && !isBlocked && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">
                        Warning: Credit limit near capacity ({percentage}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
                  <div className="font-bold text-lg">${selectedOutlet.creditUsed?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Credit Limit</div>
                  <div className="font-bold text-lg">${selectedOutlet.creditLimit?.toLocaleString()}</div>
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
                <p className="text-sm text-gray-500 mt-2">
                  New due amount: ${(selectedOutlet.creditUsed - parseFloat(paymentAmount || 0)).toLocaleString()}
                </p>
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
                onClick={handleProcessPayment}
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

export default CreditDuesControl;