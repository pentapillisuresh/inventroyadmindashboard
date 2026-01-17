import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaMinus, FaPercent } from 'react-icons/fa';
import { storage } from '../data/storage';

const AddDistributionModal = ({ onSave, onClose }) => {
  const [stores, setStores] = useState([]);
  const [managers, setManagers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    storeId: '',
    managerId: '',
    paymentType: 'Paid',
    discount: 0,
    notes: ''
  });

  useEffect(() => {
    // Load data from storage
    const loadedStores = storage.getStores();
    const loadedManagers = storage.getManagers();
    const loadedProducts = storage.getProducts();
    
    setStores(loadedStores);
    setManagers(loadedManagers.filter(m => m.status === 'Active'));
    setProducts(loadedProducts.filter(p => p.status === 'In Stock' || p.status === 'Low Stock'));
  }, []);

  const handleStoreChange = (storeId) => {
    setFormData(prev => ({ 
      ...prev, 
      storeId,
      managerId: '' // Reset manager when store changes
    }));
  };

  const handleAddProduct = () => {
    if (products.length > 0) {
      const firstProduct = products[0];
      const newProduct = {
        productId: firstProduct.id,
        productName: firstProduct.name,
        quantity: 1,
        price: firstProduct.price,
        total: firstProduct.price
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...selectedProducts];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updatedProducts[index] = {
          ...updatedProducts[index],
          productId: product.id,
          productName: product.name,
          price: product.price,
          total: product.price * (updatedProducts[index].quantity || 1)
        };
      }
    } else if (field === 'quantity') {
      const quantity = parseInt(value) || 0;
      updatedProducts[index] = {
        ...updatedProducts[index],
        quantity: quantity,
        total: updatedProducts[index].price * quantity
      };
    }
    
    setSelectedProducts(updatedProducts);
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalItems = 0;
    
    selectedProducts.forEach(product => {
      subtotal += product.total;
      totalItems += product.quantity;
    });
    
    let discountAmount = 0;
    if (formData.discount > 0) {
      discountAmount = subtotal * (formData.discount / 100);
    }
    
    const total = subtotal - discountAmount;
    
    return {
      subtotal,
      discountAmount,
      total,
      totalItems
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.storeId) {
      alert('Please select a store');
      return;
    }
    
    if (selectedProducts.length === 0) {
      alert('Please add at least one product');
      return;
    }
    
    // Check stock availability
    for (const item of selectedProducts) {
      const product = products.find(p => p.id === item.productId);
      if (product && item.quantity > product.stock) {
        alert(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        return;
      }
    }
    
    const distributionData = {
      storeId: formData.storeId,
      managerId: formData.managerId || null,
      paymentType: formData.paymentType,
      discount: formData.paymentType === 'Credit' ? formData.discount : 0,
      notes: formData.notes,
      products: selectedProducts
    };
    
    onSave(distributionData);
  };

  const totals = calculateTotals();
  const storeManagers = formData.storeId 
    ? managers.filter(m => !m.storeId || m.storeId === parseInt(formData.storeId))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">New Stock Distribution</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Store *
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose store...</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.address || 'No address'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manager Selection */}
              {formData.storeId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Manager (Optional)
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select manager...</option>
                    {storeManagers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} - {manager.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Products Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Products *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <FaPlus />
                    <span>Add Product</span>
                  </button>
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No products added yet</p>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Click here to add your first product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((product, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <select
                            value={product.productId}
                            onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Select product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku}) - ${p.price.toFixed(2)} - Stock: {p.stock}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="w-24">
                          <div className="text-sm font-medium text-gray-900">
                            ${product.total.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            @${product.price.toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <FaMinus />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Paid"
                      checked={formData.paymentType === 'Paid'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                      className="mr-2"
                    />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Credit"
                      checked={formData.paymentType === 'Credit'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                      className="mr-2"
                    />
                    <span>Credit</span>
                  </label>
                </div>
              </div>

              {/* Discount for Credit Payments */}
              {formData.paymentType === 'Credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter discount percentage"
                    />
                    <FaPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  {formData.discount > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      {formData.discount}% discount will be applied to the total amount
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  placeholder="Add any additional notes..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  {formData.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount ({formData.discount}%):</span>
                      <span className="font-medium text-green-600">-${totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-lg font-bold text-gray-900">${totals.total.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {totals.totalItems} items across {selectedProducts.length} products
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.storeId || selectedProducts.length === 0}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    (!formData.storeId || selectedProducts.length === 0)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Create Distribution
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDistributionModal;