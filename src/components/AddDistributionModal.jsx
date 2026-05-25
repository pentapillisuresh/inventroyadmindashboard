import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaTimes, FaPlus, FaMinus, FaPercent, FaBox, FaWarehouse, FaTag, FaSnowflake, FaArchive, FaStore, FaToggleOn, FaToggleOff, FaTruck, FaFileInvoice, FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa';
import ApiService from './ApiService';

const AddDistributionModal = ({ onSave, onClose, initialMode = 'stock' }) => {
  const [stores, setStores] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [distributionMode, setDistributionMode] = useState(initialMode);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [loading, setLoading] = useState({
    stores: false,
    outlets: false,
    products: false,
    rooms: false,
    submitting: false
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({
    storeId: '',
    outletId: '',
    paymentType: 'paid',
    discount: 0,
    notes: '',
    paidAmount: 0,
    creditAmount: 0,
  });
  // State for temporary quantity and box name when adding products
  const [tempQuantities, setTempQuantities] = useState({});
  const [tempBoxNames, setTempBoxNames] = useState({});

  // Get token from localStorage inside component
  const clientToken = localStorage.getItem('token');

  // Helper function to format Rupee
  const formatRupee = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;
  };

  useEffect(() => {
    loadStores();
    loadProducts();
    loadOutlets();
  }, [distributionMode]);

  useEffect(() => {
    if (distributionMode === 'stock' && formData.storeId) {
      loadRooms(formData.storeId);
    }
  }, [formData.storeId, distributionMode]);

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

  const loadOutlets = async () => {
    try {
      setLoading(prev => ({ ...prev, outlets: true }));
      const response = await ApiService.get('/outlets', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.outlets) {
        setOutlets(response.outlets);
      }
    } catch (error) {
      console.error('Error loading outlets:', error);
    } finally {
      setLoading(prev => ({ ...prev, outlets: false }));
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

  const loadInventory = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const response = await ApiService.get(`/inventory/store/${formData.storeId}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response) {
        const inventoryData = response.map(item => {
          return {
            id: item.id,
            productId: item.Product.id,
            name: item.Product.name,
            sku: item.Product.sku,
            HSN_No: item.Product.HSN_No,
            categoryId: item.Product.categoryId,
            quantity: item.quantity,
            units: item.Product.units,
            price: item.Product.price,
            Category: item.Product.Category,
          };
        });
        setProducts(inventoryData);
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

  const handleToggleMode = () => {
    setDistributionMode(prev => prev === 'stock' ? 'outlet' : 'stock');
    setFormData(prev => ({
      ...prev,
      storeId: '',
      outletId: ''
    }));
    setSelectedProducts([]);
    setTempQuantities({});
    setTempBoxNames({});
    loadProducts();
  };

  const handleStoreChange = (storeId) => {
    setFormData(prev => ({
      ...prev,
      storeId
    }));
    setSelectedProducts([]);
    setTempQuantities({});
    setTempBoxNames({});
  };

  const handleOutletChange = (outletId) => {
    setFormData(prev => ({
      ...prev,
      outletId
    }));
    setSelectedProducts([]);
    setTempQuantities({});
    setTempBoxNames({});
    loadInventory();
  };

  // Toggle product expansion
  const toggleProductExpand = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Add product to selected list
  const addToSelected = (product) => {
    const quantity = tempQuantities[product.id] || 0;
    const boxName = tempBoxNames[product.id] || '';

    if (quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (!boxName.trim()) {
      alert('Please enter a box name');
      return;
    }

    const newProduct = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.Category?.name || 'Uncategorized',
      roomId: '',
      rackId: '',
      freezerId: '',
      locationType: '',
      locationId: '',
      boxName: boxName,
      quantity: quantity,
      price: parseFloat(product.price),
      total: parseFloat(product.price) * quantity,
      maxQuantity: product.quantity || 0
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    
    // Reset temp values for this product
    setTempQuantities(prev => ({ ...prev, [product.id]: 0 }));
    setTempBoxNames(prev => ({ ...prev, [product.id]: '' }));
    setExpandedProducts(prev => ({ ...prev, [product.id]: false }));
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const handleSelectedProductChange = (index, field, value) => {
    const updatedProducts = [...selectedProducts];

    if (field === 'quantity') {
      const maxQty = updatedProducts[index].maxQuantity;
      let quantity = parseInt(value) || 0;
      if (quantity > maxQty) quantity = maxQty;
      if (quantity < 1) quantity = 1;
      
      updatedProducts[index] = {
        ...updatedProducts[index],
        quantity: quantity,
        total: updatedProducts[index].price * quantity
      };
    } else if (field === 'boxName') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        boxName: value
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
    }
    
    setSelectedProducts(updatedProducts);
  };

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
    if (distributionMode === 'stock' && !formData.storeId) {
      return 'Please select a store';
    }

    if (distributionMode === 'outlet' && !formData.outletId) {
      return 'Please select an outlet';
    }

    if (selectedProducts.length === 0) {
      return 'Please add at least one product';
    }

    for (const item of selectedProducts) {
      if (distributionMode === 'stock' && item.roomId && !item.rackId && !item.freezerId) {
        return `Please select either a rack or freezer for ${item.productName}`;
      }
      if (distributionMode === 'stock' && item.rackId && item.freezerId) {
        return `Please select either a rack OR freezer for ${item.productName}, not both`;
      }
    }

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
      setFormData(prev => ({
        ...prev,
        paymentType,
        creditAmount: Math.max(0, currentTotal - (prev.paidAmount || 0))
      }));
    }
  }, [totals?.total]);

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

      let finalPaidAmount = formData.paidAmount;
      let finalCreditAmount = formData.creditAmount;

      if (formData.paymentType === 'mixed') {
        finalCreditAmount = totals.total - formData.paidAmount;
      }

      let response;

      if (distributionMode === 'stock') {
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
            locationId: item.locationId,
            boxName: item.boxName
          }))
        };

        response = await ApiService.post(
          `/products/distribute/${formData.storeId}`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

      } else {
        const selectedOutlet = outlets.find(o => o.id === parseInt(formData.outletId));
        const requestData = {
          paymentMethod: formData.paymentType,
          paidAmount: finalPaidAmount,
          creditAmount: finalCreditAmount,
          outletName: selectedOutlet?.name,
          notes: formData.notes,
          outletAddress: selectedOutlet?.address,
          contactPerson: selectedOutlet?.contactPerson,
          phoneNumber: selectedOutlet?.phoneNumber,
          items: selectedProducts.map(item => ({
            productId: item.productId,
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            productName: item.productName,
            sku: item.sku,
            boxName: item.boxName
          }))
        };

        response = await ApiService.post(`/stores/${formData.storeId}/outlets/${formData.outletId}/invoices/byAdmin`, requestData, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (response) {
        const distributionData = {
          mode: distributionMode,
          storeId: formData.storeId,
          invoice: response.invoice.invoiceNumber,
          outletId: formData.outletId,
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
            boxName: item.boxName,
            sku: item.sku,
            room: distributionMode === 'stock' && item.roomId ? rooms.find(r => r.id === parseInt(item.roomId))?.name || '' : '',
            rack: distributionMode === 'stock' && item.rackId ? rooms
              .flatMap(r => r.Racks)
              .find(r => r.id === parseInt(item.rackId))?.name || '' : '',
            freezer: distributionMode === 'stock' && item.freezerId ? rooms
              .flatMap(r => r.Freezers)
              .find(f => f.id === parseInt(item.freezerId))?.name || '' : '',
            locationType: item.locationType
          }))
        };

        onSave(distributionData);
        showSuccessPopup(distributionData);
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

  const showSuccessPopup = (distributionData) => {
    const groupedBoxes = distributionData.products.reduce((acc, product) => {
      if (!acc[product.boxName]) {
        acc[product.boxName] = {
          products: [],
          total: 0
        };
      }
      acc[product.boxName].products.push(product);
      acc[product.boxName].total += product.total;
      return acc;
    }, {});

    const popupDiv = document.createElement('div');
    popupDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]';

    popupDiv.innerHTML = `
      <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 class="text-2xl font-bold text-green-600">✓ Distribution Created Successfully!</h2>
          <button class="close-popup text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div class="p-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Invoice Number</p>
                <p class="text-2xl font-bold text-blue-800">${distributionData.invoice}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Total Amount</p>
                <p class="text-2xl font-bold text-green-600">${formatRupee(distributionData.totalValue)}</p>
              </div>
            </div>
          </div>
          <div class="mb-6">
            <h3 class="font-semibold text-gray-800 mb-3">Distribution Details</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><p class="text-gray-600">Type:</p><p class="font-medium capitalize">${distributionData.mode} Distribution</p></div>
              <div><p class="text-gray-600">Payment Type:</p><p class="font-medium">${distributionData.paymentType}</p></div>
              <div><p class="text-gray-600">Paid Amount:</p><p class="font-medium text-green-600">${formatRupee(distributionData.paidAmount)}</p></div>
              ${distributionData.creditAmount > 0 ? `<div><p class="text-gray-600">Credit Amount:</p><p class="font-medium text-blue-600">${formatRupee(distributionData.creditAmount)}</p></div>` : ''}
              ${distributionData.discount > 0 ? `<div><p class="text-gray-600">Discount:</p><p class="font-medium text-orange-600">${distributionData.discount}%</p></div>` : ''}
            </div>
          </div>
          <div class="flex justify-end"><button class="close-popup bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Close</button></div>
        </div>
      </div>
    `;

    document.body.appendChild(popupDiv);
    const closeButtons = popupDiv.querySelectorAll('.close-popup');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => popupDiv.remove());
    });
    popupDiv.addEventListener('click', (e) => {
      if (e.target === popupDiv) popupDiv.remove();
    });
  };

  useEffect(() => {
    if (formData.paymentType === 'paid') {
      setFormData(prev => ({ ...prev, paidAmount: 0, creditAmount: 0 }));
    }
  }, []);

  useEffect(() => {
    if (formData.paymentType === 'paid') {
      setFormData(prev => ({ ...prev, paidAmount: totals?.total || 0, creditAmount: 0 }));
    } else if (formData.paymentType === 'credit') {
      setFormData(prev => ({ ...prev, paidAmount: 0, creditAmount: totals?.total || 0 }));
    }
  }, [totals?.total, formData.paymentType]);

  const filteredOutlets = formData.storeId
    ? outlets.filter(outlet => outlet.storeId === parseInt(formData.storeId))
    : outlets;

  // Filter out products that are already selected
  const availableProducts = products.filter(
    product => !selectedProducts.some(p => p.productId === product.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {distributionMode === 'stock' ? 'New Stock Distribution' : 'Outlet Distribution'}
              </h2>
              <button
                type="button"
                onClick={handleToggleMode}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                {distributionMode === 'stock' ? (
                  <FaToggleOff className="text-gray-600 text-xl" />
                ) : (
                  <FaToggleOn className="text-blue-600 text-xl" />
                )}
                <span className="text-sm font-medium">
                  {distributionMode === 'stock' ? 'Switch to Outlet' : 'Switch to Stock'}
                </span>
              </button>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Store/Outlet Selection */}
              {distributionMode === 'stock' ? (
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
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Store (Optional) - Filter Outlets
                  </label>
                  <select
                    value={formData.storeId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    disabled={loading.stores}
                  >
                    <option value="">All Stores</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Outlet *
                  </label>
                  <select
                    value={formData.outletId}
                    onChange={(e) => handleOutletChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading.outlets}
                  >
                    <option value="">{loading.outlets ? 'Loading outlets...' : 'Choose outlet...'}</option>
                    {filteredOutlets.map(outlet => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} {outlet.Store?.name ? `(${outlet.Store.name})` : ''} - Credit: {formatRupee(outlet.creditLimit || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Products Section */}
              {selectedProducts.length > 0 && (
                <div className="border border-green-200 rounded-lg bg-green-50 p-4">
                  <h3 className="text-md font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    Selected Products ({selectedProducts.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedProducts.map((product, index) => (
                      <div key={product.id} className="bg-white border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{product.productName}</span>
                            <span className="text-xs text-gray-500 ml-2">SKU: {product.sku}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                          >
                            <FaMinus />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => handleSelectedProductChange(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              min="1"
                              max={product.maxQuantity}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Box Name</p>
                            <input
                              type="text"
                              value={product.boxName}
                              onChange={(e) => handleSelectedProductChange(index, 'boxName', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Box name"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price/Unit</p>
                            <p className="font-medium">{formatRupee(product.price)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-medium text-green-600">{formatRupee(product.total)}</p>
                          </div>
                        </div>
                        {distributionMode === 'stock' && formData.storeId && (
                          <div className="grid grid-cols-3 gap-3 mt-2 pt-2 border-t border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500">Room</p>
                              <select
                                onChange={(e) => handleSelectedProductChange(index, 'roomId', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                              >
                                <option value="">Select room</option>
                                {rooms.map(room => (
                                  <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                              </select>
                            </div>
                            {product.roomId && (
                              <div>
                                <p className="text-xs text-gray-500">Rack</p>
                                <select
                                  onChange={(e) => handleSelectedProductChange(index, 'rackId', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                >
                                  <option value="">Select rack</option>
                                  {product.availableRacks?.map(rack => (
                                    <option key={rack.id} value={rack.id}>{rack.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {product.roomId && (
                              <div>
                                <p className="text-xs text-gray-500">Freezer</p>
                                <select
                                  onChange={(e) => handleSelectedProductChange(index, 'freezerId', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                >
                                  <option value="">Select freezer</option>
                                  {product.availableFreezers?.map(freezer => (
                                    <option key={freezer.id} value={freezer.id}>{freezer.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Products Section - Initially Shown */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Available Products
                  </label>
                  <span className="text-sm text-gray-500">{availableProducts.length} products available</span>
                </div>

                {loading.products ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No products available</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {distributionMode === 'stock' && !formData.storeId 
                        ? 'Please select a store first to view inventory' 
                        : selectedProducts.length > 0 ? 'All products have been added to the distribution' : 'No products found in inventory'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Accordion Header */}
                        <div 
                          className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                            expandedProducts[product.id] ? 'bg-blue-50 border-b border-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleProductExpand(product.id)}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaBox className="text-blue-600 text-sm" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 flex-wrap gap-2">
                                <span className="font-medium text-gray-900">{product.name}</span>
                                <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Available: {product.quantity || 0}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Category: {product.Category?.name || 'Uncategorized'} | Price: {formatRupee(product.price)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {expandedProducts[product.id] ? (
                              <FaChevronUp className="text-gray-400" />
                            ) : (
                              <FaChevronDown className="text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Accordion Content - Add Product Form */}
                        {expandedProducts[product.id] && (
                          <div className="p-4 bg-white space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Quantity *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max={product.quantity || 0}
                                  value={tempQuantities[product.id] || 0}
                                  onChange={(e) => setTempQuantities(prev => ({ ...prev, [product.id]: parseInt(e.target.value) || 0 }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="Enter quantity"
                                />
                                <p className="text-xs text-gray-500 mt-1">Max available: {product.quantity || 0}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Box Name *
                                </label>
                                <input
                                  type="text"
                                  value={tempBoxNames[product.id] || ''}
                                  onChange={(e) => setTempBoxNames(prev => ({ ...prev, [product.id]: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="e.g., Box A, Package 1"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => addToSelected(product)}
                                disabled={!tempQuantities[product.id] || tempQuantities[product.id] <= 0}
                                className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                                  tempQuantities[product.id] && tempQuantities[product.id] > 0
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <FaPlus />
                                <span>Add to Distribution</span>
                              </button>
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
                      <span className="font-medium">{formatRupee(totals?.subtotal || 0)}</span>
                    </div>

                    {formData.discount > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-gray-600">Discount:</span>
                          <span className="ml-2 text-sm text-green-600">({formData.discount}%)</span>
                        </div>
                        <span className="font-medium text-green-600">-{formatRupee(totals?.discountAmount || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-blue-200 pt-3">
                      <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                      <span className="text-xl font-bold text-gray-900">{formatRupee(totals?.total || 0)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Type:</span>
                      <span className="font-medium capitalize">{formData.paymentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid Amount:</span>
                      <span className="font-medium text-green-600">{formatRupee(formData.paidAmount)}</span>
                    </div>
                    {formData.creditAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Credit Amount:</span>
                        <span className="font-medium text-blue-600">{formatRupee(formData.creditAmount)}</span>
                      </div>
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
                  disabled={(distributionMode === 'stock' && !formData.storeId) ||
                    (distributionMode === 'outlet' && !formData.outletId) ||
                    selectedProducts.length === 0 ||
                    loading.submitting}
                  className={`px-8 py-3 rounded-lg font-medium transition flex items-center space-x-2 ${((distributionMode === 'stock' && !formData.storeId) ||
                    (distributionMode === 'outlet' && !formData.outletId) ||
                    selectedProducts.length === 0 ||
                    loading.submitting)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    }`}
                >
                  {loading.submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Creating Distribution...</span>
                    </>
                  ) : (
                    <>
                      <FaTruck />
                      <span>Create Distribution</span>
                    </>
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

export default AddDistributionModal;