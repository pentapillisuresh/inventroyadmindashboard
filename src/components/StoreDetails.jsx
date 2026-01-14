import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  FaWarehouse
} from 'react-icons/fa';
import { storage } from '../data/storage';

const StoreDetails = ({ onLogout }) => {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [activeTab, setActiveTab] = useState('infrastructure');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddRack, setShowAddRack] = useState(false);
  const [showAddFreezer, setShowAddFreezer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', items: 0 });
  const [newRack, setNewRack] = useState({ name: '', location: '', items: '', capacity: '' });
  const [newFreezer, setNewFreezer] = useState({ name: '', temp: '', capacity: '', items: 0 });
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    room: '', 
    rack: '', 
    quantity: '', 
    status: 'In Stock' 
  });

  // Sample distribution history data
  const distributionHistory = [
    { id: 'DIST-001', date: '2024-01-15', products: '12 items', totalValue: '$2450.00', status: 'Completed' },
    { id: 'DIST-002', date: '2024-01-14', products: '8 items', totalValue: '$1820.50', status: 'Completed' },
    { id: 'DIST-003', date: '2024-01-12', products: '20 items', totalValue: '$4100.00', status: 'Completed' },
    { id: 'DIST-004', date: '2024-01-10', products: '15 items', totalValue: '$3200.00', status: 'Completed' },
  ];

  // Sample inventory data
  const inventoryData = [
    { product: 'Coca Cola 500ml', room: 'Storage Room A', rack: 'Rack A1', quantity: '150 units', status: 'In Stock' },
    { product: 'Pepsi 500ml', room: 'Storage Room A', rack: 'Rack A2', quantity: '120 units', status: 'In Stock' },
    { product: 'Sprite 500ml', room: 'Storage Room B', rack: 'Rack B1', quantity: '45 units', status: 'Low Stock' },
    { product: 'Lays Chips', room: 'Storage Room A', rack: 'Rack A1', quantity: '200 units', status: 'In Stock' },
    { product: 'Doritos', room: 'Storage Room B', rack: 'Rack B1', quantity: '85 units', status: 'In Stock' },
    { product: 'Ice Cream', room: 'Cold Storage', rack: 'Freezer 1', quantity: '30 units', status: 'Critical' },
    { product: 'Frozen Pizza', room: 'Cold Storage', rack: 'Freezer 2', quantity: '65 units', status: 'In Stock' },
  ];

  useEffect(() => {
    const storeData = storage.getStoreById(parseInt(id));
    if (storeData) {
      setStore(storeData);
    }
  }, [id]);

  const handleAddRoom = () => {
    if (!newRoom.name || !newRoom.capacity) return;
    
    const addedRoom = storage.addRoom(store.id, {
      name: newRoom.name,
      capacity: newRoom.capacity,
      items: parseInt(newRoom.items) || 0
    });
    
    if (addedRoom) {
      const updatedStore = storage.getStoreById(store.id);
      setStore(updatedStore);
      setNewRoom({ name: '', capacity: '', items: 0 });
      setShowAddRoom(false);
    }
  };

  const handleAddRack = () => {
    if (!newRack.name || !newRack.location || !newRack.items || !newRack.capacity) return;
    
    const addedRack = storage.addRack(store.id, {
      name: newRack.name,
      location: newRack.location,
      items: newRack.items,
      capacity: newRack.capacity
    });
    
    if (addedRack) {
      const updatedStore = storage.getStoreById(store.id);
      setStore(updatedStore);
      setNewRack({ name: '', location: '', items: '', capacity: '' });
      setShowAddRack(false);
    }
  };

  const handleAddFreezer = () => {
    if (!newFreezer.name || !newFreezer.temp || !newFreezer.capacity) return;
    
    const addedFreezer = storage.addFreezer(store.id, {
      name: newFreezer.name,
      temp: newFreezer.temp,
      capacity: newFreezer.capacity,
      items: parseInt(newFreezer.items) || 0
    });
    
    if (addedFreezer) {
      const updatedStore = storage.getStoreById(store.id);
      setStore(updatedStore);
      setNewFreezer({ name: '', temp: '', capacity: '', items: 0 });
      setShowAddFreezer(false);
    }
  };

  const handleDeleteRoom = (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      storage.deleteRoom(store.id, roomId);
      const updatedStore = storage.getStoreById(store.id);
      setStore(updatedStore);
    }
  };

  const handleDeleteRack = (rackId) => {
    if (window.confirm('Are you sure you want to delete this rack?')) {
      storage.deleteRack(store.id, rackId);
      const updatedStore = storage.getStoreById(store.id);
      setStore(updatedStore);
    }
  };

  const handleDeleteFreezer = (freezerId) => {
    if (window.confirm('Are you sure you want to delete this freezer?')) {
      storage.deleteFreezer(store.id, freezerId);
      const updatedStore = storage.getStoreById(store.id);
      setStore(updatedStore);
    }
  };

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
        <Header title="Store Details" showSearch={true} />
        
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
              <p className="text-xl font-bold text-gray-800">{store.stockValue || '$45,200'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Manager</p>
              <p className="text-xl font-bold text-gray-800">{store.manager || 'John Smith'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Items</p>
              <p className="text-xl font-bold text-gray-800">{store.totalItems || 1245}</p>
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
                  Inventory
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
                  Distribution History
                </button>
              </nav>
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Rooms</h3>
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
                    Freezers
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
                    onClick={() => setShowAddProduct(true)}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROOM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RACK/FREEZER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QUANTITY</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{item.product}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{item.room}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{item.rack}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                              item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Distribution History Tab */}
            {activeTab === 'distribution' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Distribution History</h2>
                
                {/* Distribution Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DISTRIBUTION ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCTS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL VALUE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {distributionHistory.map((dist) => (
                        <tr key={dist.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{dist.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{dist.date}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{dist.products}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{dist.totalValue}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {dist.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <button className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition text-center font-medium flex items-center justify-center space-x-2">
              <FaEdit />
              <span>Edit Store</span>
            </button>
            <button className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition text-center font-medium flex items-center justify-center space-x-2">
              <FaTruck />
              <span>Stock Distribution</span>
            </button>
            <button className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition text-center font-medium flex items-center justify-center space-x-2">
              <FaFileInvoice />
              <span>Invoice Management</span>
            </button>
            <button className="bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition text-center font-medium flex items-center justify-center space-x-2">
              <FaMoneyBill />
              <span>Expenditures</span>
            </button>
            <button className="bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition text-center font-medium flex items-center justify-center space-x-2">
              <FaChartBar />
              <span>Reports & Analytics</span>
            </button>
            <button className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition text-center font-medium flex items-center justify-center space-x-2">
              <FaTrash />
              <span>Delete Store</span>
            </button>
            <button className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition text-center font-medium flex items-center justify-center space-x-2">
              <span>Logout</span>
            </button>
          </div>
        </main>
      </div>

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
                  {store.infrastructure && store.infrastructure.map((room) => (
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