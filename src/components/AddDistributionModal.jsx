import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaTimes, FaPlus, FaMinus, FaPercent, FaBox, FaWarehouse, FaTag, FaSnowflake, FaArchive } from 'react-icons/fa';
import ApiService from './ApiService';

const AddDistributionModal = ({ onSave, onClose }) => {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState({
    stores: false,
    products: false,
    rooms: false,
    submitting: false
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({
    storeId: '',
    paymentType: 'paid',
    discount: 0,
    notes: '',
    paidAmount: 0,
    creditAmount: 0
  });

  // Get token from localStorage inside component
  const clientToken = localStorage.getItem('token');

  useEffect(() => {
    loadStores();
    loadProducts();
  }, []);

  useEffect(() => {
    if (formData.storeId) {
      loadRooms(formData.storeId);
    }
  }, [formData.storeId]);

  const loadStores = async () => {
    try {
      setLoading(prev => ({ ...prev, stores: true }));
      const response = await ApiService.get('/stores', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.success) {
        setStores(response.data);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      alert('Failed to load stores. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, stores: false }));
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const response = await ApiService.get('/products', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.products) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const loadRooms = async (storeId) => {
    try {
      setLoading(prev => ({ ...prev, rooms: true }));
      const response = await ApiService.get(`/stores/${storeId}/rooms`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      setRooms(response);
    } catch (error) {
      console.error('Error loading rooms:', error);
      alert('Failed to load room data. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  };

  const handleStoreChange = (storeId) => {
    setFormData(prev => ({ 
      ...prev, 
      storeId
    }));
    setSelectedProducts([]);
  };

  const handleAddProduct = () => {
    const firstProduct = products.length > 0 ? products[0] : null;
    if (firstProduct) {
      const newProduct = {
        productId: firstProduct.id,
        productName: firstProduct.name,
        sku: firstProduct.sku,
        category: firstProduct.Category?.name || 'Uncategorized',
        roomId: '',
        rackId: '',
        freezerId: '',
        locationType: '',
        locationId: '',
        quantity: 0,
        price: parseFloat(firstProduct.price),
        total: parseFloat(firstProduct.price),
        maxQuantity: calculateAvailableQuantity(firstProduct.id, 0)
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }
  };

  // Calculate available quantity for a product considering already selected quantities
  const calculateAvailableQuantity = useCallback((productId, indexToExclude) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    // Get total quantity available from inventories
    const totalAvailable = product.quantity
    
    // Subtract quantities already selected in other product blocks
    let alreadySelected = 0;
    selectedProducts.forEach((prod, index) => {
      if (prod.productId === productId && index !== indexToExclude) {
        alreadySelected += prod.quantity || 0;
      }
    });
    
    return Math.max(0, totalAvailable - alreadySelected);
  }, [products, selectedProducts]);

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...selectedProducts];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        const maxQuantity = calculateAvailableQuantity(product.id, index);
        const quantity = Math.min(updatedProducts[index].quantity || 1, maxQuantity || 1);
        
        updatedProducts[index] = {
          ...updatedProducts[index],
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          category: product.Category?.name || 'Uncategorized',
          price: parseFloat(product.price),
          quantity: quantity,
          total: parseFloat(product.price) * quantity,
          maxQuantity: maxQuantity,
          // Reset location selections when product changes
          roomId: '',
          rackId: '',
          freezerId: '',
          locationType: '',
          locationId: ''
        };
      }
    } else if (field === 'quantity') {
      const maxQty = updatedProducts[index].maxQuantity;
      let quantity = parseInt(value) || 0;
      
      // Auto-adjust if exceeds max
      if (quantity > maxQty) {
        quantity = maxQty;
      }
      if (quantity < 1) quantity = 1;
      
      updatedProducts[index] = {
        ...updatedProducts[index],
        quantity: quantity,
        total: updatedProducts[index].price * quantity
      };
    } else if (field === 'roomId') {
      const room = rooms.find(r => r.id === parseInt(value));
      const racks = room?.Racks || [];
      const freezers = room?.Freezers || [];
      
      updatedProducts[index] = {
        ...updatedProducts[index],
        roomId: value,
        rackId: '',
        freezerId: '',
        locationType: '',
        locationId: '',
        availableRacks: racks,
        availableFreezers: freezers
      };
    } else if (field === 'rackId') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        rackId: value,
        freezerId: '',
        locationType: value ? 'rack' : '',
        locationId: value
      };
    } else if (field === 'freezerId') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        rackId: '',
        freezerId: value,
        locationType: value ? 'freezer' : '',
        locationId: value
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

  // Calculate totals - using useMemo to prevent unnecessary recalculations
  const totals = useMemo(() => {
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
  }, [selectedProducts, formData.discount]);

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
      
      // Check if location is selected when room is selected
      if (item.roomId && !item.rackId && !item.freezerId) {
        return `Please select either a rack or freezer for ${item.productName}`;
      }
      
      // Check if location type is consistent
      if (item.rackId && item.freezerId) {
        return `Please select either a rack OR freezer for ${item.productName}, not both`;
      }
    }
    
    // Validate mixed payment
    if (formData.paymentType === 'mixed') {
      if (formData.paidAmount <= 0) {
        return 'Please enter a paid amount for mixed payment';
      }
      const calculatedCredit = totals.total - formData.paidAmount;
      if (calculatedCredit < 0) {
        return 'Paid amount cannot exceed total amount';
      }
    }
    
    return null;
  };

  // Handle payment type change - FIXED: Check if totals exists before using it
  const handlePaymentTypeChange = useCallback((paymentType) => {
    const currentTotal = totals?.total || 0;
    
    if (paymentType === 'paid') {
      setFormData(prev => ({
        ...prev,
        paymentType,
        paidAmount: currentTotal,
        creditAmount: 0
      }));
    } else if (paymentType === 'credit') {
      setFormData(prev => ({
        ...prev,
        paymentType,
        paidAmount: 0,
        creditAmount: currentTotal
      }));
    } else {
      // For mixed, keep current paid amount or set to 0
      setFormData(prev => ({
        ...prev,
        paymentType,
        creditAmount: Math.max(0, currentTotal - (prev.paidAmount || 0))
      }));
    }
  }, [totals?.total]);

  // Handle paid amount change for mixed payment
  const handlePaidAmountChange = useCallback((value) => {
    const currentTotal = totals?.total || 0;
    const paidAmount = parseFloat(value) || 0;
    const creditAmount = Math.max(0, currentTotal - paidAmount);
    
    setFormData(prev => ({
      ...prev,
      paidAmount,
      creditAmount
    }));
  }, [totals?.total]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading.submitting) return;
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, submitting: true }));
      
      // For mixed payment, ensure credit amount is calculated correctly
      let finalPaidAmount = formData.paidAmount;
      let finalCreditAmount = formData.creditAmount;
      
      if (formData.paymentType === 'mixed') {
        finalCreditAmount = totals.total - formData.paidAmount;
      }
      
      // Prepare request data
      const requestData = {
        paymentMethod: formData.paymentType,
        paidAmount: finalPaidAmount,
        creditAmount: finalCreditAmount,
        items: selectedProducts.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          roomId: item.roomId,
          locationType: item.locationType,
          locationId: item.locationId
        }))
      };
      
      console.log('Sending distribution request:', requestData);
      
      // Make POST request to distribute products
      const response = await ApiService.post(
        `/products/distribute/${formData.storeId}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response) {
        // Prepare distribution data for parent component
        const distributionData = {
          storeId: formData.storeId,
          paymentType: formData.paymentType === 'paid' ? 'Paid' : formData.paymentType === 'credit' ? 'Credit' : 'Mixed',
          discount: formData.discount,
          notes: formData.notes,
          paidAmount: finalPaidAmount,
          creditAmount: finalCreditAmount,
          totalValue: totals.total,
          products: selectedProducts.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            sku: item.sku,
            room: rooms.find(r => r.id === parseInt(item.roomId))?.name || '',
            rack: item.rackId ? rooms
              .flatMap(r => r.Racks)
              .find(r => r.id === parseInt(item.rackId))?.name || '' : '',
            freezer: item.freezerId ? rooms
              .flatMap(r => r.Freezers)
              .find(f => f.id === parseInt(item.freezerId))?.name || '' : '',
            locationType: item.locationType
          }))
        };
        
        onSave(distributionData);
        alert('Distribution created successfully!');
        onClose();
      } else {
        alert('Failed to create distribution. Please try again.');
      }
    } catch (error) {
      console.error('Error creating distribution:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create distribution. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Initialize form with proper payment amounts when component mounts
  useEffect(() => {
    if (formData.paymentType === 'paid') {
      setFormData(prev => ({
        ...prev,
        paidAmount: 0,
        creditAmount: 0
      }));
    }
  }, []);

  // Update payment amounts when totals change
  useEffect(() => {
    if (formData.paymentType === 'paid') {
      setFormData(prev => ({
        ...prev,
        paidAmount: totals?.total || 0,
        creditAmount: 0
      }));
    } else if (formData.paymentType === 'credit') {
      setFormData(prev => ({
        ...prev,
        paidAmount: 0,
        creditAmount: totals?.total || 0
      }));
    }
    // For mixed payment, don't auto-update - user specifies amounts manually
  }, [totals?.total, formData.paymentType]);

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
                  disabled={loading.stores}
                >
                  <option value="">{loading.stores ? 'Loading stores...' : 'Choose store...'}</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.address || 'No address'}
                    </option>
                  ))}
                </select>
                {loading.stores && (
                  <p className="mt-1 text-sm text-gray-500">Loading stores...</p>
                )}
              </div>

              {/* Products Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Products *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={loading.products || products.length === 0}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                      loading.products || products.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <FaPlus />
                    <span>Add Product</span>
                  </button>
                </div>

                {loading.products ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                  </div>
                ) : selectedProducts.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No products added yet</p>
                    <p className="text-gray-500 text-sm mt-1">Add products to create distribution</p>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={products.length === 0}
                      className={`mt-4 text-sm font-medium ${
                        products.length === 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
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
                              {product.maxQuantity > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Available: {product.maxQuantity}
                                </span>
                              )}
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                              {products.map(p => {
                                const available = calculateAvailableQuantity(p.id, index);
                                return (
                                  <option 
                                    key={p.id} 
                                    value={p.id}
                                    disabled={available <= 0}
                                  >
                                    {p.name} - ${parseFloat(p.price).toFixed(2)} (Available: {available})
                                  </option>
                                );
                              })}
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
                              Quantity * (Max: {product.maxQuantity})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={product.maxQuantity}
                              value={product.quantity || ''}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="Qty"
                              required
                            />
                          </div>
                        </div>

                        {/* Location Selection - Only show if store is selected */}
                        {formData.storeId && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                              {/* Room Selection */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Room (Optional)
                                </label>
                                <div className="relative">
                                  <FaWarehouse className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                  <select
                                    value={product.roomId || ''}
                                    onChange={(e) => handleProductChange(index, 'roomId', e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  >
                                    <option value="">Select room...</option>
                                    {loading.rooms ? (
                                      <option value="">Loading rooms...</option>
                                    ) : rooms.map(room => (
                                      <option key={room.id} value={room.id}>
                                        {room.name} (Capacity: {room.currentOccupancy}/{room.capacity})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Rack Selection - Only show if room is selected */}
                              {product.roomId && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Rack (Choose rack OR freezer)
                                  </label>
                                  <div className="relative">
                                    <FaArchive className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                    <select
                                      value={product.rackId || ''}
                                      onChange={(e) => handleProductChange(index, 'rackId', e.target.value)}
                                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    >
                                      <option value="">Select rack...</option>
                                      {product.availableRacks?.map(rack => (
                                        <option key={rack.id} value={rack.id}>
                                          {rack.name} (Capacity: {rack.currentOccupancy}/{rack.capacity})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* Freezer Selection - Only show if room is selected */}
                              {product.roomId && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Freezer (Choose rack OR freezer)
                                  </label>
                                  <div className="relative">
                                    <FaSnowflake className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                    <select
                                      value={product.freezerId || ''}
                                      onChange={(e) => handleProductChange(index, 'freezerId', e.target.value)}
                                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    >
                                      <option value="">Select freezer...</option>
                                      {product.availableFreezers?.map(freezer => (
                                        <option key={freezer.id} value={freezer.id}>
                                          {freezer.name} (Capacity: {freezer.currentOccupancy}/{freezer.capacity})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Location Help Text */}
                            {product.roomId && (!product.rackId && !product.freezerId) && (
                              <p className="text-xs text-yellow-600 mt-2">
                                Please select either a rack or freezer for this product
                              </p>
                            )}
                          </>
                        )}

                        {/* Product Details */}
                        {product.productName && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-600">Category</p>
                                <p className="text-sm font-medium text-gray-900">{product.category || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Price per unit</p>
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
                      value="paid"
                      checked={formData.paymentType === 'paid'}
                      onChange={(e) => handlePaymentTypeChange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Paid</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="credit"
                      checked={formData.paymentType === 'credit'}
                      onChange={(e) => handlePaymentTypeChange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Credit</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="mixed"
                      checked={formData.paymentType === 'mixed'}
                      onChange={(e) => handlePaymentTypeChange(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Mixed</span>
                  </label>
                </div>
              </div>

              {/* Discount */}
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

              {/* Mixed Payment Inputs */}
              {formData.paymentType === 'mixed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paid Amount *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totals?.total || 0}
                      step="0.01"
                      value={formData.paidAmount}
                      onChange={(e) => handlePaidAmountChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter paid amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Amount (Auto-calculated)
                    </label>
                    <input
                      type="number"
                      value={formData.creditAmount}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
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
                      <p className="text-sm text-gray-500">{totals?.totalItems || 0} units</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${(totals?.subtotal || 0).toFixed(2)}</span>
                    </div>
                    
                    {formData.discount > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Discount:</span>
                          <span className="ml-2 text-sm text-green-600">({formData.discount}%)</span>
                        </div>
                        <span className="font-medium text-green-600">-${(totals?.discountAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between border-t border-blue-200 pt-3">
                      <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                      <span className="text-xl font-bold text-gray-900">${(totals?.total || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Type:</span>
                      <span className="font-medium capitalize">{formData.paymentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid Amount:</span>
                      <span className="font-medium text-green-600">${formData.paidAmount.toFixed(2)}</span>
                    </div>
                    {formData.creditAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Credit Amount:</span>
                        <span className="font-medium text-blue-600">${formData.creditAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>This distribution will update inventory levels for the selected store.</p>
                    {selectedProducts.some(p => p.roomId) && (
                      <p className="mt-1">Products will be allocated to specific locations as specified.</p>
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
                  disabled={!formData.storeId || selectedProducts.length === 0 || loading.submitting}
                  className={`px-8 py-3 rounded-lg font-medium transition ${
                    (!formData.storeId || selectedProducts.length === 0 || loading.submitting)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {loading.submitting ? 'Creating Distribution...' : 'Create Distribution'}
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