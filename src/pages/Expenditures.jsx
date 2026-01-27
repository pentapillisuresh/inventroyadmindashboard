import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaSearch, FaFilter, FaPlus, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { storage } from '../data/storage';

const Expenditures = ({ onLogout }) => {
  const [expenditures, setExpenditures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    notes: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingAmount: 0,
    pendingItems: 0,
    categoriesCount: 0
  });

  useEffect(() => {
    loadExpenditures();
  }, []);

  const loadExpenditures = () => {
    const allExpenses = storage.getExpenditures();
    const categories = storage.getExpenseCategories();
    
    setExpenditures(allExpenses);
    
    // Calculate statistics
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const pendingExpenses = allExpenses.filter(e => e.status === 'Pending');
    const pendingAmount = pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const pendingItems = pendingExpenses.length;
    const categoriesCount = categories.length;
    
    setStats({
      totalExpenses,
      pendingAmount,
      pendingItems,
      categoriesCount
    });
  };

  const handleAddExpense = () => {
    setShowAddModal(true);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    
    const expenseData = {
      date: newExpense.date,
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      notes: newExpense.notes,
      status: 'Pending'
    };
    
    storage.addExpenditure(expenseData);
    loadExpenditures();
    setShowAddModal(false);
    resetNewExpense();
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      storage.addExpenseCategory(newCategory.trim());
      setNewExpense(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setShowAddCategory(false);
      loadExpenditures();
    }
  };

  const resetNewExpense = () => {
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: '',
      notes: ''
    });
  };

  const handleViewDetails = (expense) => {
    setShowDetails(expense);
  };

  const handleCloseDetails = () => {
    setShowDetails(null);
  };

  const handleApproveExpense = (expenseId) => {
    storage.approveExpenditure(expenseId);
    loadExpenditures();
    if (showDetails && showDetails.id === expenseId) {
      setShowDetails(storage.getExpenditureById(expenseId));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const expenseCategories = storage.getExpenseCategories();
  const filteredExpenditures = expenditures.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col">
        <Header title="Expenditures" />
        
        <div className="flex-1 p-6">
          {/* Add Expense Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-lg w-full max-w-2xl my-8">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Expense</h2>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        resetNewExpense();
                      }}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSaveExpense}>
                    <div className="space-y-6">
                      {/* Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Category *</label>
                          {!showAddCategory && (
                            <button
                              type="button"
                              onClick={() => setShowAddCategory(true)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              + Add New Category
                            </button>
                          )}
                        </div>
                        
                        {showAddCategory ? (
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder="Enter new category name"
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={handleAddCategory}
                              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddCategory(false)}
                              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <select
                            value={newExpense.category}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select category...</option>
                            {expenseCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <input
                          type="text"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter expense description..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                          value={newExpense.notes}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                          rows="3"
                          placeholder="Add any additional notes..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            resetNewExpense();
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Add Expense
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Expense Details Modal */}
          {showDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-lg w-full max-w-2xl my-8">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Expense Details</h2>
                    <button
                      onClick={handleCloseDetails}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                        <p className="text-lg font-semibold text-gray-900">{showDetails.date}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                        <p className="text-lg font-semibold text-gray-900">{showDetails.category}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                      <p className="text-lg font-semibold text-gray-900">{showDetails.description}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Amount</label>
                      <p className="text-2xl font-bold text-gray-900">${showDetails.amount.toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(showDetails.status)}`}>
                        {showDetails.status}
                      </span>
                      {showDetails.approvedBy && (
                        <p className="text-sm text-gray-500 mt-1">Approved by {showDetails.approvedBy} on {new Date(showDetails.approvedDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    
                    {showDetails.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{showDetails.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    {showDetails.status === 'Pending' && (
                      <button
                        onClick={() => handleApproveExpense(showDetails.id)}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <FaCheckCircle />
                        <span>Approve Expense</span>
                      </button>
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Track and manage business expenses</h1>
                <p className="text-gray-600 mt-1">Monitor all expenditures and approvals</p>
              </div>
              <button
                onClick={handleAddExpense}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>Add Expense</span>
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                <div className="text-3xl font-bold text-gray-800">${stats.totalExpenses.toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-2">This month ({currentMonth})</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Pending Approval</div>
                <div className="text-3xl font-bold text-yellow-600">${stats.pendingAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-2">{stats.pendingItems} items</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Categories</div>
                <div className="text-3xl font-bold text-green-600">{stats.categoriesCount}</div>
                <div className="text-sm text-gray-500 mt-2">Active categories</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Monthly Average</div>
                <div className="text-3xl font-bold text-purple-600">${(stats.totalExpenses / 3).toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-2">Last 3 months</div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search expenses by description or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Categories</option>
                    {expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Recent Expenses Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIPTION</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenditures.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{expense.date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{expense.category}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{expense.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">${expense.amount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(expense)}
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
                
                {filteredExpenditures.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">No expenses found</div>
                    <div className="text-gray-500 text-sm">
                      {searchTerm || categoryFilter !== 'All' || statusFilter !== 'All'
                        ? 'Try adjusting your search or filters' 
                        : 'Add your first expense using the button above'}
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

export default Expenditures;