import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import AddProductModal from '../components/AddProductModal';
import ApiService from '../components/ApiService';

const ProductManagement = ({ onLogout }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [allCategories, setAllCategories] = useState([]); // For category dropdown in modal
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const clientToken = localStorage.getItem('token');
  useEffect(() => {
    loadProducts();
    loadStats();
    loadAllCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get('/products',{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.products) {
        // Transform API data to match your existing format
        const transformedProducts = response.products.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          HSN_No: product.HSN_No,
          description: product.description || '',
          category: product.Category?.name || 'Uncategorized',
          price: parseFloat(product.price),
          costPrice: parseFloat(product.costPrice),
          stock: parseInt(product.quantity),
          minStock: parseInt(product.thresholdQuantity),
          status: getProductStatus(product.quantity, product.thresholdQuantity),
          image: product.image,
          isActive: product.isActive,
          categoryId: product.categoryId,
          units:product.units,
          IGST: parseInt(product.IGST),
          SGST: parseInt(product.SGST),
          CGST: parseInt(product.CGST)
  
        }));
        
        setProducts(transformedProducts);
        
        // Extract unique categories
        const uniqueCategories = ['All'];
        response.products.forEach(product => {
          if (product.Category?.name && !uniqueCategories.includes(product.Category.name)) {
            uniqueCategories.push(product.Category.name);
          }
        });
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllCategories = async () => {
    
    try {
      // Assuming you have a categories endpoint
      const response = await ApiService.get('/categories',{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      setAllCategories(response.categories || data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      // If categories endpoint doesn't exist, we'll handle it in the modal
    }
  };

  const loadStats = async () => {
    try {
      const response = await ApiService.get('/products/admin/allCount',{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      setStats({
        total: response.totalProducts || 0,
        inStock: response.inStockProducts || 0,
        lowStock: response.lowStockProducts || 0,
        outOfStock: response.outOfStockProducts || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getProductStatus = (quantity, threshold) => {
    const qty = parseInt(quantity);
    const thr = parseInt(threshold);
    if (qty <= 0) return 'Out of Stock';
    if (qty <= thr) return 'Low Stock';
    return 'In Stock';
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      // Make API call to delete product
      await ApiService.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Reload data
      loadProducts();
      loadStats();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      // Prepare the request payload based on your API specification
      const productPayload = {
        name: productData.name.trim(),
        sku: productData.sku.trim(),
        categoryId: parseInt(productData.categoryId),
        quantity: parseInt(productData.quantity),
        price: parseFloat(productData.price),
        costPrice: parseFloat(productData.costPrice || 0),
        thresholdQuantity: parseInt(productData.thresholdQuantity),
        HSN_No: productData.HSN_No,
        units:productData.units,
        IGST: parseInt(productData.IGST),
        SGST: parseInt(productData.SGST),
        CGST: parseInt(productData.CGST)

      };
      

      // Add description if it exists
      if (productData.description && productData.description.trim()) {
        productPayload.description = productData.description.trim();
      }
      let response;
      
      if (editingProduct) {
        // Update existing product
        response = await ApiService.put(`/products/${editingProduct.id}`,productPayload, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        // Add new product
        response = await ApiService.post('/products',productPayload, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      
      if (!response) {
        throw new Error(response.message || 'Failed to save product');
      }
      
      // Reload data
      await loadProducts();
      await loadStats();
      setShowModal(false);
      setEditingProduct(null);
      
    } catch (error) {
      console.error('Error saving product:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col">
        <Header title="Product Management" />
        
        <div className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Manage products available system-wide</h1>
              <button
                onClick={handleAddProduct}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
                <span>Add Product</span>
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Total Products</div>
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">In Stock</div>
                <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Low Stock</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Out of Stock</div>
                <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Products Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STOCK</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IGST</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGST</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SGST</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                          <p className="mt-2 text-gray-500">Loading products...</p>
                        </td>
                      </tr>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.HSN_No}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">${product.price.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.stock} units
                              <div className="text-xs text-gray-500">Min: {product.minStock}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.IGST}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.CGST}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.SGST}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(product.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-gray-400 mb-2">No products found</div>
                          <div className="text-gray-500 text-sm">Try adjusting your search or add a new product</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <AddProductModal
          product={editingProduct}
          categories={allCategories} // Pass categories to modal for dropdown
          onSave={handleSaveProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;