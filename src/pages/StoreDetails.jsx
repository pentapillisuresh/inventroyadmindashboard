import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaBox, 
  FaSnowflake, 
  FaTruck,
  FaFileInvoice,
  FaMoneyBill,
  FaChartBar,
  FaWarehouse,
  FaEye,
  FaTimes,
  FaSave,
  FaSearch,
  FaHistory
} from 'react-icons/fa';
import { storage } from '../data/storage';

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
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', items: 0 });
  const [newRack, setNewRack] = useState({ name: '', location: '', items: '', capacity: '' });
  const [newFreezer, setNewFreezer] = useState({ name: '', temp: '', capacity: '', items: 0 });
  const [productForm, setProductForm] = useState({ 
    name: '', 
    category: '',
    sku: '',
    room: '', 
    rack: '', 
    quantity: '', 
    price: '',
    minStock: '',
    status: 'In Stock',
    description: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [categories] = useState([
    'Beverages',
    'Snacks',
    'Frozen',
    'Dairy',
    'Bakery',
    'Meat',
    'Produce',
    'Canned Goods',
    'Cleaning Supplies',
    'Personal Care'
  ]);

  useEffect(() => {
    loadStoreData();
    loadDistributions();
  }, [id]);

  const loadStoreData = () => {
    const storeData = storage.getStoreById(parseInt(id));
    if (storeData) {
      setStore(storeData);
      
      // Load products and create inventory data
      const allProducts = storage.getProducts();
      const storeInventory = allProducts.filter(product => 
        product.storeId === parseInt(id) || 
        (storeData.infrastructure && storeData.infrastructure.some(room => room.name === product.room))
      );
      
      // Transform products into inventory format
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
  };

  const loadDistributions = () => {
    const allDistributions = storage.getDistributions();
    const storeDistributions = allDistributions.filter(dist => 
      dist.storeId === parseInt(id)
    );
    setDistributions(storeDistributions);
  };

  const handleAddRoom = () => {
    if (!newRoom.name || !newRoom.capacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    const addedRoom = storage.addRoom(parseInt(id), {
      name: newRoom.name,
      capacity: newRoom.capacity,
      items: parseInt(newRoom.items) || 0
    });
    
    if (addedRoom) {
      loadStoreData();
      setNewRoom({ name: '', capacity: '', items: 0 });
      setShowAddRoom(false);
      alert('Room added successfully!');
    }
  };

  const handleAddRack = () => {
    if (!newRack.name || !newRack.location || !newRack.items || !newRack.capacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    const addedRack = storage.addRack(parseInt(id), {
      name: newRack.name,
      location: newRack.location,
      items: newRack.items,
      capacity: newRack.capacity
    });
    
    if (addedRack) {
      loadStoreData();
      setNewRack({ name: '', location: '', items: '', capacity: '' });
      setShowAddRack(false);
      alert('Rack added successfully!');
    }
  };

  const handleAddFreezer = () => {
    if (!newFreezer.name || !newFreezer.temp || !newFreezer.capacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    const addedFreezer = storage.addFreezer(parseInt(id), {
      name: newFreezer.name,
      temp: newFreezer.temp,
      capacity: newFreezer.capacity,
      items: parseInt(newFreezer.items) || 0
    });
    
    if (addedFreezer) {
      loadStoreData();
      setNewFreezer({ name: '', temp: '', capacity: '', items: 0 });
      setShowAddFreezer(false);
      alert('Freezer added successfully!');
    }
  };

  const handleDeleteRoom = (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      storage.deleteRoom(parseInt(id), roomId);
      loadStoreData();
      alert('Room deleted successfully!');
    }
  };

  const handleDeleteRack = (rackId) => {
    if (window.confConfirm('Are you sure you want to delete this rack?')) {
      storage.deleteRack(parseInt(id), rackId);
      loadStoreData();
      alert('Rack deleted successfully!');
    }
  };

  const handleDeleteFreezer = (freezerId) => {
    if (window.confirm('Are you sure you want to delete this freezer?')) {
      storage.deleteFreezer(parseInt(id), freezerId);
      loadStoreData();
      alert('Freezer deleted successfully!');
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.category || !productForm.quantity || !productForm.price) {
      alert('Please fill in all required fields');
      return;
    }
    
    const productData = {
      name: productForm.name,
      category: productForm.category,
      sku: productForm.sku || `SKU-${Date.now().toString().slice(-6)}`,
      room: productForm.room,
      rack: productForm.rack,
      stock: parseInt(productForm.quantity),
      price: parseFloat(productForm.price),
      minStock: parseInt(productForm.minStock) || 10,
      status: productForm.status,
      description: productForm.description,
      storeId: parseInt(id),
      storeName: store?.name
    };
    
    if (editingProduct) {
      // Update existing product
      storage.updateProduct(editingProduct.id, {
        ...productData,
        id: editingProduct.id
      });
      alert('Product updated successfully!');
    } else {
      // Add new product
      storage.addProduct(productData);
      alert('Product added successfully!');
    }
    
    loadStoreData();
    resetProductForm();
    setShowAddProduct(false);
    setShowEditProduct(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.product,
      category: product.category,
      sku: product.sku,
      room: product.room,
      rack: product.rack,
      quantity: product.quantity,
      price: product.price,
      minStock: product.minStock || 10,
      status: product.status,
      description: product.description || ''
    });
    setShowEditProduct(true);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      storage.deleteProduct(productId);
      loadStoreData();
      alert('Product deleted successfully!');
    }
  };

  const resetProductForm = () => {
    setProductForm({ 
      name: '', 
      category: '',
      sku: '',
      room: '', 
      rack: '', 
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

  const filteredDistributions = distributions.filter(dist =>
    dist.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dist.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dist.products.some(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <p className="text-sm text-gray-600 mb-1">Capacity</p>
              <p className="text-xl font-bold text-gray-800">{store.capacity || '5000 sq ft'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Stock Value</p>
              <p className="text-xl font-bold text-gray-800">${store.totalValue?.replace('$', '') || '45,200'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-xl font-bold text-gray-800">{inventoryData.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Items</p>
              <p className="text-xl font-bold text-gray-800">{store.totalItems || 0}</p>
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
                >
                  <FaBox className="inline mr-2" />
                  Inventory ({inventoryData.length})
                </button>
                <button
                  onClick={() => setActiveTab('distribution')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'distribution'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FaTruck className="inline mr-2" />
                  Distribution ({distributions.length})
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
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Tab Content */}
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
                    >
                      <FaPlus />
                      <span>Add Room</span>
                    </button>
                    <button
                      onClick={() => setShowAddRack(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                    >
                      <FaPlus />
                      <span>Add Rack</span>
                    </button>
                    <button
                      onClick={() => setShowAddFreezer(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
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
                            <h4 className="font-medium text-gray-800">{room.name}</h4>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Delete Room"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-600">Capacity</p>
                              <p className="font-medium">{room.capacity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Items</p>
                              <p className="font-medium">{room.items}</p>
                            </div>
                          </div>
                          
                          {/* Racks in this room */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Racks:</h5>
                            {store.racks && store.racks.filter(rack => rack.location === room.name).length > 0 ? (
                              <div className="space-y-2">
                                {store.racks.filter(rack => rack.location === room.name).map((rack) => (
                                  <div key={rack.id} className="text-sm bg-gray-50 p-2 rounded">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">{rack.name}</p>
                                        <p className="text-gray-600">Items: {rack.items}</p>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteRack(rack.id)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <FaTrash className="text-xs" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No racks in this room</p>
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

                {/* Freezers Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaSnowflake className="text-blue-600 mr-2" />
                    Freezers ({store.freezers?.length || 0})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {store.freezers && store.freezers.length > 0 ? (
                      store.freezers.map((freezer) => (
                        <div key={freezer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-800">{freezer.name}</h4>
                            <button
                              onClick={() => handleDeleteFreezer(freezer.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Delete Freezer"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Temperature</p>
                              <p className="font-medium">{freezer.temp}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Capacity</p>
                              <p className="font-medium">{freezer.capacity}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-gray-600">Items</p>
                              <p className="font-medium">{freezer.items}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        <FaSnowflake className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No freezers added yet</p>
                        <p className="text-sm text-gray-500 mt-2">Add your first freezer to get started</p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROOM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RACK</th>
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
                              <div className="text-gray-900">{item.room}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">{item.rack}</div>
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
                          <td colSpan="9" className="px-6 py-8 text-center">
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

            {/* Distribution History Tab */}
            {activeTab === 'distribution' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Distribution History</h2>
                  <Link
                    to="/distributions/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                  >
                    <FaPlus />
                    <span>New Distribution</span>
                  </Link>
                </div>
                
                {/* Distribution Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DISTRIBUTION ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCTS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL ITEMS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL VALUE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYMENT TYPE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDistributions.length > 0 ? (
                        filteredDistributions.map((dist) => (
                          <tr key={dist.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{dist.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">{new Date(dist.date).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-gray-900">
                                {dist.products.slice(0, 2).map(p => p.productName).join(', ')}
                                {dist.products.length > 2 && '...'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {dist.products.length} products
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">{dist.totalItems}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">${dist.totalValue.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                dist.paymentType === 'Paid' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {dist.paymentType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                dist.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                dist.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                                dist.status === 'Pending' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {dist.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center">
                            <div className="text-gray-500">
                              {searchTerm ? 'No distributions found matching your search' : 'No distribution history available'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Distribution Summary */}
                <div className="mt-6 grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Distributions</p>
                    <p className="text-2xl font-bold text-gray-800">{distributions.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ${distributions.reduce((sum, dist) => sum + dist.totalValue, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {distributions.filter(d => d.status === 'Completed').length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {distributions.filter(d => d.status === 'Pending').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
              to="/distributions/create"
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
                      <option key={cat} value={cat}>{cat}</option>
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
                    value={productForm.room}
                    onChange={(e) => setProductForm({...productForm, room: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Room</option>
                    {store.infrastructure?.map((room) => (
                      <option key={room.id} value={room.name}>{room.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rack */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rack
                  </label>
                  <select
                    value={productForm.rack}
                    onChange={(e) => setProductForm({...productForm, rack: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Rack</option>
                    {store.racks?.map((rack) => (
                      <option key={rack.id} value={rack.name}>{rack.name}</option>
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

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({...productForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
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
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
                >
                  <FaSave />
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
                  placeholder="e.g., Storage Room C"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="text"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1000 sq ft"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items
                </label>
                <input
                  type="number"
                  value={newRoom.items}
                  onChange={(e) => setNewRoom({...newRoom, items: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 100"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddRoom}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
              >
                Add Room
              </button>
              <button
                onClick={() => setShowAddRoom(false)}
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
                  placeholder="e.g., Rack C1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Room) *
                </label>
                <select
                  value={newRack.location}
                  onChange={(e) => setNewRack({...newRack, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Room</option>
                  {store.infrastructure?.map((room) => (
                    <option key={room.id} value={room.name}>{room.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items *
                </label>
                <input
                  type="text"
                  value={newRack.items}
                  onChange={(e) => setNewRack({...newRack, items: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 45 / 50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (units) *
                </label>
                <input
                  type="text"
                  value={newRack.capacity}
                  onChange={(e) => setNewRack({...newRack, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 50"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddRack}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
              >
                Add Rack
              </button>
              <button
                onClick={() => setShowAddRack(false)}
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
                  placeholder="e.g., Freezer 3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature *
                </label>
                <input
                  type="text"
                  value={newFreezer.temp}
                  onChange={(e) => setNewFreezer({...newFreezer, temp: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., -18°C"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="text"
                  value={newFreezer.capacity}
                  onChange={(e) => setNewFreezer({...newFreezer, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200 cu ft"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items
                </label>
                <input
                  type="number"
                  value={newFreezer.items}
                  onChange={(e) => setNewFreezer({...newFreezer, items: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 50"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddFreezer}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
              >
                Add Freezer
              </button>
              <button
                onClick={() => setShowAddFreezer(false)}
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