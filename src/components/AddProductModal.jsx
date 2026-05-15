import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import ApiService from './ApiService';

const AddProductModal = ({ product, categories = [], onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    price: '',
    stock: '',
    costPrice: '',
    minStock: '10',
    description: '',
    // New fields
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

  useEffect(() => {
    // If editing, populate form with product data
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
      // Set default values for new product
      setFormData({
        name: '',
        sku: '',
        categoryId: categories.length > 0 ? categories[0].id?.toString() : '',
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
    }
  }, [product, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        setLoading(true);
        const categoryProduct = {
          name: newCategory.trim(),
          description: ''
        };
        const response = await ApiService.post('/categories', categoryProduct, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (response) {
          alert('Category added successfully! Please refresh the page to see it.');
          setNewCategory('');
          setShowNewCategory(false);
          categories.push(response.category);
        } else {
          throw new Error(data.message || 'Failed to add category');
        }
      } catch (error) {
        console.error('Error adding category:', error);
        alert(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!isFormValid()) return;

    try {
      setLoading(true);
      
      // Prepare the product data for API
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        categoryId: parseInt(formData.categoryId),
        quantity: parseInt(formData.stock),
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice || 0),
        thresholdQuantity: parseInt(formData.minStock),
        // New fields
        HSN_No: formData.HSN_No.trim() || null,
        units: formData.units.trim() || null,
        IGST: formData.IGST ? parseFloat(formData.IGST) : null,
        SGST: formData.SGST ? parseFloat(formData.SGST) : null,
        CGST: formData.CGST ? parseFloat(formData.CGST) : null
      };

      // Add description if provided
      if (formData.description.trim()) {
        productData.description = formData.description.trim();
      }
console.log("productData:::",productData)
      // Call parent's onSave function with the data
      await onSave(productData);
      
    } catch (error) {
      console.error('Error in form submission:', error);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header - Fixed at top */}
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

            {/* Category */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                {!showNewCategory && categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                    disabled={loading}
                  >
                    + Add New Category
                  </button>
                )}
              </div>
              
              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
                    disabled={loading || !newCategory.trim()}
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  required
                  disabled={loading || categories.length === 0}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              
              {categories.length === 0 && !showNewCategory && (
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

            {/* Price, Stock, and Cost Price - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Selling Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                System will alert when stock falls below this level
              </p>
            </div>

            {/* HSN, GST, CIN, Units */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Tax Rates: IGST, SGST, CGST */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
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

            {/* Form Actions - Sticky at bottom */}
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
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
    </div>
  );
};

export default AddProductModal;