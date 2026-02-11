import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaBox, FaSnowflake, FaTruck, FaFileInvoice, FaMoneyBill, FaChartBar, FaWarehouse, FaEye, FaTimes, FaSave, FaSearch, FaHistory,FaSpinner} from 'react-icons/fa';
import { storage } from '../data/storage';
import axios from 'axios';
import ApiService from '../components/ApiService';

const API_BASE_URL = 'http://localhost:5001/api';

const StoreDetails = ({ onLogout }) => {  
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [activeTab, setActiveTab] = useState('infrastructure');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddRack, setShowAddRack] = useState(false);
  const [showAddFreezer, setShowAddFreezer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const clientToken = localStorage.getItem('token');

  const [newRoom, setNewRoom] = useState({ 
    name: '', 
    roomNumber: '', 
    capacity: '' 
  });
  const [newRack, setNewRack] = useState({ 
    name: '', 
    rackNumber: '', 
    roomId: '', 
    capacity: '' 
  });
  const [newFreezer, setNewFreezer] = useState({ 
    name: '', 
    freezerNumber: '', 
    roomId: '', 
    capacity: '', 
    temperature: '' 
  });
  const [productForm, setProductForm] = useState({ 
    name: '', 
    category: '',
    sku: '',
    roomId: '', 
    rackId: '', 
    freezerId: '',
    quantity: '', 
    price: '',
    minStock: '',
    status: 'In Stock',
    description: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadStoreData();
    loadCategories();
  }, [id]);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get(`/stores/${id}`,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
        if (response.success) {
        const storeData = response.data;
        const transformedStore = {
          ...storeData,
          status: storeData.isActive ? 'Active' : 'Inactive',
          manager: storeData.Manager?.name || 'Unassigned',
          totalValue: `$${response.stockValue?.toLocaleString() || '0'}`,
          totalItems: response.totalItems || 0,
          infrastructure: response.rooms || [],
          racks: response.racks || [],
          freezers: response.freezers || []
        };
        
        setStore(transformedStore);
        
        // Transform inventory data from API
        const transformedInventory = response.inventory?.map(item => ({
          id: item.id,
          product: item.Product?.name || 'Unknown Product',
          category: item.Product?.Category?.name || 'Uncategorized',
          sku: item.Product?.sku || 'N/A',
          room: item.Room?.name || 'Unassigned',
          roomId: item.roomId,
          rack: item.Rack?.name || 'Unassigned',
          rackId: item.rackId,
          freezer: item.Freezer?.name || 'Unassigned',
          freezerId: item.freezerId,
          quantity: item.quantity,
          price: item.Product?.price || 0,
          minStock: item.reorderLevel,
          status: getInventoryStatus(item.quantity, item.reorderLevel),
          description: item.Product?.description || '',
          location: getLocation(item)
        }));
        
        setInventoryData(transformedInventory || []);
        setInvoices(response.invoices || []);
              }
    } catch (error) {
      console.error('Error loading store data:', error);
      // Fallback to local storage if API fails
      const storeData = storage.getStoreById(parseInt(id));
      if (storeData) {
        setStore(storeData);
        
        const allProducts = storage.getProducts();
        const storeInventory = allProducts.filter(product => 
          product.storeId === parseInt(id)
        );
        
        const transformedInventory = storeInventory.map(product => ({
          id: product.id,
          product: product.name,
          category: product.category,
          sku: product.sku,
          room: product.room || 'Unassigned',
          rack: product.rack || 'Unassigned',
          quantity: product.stock,
          price: product.price,
          minStock: product.minStock,
          status: product.status,
          description: product.description
        }));
        
        setInventoryData(transformedInventory);
      }
      
      const allInvoices = storage.getInvoices();
      const storeInvoices = allInvoices.filter(inv => 
        inv.storeId === parseInt(id)
      );
      setInvoices(storeInvoices);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await ApiService.get(`/categories`,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback categories
      setCategories([
        // 'Beverages',
        // 'Snacks',
        // 'Frozen',
        // 'Dairy',
        // 'Bakery',
        // 'Meat',
        // 'Produce',
        // 'Canned Goods',
        // 'Cleaning Supplies',
        // 'Personal Care'
      ]);
    }
  };

  const getInventoryStatus = (quantity, reorderLevel) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getLocation = (item) => {
    if (item.Room) return `Room: ${item.Room.name}`;
    if (item.Rack) return `Rack: ${item.Rack.name}`;
    if (item.Freezer) return `Freezer: ${item.Freezer.name}`;
    return 'Unassigned';
  };

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.roomNumber || !newRoom.capacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const roomData = {
        name: newRoom.name,
        roomNumber: newRoom.roomNumber,
        storeId: parseInt(id),
        capacity: parseInt(newRoom.capacity)
      };
      
      const response = await ApiService.post(`/stores/${id}/rooms`, roomData,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response) {
        loadStoreData();
        setNewRoom({ name: '', roomNumber: '', capacity: '' });
        setShowAddRoom(false);
        alert('Room added successfully!');
      }
    } catch (error) {
      console.error('Error adding room:', error);
      alert('❌ Failed to add room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRack = async () => {
    if (!newRack.name || !newRack.rackNumber || !newRack.roomId || !newRack.capacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const rackData = {
        name: newRack.name,
        rackNumber: newRack.rackNumber,
        roomId: parseInt(newRack.roomId),
        capacity: parseInt(newRack.capacity)
      };
      
      const response = await ApiService.post(`/stores/rooms/${newRack.roomId}/racks`, rackData,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data) {
        loadStoreData();
        setNewRack({ name: '', rackNumber: '', roomId: '', capacity: '' });
        setShowAddRack(false);
        alert('Rack added successfully!');
      }
    } catch (error) {
      console.error('Error adding rack:', error);
      alert('❌ Failed to add rack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFreezer = async () => {
    if (!newFreezer.name || !newFreezer.freezerNumber || !newFreezer.roomId || !newFreezer.capacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const freezerData = {
        name: newFreezer.name,
        freezerNumber: newFreezer.freezerNumber,
        roomId: parseInt(newFreezer.roomId),
        capacity: parseInt(newFreezer.capacity),
        temperature: newFreezer.temperature || null
      };
      
      const response = await ApiService.post(`/stores/rooms/${newFreezer.roomId}/freezers`, freezerData,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response) {
        loadStoreData();
        setNewFreezer({ name: '', freezerNumber: '', roomId: '', capacity: '', temperature: '' });
        setShowAddFreezer(false);
        alert('Freezer added successfully!');
      }
    } catch (error) {
      console.error('Error adding freezer:', error);
      alert('❌ Failed to add freezer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room? This will also delete all racks and freezers in this room.')) {
      setLoading(true);
      try {
        await ApiService.delete(`/stores/rooms/${roomId}`,{
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        loadStoreData();
        alert('Room deleted successfully!');
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('❌ Failed to delete room. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteRack = async (rackId) => {
    if (window.confirm('Are you sure you want to delete this rack?')) {
      setLoading(true);
      try {
        await ApiService.delete(`/stores/racks/${rackId}`,{
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        loadStoreData();
        alert('Rack deleted successfully!');
      } catch (error) {
        console.error('Error deleting rack:', error);
        alert('❌ Failed to delete rack. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteFreezer = async (freezerId) => {
    if (window.confirm('Are you sure you want to delete this freezer?')) {
      setLoading(true);
      try {
        await ApiService.delete(`/stores/freezers/${freezerId}`,{
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        loadStoreData();
        alert('Freezer deleted successfully!');
      } catch (error) {
        console.error('Error deleting freezer:', error);
        alert('❌ Failed to delete freezer. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.quantity || !productForm.price) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      let inventoryData = {
        productId: editingProduct?.productId || 1, // In real app, get from product selection
        storeId: parseInt(id),
        quantity: parseInt(productForm.quantity),
        reorderLevel: parseInt(productForm.minStock) || 10
      };
      
      // Add location if selected
      if (productForm.roomId) inventoryData.roomId = parseInt(productForm.roomId);
      if (productForm.rackId) inventoryData.rackId = parseInt(productForm.rackId);
      if (productForm.freezerId) inventoryData.freezerId = parseInt(productForm.freezerId);
      
      if (editingProduct) {
        // Update existing inventory item
        await ApiService.put(`/inventory/${editingProduct.id}`, inventoryData,{
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        alert('Product updated successfully!');
      } else {
        // Add new inventory item
        // First, check if product exists or create new one
        const productData = {
          name: productForm.name,
          sku: productForm.sku || `SKU-${Date.now().toString().slice(-6)}`,
          description: productForm.description,
          price: parseFloat(productForm.price),
          costPrice: parseFloat(productForm.price) * 0.8, // Assuming 80% of selling price
          thresholdQuantity: parseInt(productForm.minStock) || 10,
          categoryId: productForm.category || 1,
          isActive: true
        };
        
        const productResponse = await ApiService.post(`/products`, productData,{
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (productResponse.success) {
          inventoryData.productId = productResponse.product.id;
          await ApiService.post(`/inventory`, inventoryData,{
            headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json',
            },
          });
          alert('Product added successfully!');
        }
      }
      
      loadStoreData();
      resetProductForm();
      setShowAddProduct(false);
      setShowEditProduct(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('❌ Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.product,
      category: product.category,
      sku: product.sku,
      roomId: product.roomId || '',
      rackId: product.rackId || '',
      freezerId: product.freezerId || '',
      quantity: product.quantity,
      price: product.price,
      minStock: product.minStock || 10,
      status: product.status,
      description: product.description || ''
    });
    setShowEditProduct(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      try {
        await ApiService.delete(`/inventory/${productId}`,{
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        loadStoreData();
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('❌ Failed to delete product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetProductForm = () => {
    setProductForm({ 
      name: '', 
      category: '',
      sku: '',
      roomId: '', 
      rackId: '', 
      freezerId: '',
      quantity: '', 
      price: '',
      minStock: '',
      status: 'In Stock',
      description: ''
    });
    setEditingProduct(null);
  };

  const filteredInventory = inventoryData.filter(item =>
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!store) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={onLogout} />
        <div className="flex-1 p-6">
          <div className="text-center py-12">
            <div className="text-3xl font-bold text-gray-800 mb-4">Store not found</div>
            <Link
              to="/stores"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Stores
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1">
        <Header title="Store Details" showSearch={false} />
        
        <main className="p-6">
          {/* Back Button and Store Title */}
          <div className="mb-6">
            <Link
              to="/stores"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 text-lg font-medium"
            >
              <FaArrowLeft className="mr-2" />
              Back to Stores
            </Link>
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{store.name}</h1>
              <p className="text-gray-600 text-lg">{store.address}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  store.status === 'Active' ? 'bg-green-100 text-green-800' :
                  store.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {store.status}
                </span>
                <span className="text-sm text-gray-600">
                  Manager: {store.manager || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Store Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Stock Value</p>
              <p className="text-xl font-bold text-gray-800">{store.totalValue || '$0'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-xl font-bold text-gray-800">{inventoryData.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Items</p>
              <p className="text-xl font-bold text-gray-800">{store.totalItems || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Credit Limit</p>
              <p className="text-xl font-bold text-gray-800">${parseFloat(store.creditLimit || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('infrastructure')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'infrastructure'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <FaWarehouse className="inline mr-2" />
                  Infrastructure
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'inventory'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <FaBox className="inline mr-2" />
                  Inventory ({inventoryData.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'invoices'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <FaTruck className="inline mr-2" />
                  Invoices ({invoices.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-3xl text-blue-600 mr-3" />
              <span className="text-gray-600">Loading...</span>
            </div>
          )}

          {/* Tab Content */}
          {!loading && (
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Infrastructure Tab */}
              {activeTab === 'infrastructure' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Infrastructure Management</h2>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowAddRoom(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                        disabled={loading}
                      >
                        <FaPlus />
                        <span>Add Room</span>
                      </button>
                      <button
                        onClick={() => setShowAddRack(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                        disabled={loading}
                      >
                        <FaPlus />
                        <span>Add Rack</span>
                      </button>
                      <button
                        onClick={() => setShowAddFreezer(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
                        disabled={loading}
                      >
                        <FaPlus />
                        <span>Add Freezer</span>
                      </button>
                    </div>
                  </div>

                  {/* Rooms Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Rooms ({store.infrastructure?.length || 0})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {store.infrastructure && store.infrastructure.length > 0 ? (
                        store.infrastructure.map((room) => (
                          <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-gray-800">{room.name}</h4>
                                <p className="text-sm text-gray-500">Room #{room.roomNumber}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteRoom(room.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                                title="Delete Room"
                                disabled={loading}
                              >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                              </button>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-gray-600">Capacity</p>
                                <p className="font-medium">{room.capacity} units</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Current Occupancy</p>
                                <p className="font-medium">{room.currentOccupancy} units</p>
                              </div>
                            </div>
                            
                            {/* Racks in this room */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Racks:</h5>
                              {store.racks && store.racks.filter(rack => rack.roomId === room.id).length > 0 ? (
                                <div className="space-y-2">
                                  {store.racks.filter(rack => rack.roomId === room.id).map((rack) => (
                                    <div key={rack.id} className="text-sm bg-gray-50 p-2 rounded">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">{rack.name}</p>
                                          <p className="text-gray-600">Rack #{rack.rackNumber}</p>
                                          <p className="text-gray-500 text-xs">
                                            Capacity: {rack.capacity} units
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteRack(rack.id)}
                                          className="text-red-600 hover:text-red-800"
                                          disabled={loading}
                                        >
                                          {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaTrash className="text-xs" />}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No racks in this room</p>
                              )}
                            </div>

                            {/* Freezers in this room */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <FaSnowflake className="text-blue-600 mr-1" />
                                Freezers:
                              </h5>
                              {store.freezers && store.freezers.filter(freezer => freezer.roomId === room.id).length > 0 ? (
                                <div className="space-y-2">
                                  {store.freezers.filter(freezer => freezer.roomId === room.id).map((freezer) => (
                                    <div key={freezer.id} className="text-sm bg-blue-50 p-2 rounded">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">{freezer.name}</p>
                                          <p className="text-gray-600">Freezer #{freezer.freezerNumber}</p>
                                          <p className="text-gray-500 text-xs">
                                            Capacity: {freezer.capacity} units
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteFreezer(freezer.id)}
                                          className="text-red-600 hover:text-red-800"
                                          disabled={loading}
                                        >
                                          {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaTrash className="text-xs" />}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No freezers in this room</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8 border border-dashed border-gray-300 rounded-lg">
                          <FaWarehouse className="text-4xl text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No rooms added yet</p>
                          <p className="text-sm text-gray-500 mt-2">Add your first room to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                    <button
                      onClick={() => {
                        resetProductForm();
                        setShowAddProduct(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                    >
                      <FaPlus />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {/* Inventory Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCT</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOCATION</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QUANTITY</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInventory.length > 0 ? (
                          filteredInventory.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{item.product}</div>
                                <div className="text-xs text-gray-500">{item.description?.substring(0, 50)}...</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">{item.category}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">{item.sku}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">{item.location}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">{item.quantity} units</div>
                                <div className="text-xs text-gray-500">Min: {item.minStock}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">${item.price}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                                  item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                                  item.status === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEditProduct(item)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center">
                              <div className="text-gray-500">
                                {searchTerm ? 'No products found matching your search' : 'No products available'}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-800">{inventoryData.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">In Stock</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {inventoryData.filter(p => p.status === 'In Stock').length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Low Stock</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {inventoryData.filter(p => p.status === 'Low Stock').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Tab */}
              {activeTab === 'invoices' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Invoice History</h2>
                    <Link
                      to="/invoice/create"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                    >
                      <FaPlus />
                      <span>New Invoice</span>
                    </Link>
                  </div>
                  
                  {/* Invoice Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INVOICE NUMBER</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL AMOUNT</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYMENT METHOD</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInvoices.length > 0 ? (
                          filteredInvoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">
                                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900 capitalize">{invoice.type}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">${parseFloat(invoice.totalAmount || 0).toLocaleString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.paymentMethod === 'paid' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {invoice.paymentMethod}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-8 text-center">
                              <div className="text-gray-500">
                                {searchTerm ? 'No invoices found matching your search' : 'No invoice history available'}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Summary */}
                  <div className="mt-6 grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ${invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {invoices.filter(d => d.status === 'completed').length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {invoices.filter(d => d.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Link
              to={`/stores/edit/${store.id}`}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition text-center font-medium flex items-center justify-center space-x-2"
            >
              <FaEdit />
              <span>Edit Store</span>
            </Link>
            <Link
              to="/invoice/create"
              className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition text-center font-medium flex items-center justify-center space-x-2"
            >
              <FaTruck />
              <span>Stock Distribution</span>
            </Link>
            <Link
              to="/invoices"
              className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition text-center font-medium flex items-center justify-center space-x-2"
            >
              <FaFileInvoice />
              <span>Invoice Management</span>
            </Link>
            <Link
              to="/expenditures"
              className="bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition text-center font-medium flex items-center justify-center space-x-2"
            >
              <FaMoneyBill />
              <span>Expenditures</span>
            </Link>
            <Link
              to="/reports"
              className="bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition text-center font-medium flex items-center justify-center space-x-2"
            >
              <FaChartBar />
              <span>Reports & Analytics</span>
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this store?')) {
                  storage.deleteStore(store.id);
                  navigate('/stores');
                }
              }}
              className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition text-center font-medium flex items-center justify-center space-x-2"
            >
              <FaTrash />
              <span>Delete Store</span>
            </button>
            <button
              onClick={onLogout}
              className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition text-center font-medium flex items-center justify-center space-x-2"
            >
              <span>Logout</span>
            </button>
          </div>
        </main>
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddProduct || showEditProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setShowEditProduct(false);
                  resetProductForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter SKU"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat} value={cat.id || cat}>
                        {cat.name || cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Room */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room
                  </label>
                  <select
                    value={productForm.roomId}
                    onChange={(e) => setProductForm({...productForm, roomId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Room</option>
                    {store.infrastructure?.map((room) => (
                      <option key={room.id} value={room.id}>{room.name} (#{room.roomNumber})</option>
                    ))}
                  </select>
                </div>

                {/* Rack */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rack
                  </label>
                  <select
                    value={productForm.rackId}
                    onChange={(e) => setProductForm({...productForm, rackId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Rack</option>
                    {store.racks?.map((rack) => (
                      <option key={rack.id} value={rack.id}>{rack.name} (#{rack.rackNumber})</option>
                    ))}
                  </select>
                </div>

                {/* Freezer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freezer
                  </label>
                  <select
                    value={productForm.freezerId}
                    onChange={(e) => setProductForm({...productForm, freezerId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Freezer</option>
                    {store.freezers?.map((freezer) => (
                      <option key={freezer.id} value={freezer.id}>{freezer.name} (#{freezer.freezerNumber})</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                {/* Min Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({...productForm, minStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                  rows="3"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    setShowEditProduct(false);
                    resetProductForm();
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Room</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ARK Room 1"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., R-001"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (units) *
                </label>
                <input
                  type="number"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 300"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddRoom}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : null}
                <span>{loading ? 'Adding...' : 'Add Room'}</span>
              </button>
              <button
                onClick={() => setShowAddRoom(false)}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {showAddRack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Rack</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rack Name *
                </label>
                <input
                  type="text"
                  value={newRack.name}
                  onChange={(e) => setNewRack({...newRack, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ARK Rack A"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rack Number *
                </label>
                <input
                  type="text"
                  value={newRack.rackNumber}
                  onChange={(e) => setNewRack({...newRack, rackNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., RA-01"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room *
                </label>
                <select
                  value={newRack.roomId}
                  onChange={(e) => setNewRack({...newRack, roomId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Room</option>
                  {store.infrastructure?.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (#{room.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (units) *
                </label>
                <input
                  type="number"
                  value={newRack.capacity}
                  onChange={(e) => setNewRack({...newRack, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddRack}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : null}
                <span>{loading ? 'Adding...' : 'Add Rack'}</span>
              </button>
              <button
                onClick={() => setShowAddRack(false)}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Freezer Modal */}
      {showAddFreezer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Freezer</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Freezer Name *
                </label>
                <input
                  type="text"
                  value={newFreezer.name}
                  onChange={(e) => setNewFreezer({...newFreezer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ARK Freezer A"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Freezer Number *
                </label>
                <input
                  type="text"
                  value={newFreezer.freezerNumber}
                  onChange={(e) => setNewFreezer({...newFreezer, freezerNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room *
                </label>
                <select
                  value={newFreezer.roomId}
                  onChange={(e) => setNewFreezer({...newFreezer, roomId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Room</option>
                  {store.infrastructure?.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (#{room.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="text"
                  value={newFreezer.temperature}
                  onChange={(e) => setNewFreezer({...newFreezer, temperature: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., -18°C"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (units) *
                </label>
                <input
                  type="number"
                  value={newFreezer.capacity}
                  onChange={(e) => setNewFreezer({...newFreezer, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddFreezer}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : null}
                <span>{loading ? 'Adding...' : 'Add Freezer'}</span>
              </button>
              <button
                onClick={() => setShowAddFreezer(false)}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreDetails;