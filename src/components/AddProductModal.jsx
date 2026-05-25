import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaTrash, FaPlus, FaSave, FaTimesCircle } from 'react-icons/fa';
import ApiService from './ApiService';

const AddProductModal = ({ product, categories = [], onSave, onClose, onCategoriesUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    price: '',
    stock: '',
    costPrice: '',
    minStock: '10',
    description: '',
    HSN_No: '',
    units: '',
    IGST: '',
    SGST: '',
    CGST: ''
  });
  const clientToken = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [localCategories, setLocalCategories] = useState(categories);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Initialize local categories when props change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Initialize form data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        categoryId: product.categoryId?.toString() || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        costPrice: product.costPrice?.toString() || '',
        minStock: product.minStock?.toString() || '10',
        description: product.description || '',
        HSN_No: product.HSN_No || '',
        units: product.units || '',
        IGST: product.IGST?.toString() || '',
        SGST: product.SGST?.toString() || '',
        CGST: product.CGST?.toString() || ''
      });
    } else {
      // Set default category if available
      setFormData(prev => ({
        ...prev,
        categoryId: localCategories.length > 0 ? localCategories[0]?.id?.toString() : ''
      }));
    }
  }, [product, localCategories]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Update categories immediately in UI without refresh
  const updateCategoriesInUI = (updatedCategories) => {
    setLocalCategories(updatedCategories);
    if (onCategoriesUpdate) {
      onCategoriesUpdate(updatedCategories);
    }
  };

  // Add new category with immediate UI update
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('Please enter a category name');
      return;
    }

    setCategoryLoading(true);
    try {
      const categoryData = {
        name: newCategory.trim(),
        description: ''
      };
      
      const response = await ApiService.post('/categories', categoryData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response && response.category) {
        // Create new category object with the response data
        const newCategoryObj = {
          id: response.category.id,
          name: response.category.name,
          description: response.category.description || ''
        };
        
        // Immediately update UI with new category
        const updatedCategories = [...localCategories, newCategoryObj];
        updateCategoriesInUI(updatedCategories);
        
        // Auto-select the newly added category
        setFormData(prev => ({ ...prev, categoryId: newCategoryObj.id.toString() }));
        
        // Reset form and show success
        setNewCategory('');
        setShowNewCategory(false);
        setSuccessMessage({ type: 'success', text: 'Category added successfully!' });
      }
    } catch (error) {
      console.error('Error adding category:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add category';
      setSuccessMessage({ type: 'error', text: errorMsg });
    } finally {
      setCategoryLoading(false);
    }
  };

  // Edit category with immediate UI update
  const handleEditCategory = async (category) => {
    if (!editCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    setCategoryLoading(true);
    try {
      const response = await ApiService.put(`/categories/${category.id}`, {
        name: editCategoryName.trim(),
        description: category.description || ''
      }, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        // Immediately update UI with edited category
        const updatedCategories = localCategories.map(cat => 
          cat.id === category.id 
            ? { ...cat, name: editCategoryName.trim() }
            : cat
        );
        updateCategoriesInUI(updatedCategories);
        
        // Update form data if the edited category was selected
        if (formData.categoryId === category.id.toString()) {
          setFormData(prev => ({ ...prev, categoryId: category.id.toString() }));
        }
        
        setEditingCategory(null);
        setEditCategoryName('');
        setSuccessMessage({ type: 'success', text: 'Category updated successfully!' });
      }
    } catch (error) {
      console.error('Error editing category:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update category';
      setSuccessMessage({ type: 'error', text: errorMsg });
    } finally {
      setCategoryLoading(false);
    }
  };

  // Delete category with immediate UI update
  const handleDeleteCategory = async (category) => {
    setCategoryLoading(true);
    try {
      await ApiService.delete(`/categories/${category.id}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Immediately remove category from UI
      const updatedCategories = localCategories.filter(cat => cat.id !== category.id);
      updateCategoriesInUI(updatedCategories);
      
      // If the deleted category was selected, reset category selection
      if (formData.categoryId === category.id.toString()) {
        setFormData(prev => ({ 
          ...prev, 
          categoryId: updatedCategories.length > 0 ? updatedCategories[0]?.id?.toString() || '' : '' 
        }));
      }
      
      setDeleteConfirm(null);
      setSuccessMessage({ type: 'success', text: 'Category deleted successfully!' });
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete category. Make sure no products are using this category.';
      setSuccessMessage({ type: 'error', text: errorMsg });
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) return;

    try {
      setLoading(true);
      
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        categoryId: parseInt(formData.categoryId),
        quantity: parseInt(formData.stock),
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice || 0),
        thresholdQuantity: parseInt(formData.minStock),
        HSN_No: formData.HSN_No.trim() || null,
        units: formData.units.trim() || null,
        IGST: formData.IGST ? parseFloat(formData.IGST) : null,
        SGST: formData.SGST ? parseFloat(formData.SGST) : null,
        CGST: formData.CGST ? parseFloat(formData.CGST) : null
      };

      if (formData.description.trim()) {
        productData.description = formData.description.trim();
      }

      await onSave(productData);
      setSuccessMessage({ type: 'success', text: product ? 'Product updated successfully!' : 'Product added successfully!' });
      
    } catch (error) {
      console.error('Error in form submission:', error);
      setSuccessMessage({ type: 'error', text: 'Failed to save product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() && 
      formData.sku.trim() && 
      formData.categoryId && 
      formData.price && 
      parseFloat(formData.price) > 0 &&
      formData.stock !== '' && 
      parseInt(formData.stock) >= 0 &&
      formData.minStock !== '' &&
      parseInt(formData.minStock) >= 0
    );
  };

  const formatRupee = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            disabled={loading}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Success/Error Message Toast */}
        {successMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg ${
            successMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {successMessage.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{successMessage.text}</span>
            </div>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                disabled={loading}
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g., COKE-500-ML"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                disabled={loading}
              />
            </div>

            {/* Category Section with Edit/Delete */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                {!showNewCategory && !editingCategory && (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 flex items-center gap-1"
                    disabled={loading || categoryLoading}
                  >
                    <FaPlus size={10} /> Add Category
                  </button>
                )}
              </div>
              
              {/* Add New Category Form */}
              {showNewCategory && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={loading || categoryLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition flex items-center gap-1"
                      disabled={categoryLoading || !newCategory.trim()}
                    >
                      {categoryLoading ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <FaSave size={12} />
                      )}
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategory('');
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
                      disabled={categoryLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Category Selection with Edit/Delete Buttons */}
              {!showNewCategory && localCategories.length > 0 && (
                <div className="space-y-2">
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                    disabled={loading || categoryLoading}
                  >
                    <option value="">Select category</option>
                    {localCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {/* Edit/Delete Controls for Selected Category */}
                  {formData.categoryId && !editingCategory && (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const category = localCategories.find(c => c.id.toString() === formData.categoryId);
                          if (category) {
                            setEditingCategory(category);
                            setEditCategoryName(category.name);
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                        disabled={loading || categoryLoading}
                      >
                        <FaEdit size={10} /> Edit Category
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const category = localCategories.find(c => c.id.toString() === formData.categoryId);
                          if (category) {
                            setDeleteConfirm(category);
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition"
                        disabled={loading || categoryLoading}
                      >
                        <FaTrash size={10} /> Delete Category
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Category Form */}
              {editingCategory && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      placeholder="Edit category name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                      disabled={loading || categoryLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleEditCategory(editingCategory)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition flex items-center gap-1"
                      disabled={categoryLoading || !editCategoryName.trim()}
                    >
                      {categoryLoading ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <FaSave size={12} />
                      )}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setEditCategoryName('');
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition flex items-center gap-1"
                      disabled={categoryLoading}
                    >
                      <FaTimesCircle size={12} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {localCategories.length === 0 && !showNewCategory && !editingCategory && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    No categories available. Click here to add a new category.
                  </button>
                </div>
              )}
            </div>

            {/* Price, Stock, Cost Price - Changed to Rupee symbol */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Selling Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cost Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="Current stock"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Minimum Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Minimum Stock (Threshold) *
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="1"
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                System will alert when stock falls below this level
              </p>
            </div>

            {/* HSN, Units */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  HSN Number
                </label>
                <input
                  type="text"
                  name="HSN_No"
                  value={formData.HSN_No}
                  onChange={handleChange}
                  placeholder="e.g., 330499"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Units
                </label>
                <input
                  type="text"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  placeholder="e.g., pcs, kg, liters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Tax Rates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rates (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">IGST (%)</label>
                  <input
                    type="number"
                    name="IGST"
                    value={formData.IGST}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">SGST (%)</label>
                  <input
                    type="number"
                    name="SGST"
                    value={formData.SGST}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">CGST (%)</label>
                  <input
                    type="number"
                    name="CGST"
                    value={formData.CGST}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    disabled={loading}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                These tax rates will be applied to invoices for this product.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Enter product description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                disabled={loading}
              />
            </div>

            {/* Product Availability Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Product Availability:</strong> Once created, this product will be available 
                system-wide for all stores and can be included in inventory distributions.
              </p>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 mt-2">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || loading}
                  className={`px-5 py-2 rounded-lg font-medium transition ${
                    isFormValid() && !loading
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {product ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    product ? 'Update Product' : 'Add Product'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FaTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Category</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete category "<strong>{deleteConfirm.name}</strong>"?
                <br />
                <span className="text-red-500 text-xs">Note: Categories with products cannot be deleted.</span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={categoryLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCategory(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  disabled={categoryLoading}
                >
                  {categoryLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <FaTrash size={12} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductModal;