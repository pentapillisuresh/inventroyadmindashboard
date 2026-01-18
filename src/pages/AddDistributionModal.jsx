import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaMinus, FaPercent, FaBox, FaWarehouse, FaTag } from 'react-icons/fa';
import { storage } from '../data/storage';

const AddDistributionModal = ({ onSave, onClose }) => {
  const [stores, setStores] = useState([]);
  const [managers, setManagers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [racks, setRacks] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    storeId: '',
    managerId: '',
    paymentType: 'Paid',
    discount: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.storeId) {
      loadStoreInfrastructure(formData.storeId);
    }
  }, [formData.storeId]);

  const loadData = () => {
    const loadedStores = storage.getStores();
    const loadedManagers = storage.getManagers();
    const loadedProducts = storage.getProducts();
    
    setStores(loadedStores);
    setManagers(loadedManagers.filter(m => m.status === 'Active'));
    setProducts(loadedProducts.filter(p => p.status === 'In Stock' || p.status === 'Low Stock'));
  };

  const loadStoreInfrastructure = (storeId) => {
    const store = storage.getStoreById(parseInt(storeId));
    if (store) {
      setRooms(store.infrastructure || []);
      setRacks(store.racks || []);
    } else {
      setRooms([]);
      setRacks([]);
    }
  };

  const handleStoreChange = (storeId) => {
    setFormData(prev => ({ 
      ...prev, 
      storeId,
      managerId: '' // Reset manager when store changes
    }));
    // Clear product selections when store changes
    setSelectedProducts([]);
  };

  const handleAddProduct = () => {
    if (products.length > 0) {
      const firstProduct = products[0];
      const newProduct = {
        productId: firstProduct.id,
        productName: firstProduct.name,
        sku: firstProduct.sku,
        category: firstProduct.category,
        room: '',
        rack: '',
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
          sku: product.sku,
          category: product.category,
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
    } else if (field === 'room') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        room: value,
        rack: '' // Reset rack when room changes
      };
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value
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

  const getRacksForRoom = (roomName) => {
    if (!roomName) return [];
    return racks.filter(rack => rack.location === roomName);
  };

  const validateForm = () => {
    if (!formData.storeId) {
      return 'Please select a store';
    }
    
    if (selectedProducts.length === 0) {
      return 'Please add at least one product';
    }
    
    // Check if all products have quantity
    for (const item of selectedProducts) {
      if (!item.quantity || item.quantity <= 0) {
        return `Please enter a valid quantity for ${item.productName}`;
      }
      
      // Check stock availability
      const product = products.find(p => p.id === item.productId);
      if (product && item.quantity > product.stock) {
        return `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`;
      }
    }
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    const distributionData = {
      storeId: formData.storeId,
      managerId: formData.managerId || null,
      paymentType: formData.paymentType,
      discount: formData.paymentType === 'Credit' ? formData.discount : 0,
      notes: formData.notes,
      products: selectedProducts.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        room: item.room,
        rack: item.rack
      }))
    };
    
    onSave(distributionData);
  };

  const totals = calculateTotals();
  const storeManagers = formData.storeId 
    ? managers.filter(m => !m.storeId || m.storeId === parseInt(formData.storeId))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <FaPlus />
                    <span>Add Product</span>
                  </button>
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No products added yet</p>
                    <p className="text-gray-500 text-sm mt-1">Add products to create distribution</p>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Click here to add your first product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedProducts.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <FaBox className="text-gray-400" />
                              <h4 className="font-medium text-gray-900">Product #{index + 1}</h4>
                            </div>
                            {product.productName && (
                              <p className="text-sm text-gray-600 mt-1">{product.productName}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg"
                            title="Remove Product"
                          >
                            <FaMinus />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Product Selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product *
                            </label>
                            <select
                              value={product.productId || ''}
                              onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            >
                              <option value="">Select product...</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} - ${p.price.toFixed(2)} (Stock: {p.stock})
                                </option>
                              ))}
                            </select>
                            {product.sku && (
                              <p className="text-xs text-gray-500 mt-1">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={products.find(p => p.id === product.productId)?.stock || 999}
                              value={product.quantity || ''}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="Qty"
                            />
                          </div>

                          {/* Room Selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Room
                            </label>
                            <div className="relative">
                              <FaWarehouse className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                              <select
                                value={product.room || ''}
                                onChange={(e) => handleProductChange(index, 'room', e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              >
                                <option value="">Select room...</option>
                                {rooms.map(room => (
                                  <option key={room.id} value={room.name}>
                                    {room.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Rack Selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Rack
                            </label>
                            <div className="relative">
                              <FaTag className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                              <select
                                value={product.rack || ''}
                                onChange={(e) => handleProductChange(index, 'rack', e.target.value)}
                                disabled={!product.room}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <option value="">Select rack...</option>
                                {product.room && getRacksForRoom(product.room).map(rack => (
                                  <option key={rack.id} value={rack.name}>
                                    {rack.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Product Details */}
                        {product.productName && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-600">Category</p>
                                <p className="text-sm font-medium text-gray-900">{product.category || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Price</p>
                                <p className="text-sm font-medium text-gray-900">${product.price?.toFixed(2) || '0.00'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Subtotal</p>
                                <p className="text-sm font-medium text-gray-900">${product.total?.toFixed(2) || '0.00'}</p>
                              </div>
                            </div>
                          </div>
                        )}
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
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Paid"
                      checked={formData.paymentType === 'Paid'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Paid</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Credit"
                      checked={formData.paymentType === 'Credit'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Credit</span>
                  </label>
                </div>
              </div>

              {/* Discount for Credit Payments */}
              {formData.paymentType === 'Credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (Optional)
                  </label>
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
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
                  placeholder="Add any additional notes, special instructions, or requirements..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Totals Summary */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600">Total Products</p>
                      <p className="text-sm text-gray-500">{selectedProducts.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Total Items</p>
                      <p className="text-sm text-gray-500">{totals.totalItems} units</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {formData.discount > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Discount:</span>
                          <span className="ml-2 text-sm text-green-600">({formData.discount}%)</span>
                        </div>
                        <span className="font-medium text-green-600">-${totals.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between border-t border-blue-200 pt-3">
                      <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                      <span className="text-xl font-bold text-gray-900">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>This distribution will update inventory levels for the selected store.</p>
                    {selectedProducts.some(p => p.room || p.rack) && (
                      <p className="mt-1">Products will be allocated to specific rooms/racks as specified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.storeId || selectedProducts.length === 0}
                  className={`px-8 py-3 rounded-lg font-medium transition ${
                    (!formData.storeId || selectedProducts.length === 0)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
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