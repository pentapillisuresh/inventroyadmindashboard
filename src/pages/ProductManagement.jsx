import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
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
  const [allCategories, setAllCategories] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const clientToken = localStorage.getItem('token');

  // Load products with pagination
  const loadProducts = useCallback(
    async (page = 1) => {
      setLoading(true);

      try {
        const response = await ApiService.get(
          `/products?page=${page}&limit=${itemsPerPage}`,
          {
            headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.products) {
          // Transform API data to match your existing format
          const transformedProducts = response.products.map((product) => ({
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
            status: getProductStatus(
              product.quantity,
              product.thresholdQuantity
            ),
            image: product.image,
            isActive: product.isActive,
            categoryId: product.categoryId,
            units: product.units,
            IGST: parseInt(product.IGST),
            SGST: parseInt(product.SGST),
            CGST: parseInt(product.CGST)
          }));

          setProducts(transformedProducts);

          setTotalItems(
            response.total ||
              response.count ||
              transformedProducts.length
          );

          setTotalPages(
            response.totalPages ||
              Math.ceil(
                (response.total || transformedProducts.length) /
                  itemsPerPage
              )
          );

          setCurrentPage(page);

          // Extract unique categories
          if (page === 1) {
            const uniqueCategories = ['All'];

            response.products.forEach((product) => {
              if (
                product.Category?.name &&
                !uniqueCategories.includes(product.Category.name)
              ) {
                uniqueCategories.push(product.Category.name);
              }
            });

            setCategories(uniqueCategories);
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    },
    [clientToken, itemsPerPage]
  );

  const loadAllCategories = async () => {
    try {
      const response = await ApiService.get('/categories', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });

      setAllCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ApiService.get(
        '/products/admin/allCount',
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  useEffect(() => {
    loadProducts(1);
    loadStats();
    loadAllCategories();
  }, [loadProducts]);

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
      await ApiService.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });

      loadProducts(currentPage);
      loadStats();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      const productPayload = {
        name: productData.name.trim(),
        sku: productData.sku.trim(),
        categoryId: parseInt(productData.categoryId),
        quantity: parseInt(productData.quantity),
        price: parseFloat(productData.price),
        costPrice: parseFloat(productData.costPrice || 0),
        thresholdQuantity: parseInt(
          productData.thresholdQuantity
        ),
        HSN_No: productData.HSN_No,
        units: productData.units,
        IGST: parseInt(productData.IGST),
        SGST: parseInt(productData.SGST),
        CGST: parseInt(productData.CGST)
      };

      if (
        productData.description &&
        productData.description.trim()
      ) {
        productPayload.description =
          productData.description.trim();
      }

      if (editingProduct) {
        await ApiService.put(
          `/products/${editingProduct.id}`,
          productPayload,
          {
            headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        await ApiService.post(
          '/products',
          productPayload,
          {
            headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      loadProducts(currentPage);
      loadStats();

      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';

      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';

      case 'Out of Stock':
        return 'bg-red-100 text-red-800';

      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      loadProducts(page);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadProducts(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadProducts(currentPage + 1);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.sku
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate pagination range
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );

    let endPage = Math.min(
      totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(
        1,
        endPage - maxVisiblePages + 1
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">

      {/* Custom Scrollbar Styles */}
      <style>{`
        /* Main Product Page Vertical Scrollbar */
        .custom-product-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .custom-product-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-product-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }

        .custom-product-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }

        .custom-product-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Table Horizontal Scrollbar */
        .custom-table-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }

        .custom-table-scrollbar::-webkit-scrollbar {
          height: 8px;
        }

        .custom-table-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }

        .custom-table-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }

        .custom-table-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* FIXED SIDEBAR */}
      <div className="flex-shrink-0 h-screen">
        <Sidebar onLogout={onLogout} />
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">

        {/* FIXED HEADER */}
        <Header title="Product Management" />

        {/* ONLY THIS AREA SCROLLS VERTICALLY */}
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-product-scrollbar">

          <div className="mb-8">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Manage products available system-wide
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  Manage your products, inventory and pricing
                </p>
              </div>

              <button
                onClick={handleAddProduct}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FaPlus />
                <span>Add Product</span>
              </button>

            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">

              {/* Total */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">

                <div className="flex items-center justify-between">

                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Total Products
                    </div>

                    <div className="text-2xl font-bold text-gray-800">
                      {stats.total}
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {stats.total}
                    </span>
                  </div>

                </div>

              </div>

              {/* In Stock */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">

                <div className="flex items-center justify-between">

                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      In Stock
                    </div>

                    <div className="text-2xl font-bold text-green-600">
                      {stats.inStock}
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <span className="text-green-600 font-bold">
                      ✓
                    </span>
                  </div>

                </div>

              </div>

              {/* Low Stock */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">

                <div className="flex items-center justify-between">

                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Low Stock
                    </div>

                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.lowStock}
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">
                      !
                    </span>
                  </div>

                </div>

              </div>

              {/* Out of Stock */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">

                <div className="flex items-center justify-between">

                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Out of Stock
                    </div>

                    <div className="text-2xl font-bold text-red-600">
                      {stats.outOfStock}
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <span className="text-red-600 font-bold">
                      ×
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* FILTERS */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">

              <div className="flex flex-col md:flex-row gap-4">

                {/* Search */}
                <div className="flex-1">

                  <div className="relative">

                    <FaSearch
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) =>
                        setSearchTerm(e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />

                  </div>

                </div>

                {/* Category */}
                <div className="flex items-center space-x-2">

                  <FaFilter className="text-gray-400" />

                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value)
                    }
                    className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>

                </div>

              </div>

            </div>

            {/* PRODUCTS TABLE */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-full">

              {/* ONLY TABLE HAS HORIZONTAL SCROLL */}
              <div className="w-full max-w-full overflow-x-auto overflow-y-hidden custom-table-scrollbar">

                <table className="min-w-[1100px] w-full divide-y divide-gray-200">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        PRODUCT
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        SKU
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        HSN
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        CATEGORY
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        PRICE
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        STOCK
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        IGST
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        CGST
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        SGST
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        STATUS
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        ACTIONS
                      </th>

                    </tr>

                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">

                    {loading ? (

                      <tr>

                        <td
                          colSpan="11"
                          className="px-4 py-8 text-center"
                        >

                          <div className="flex justify-center">

                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

                          </div>

                          <p className="mt-2 text-gray-500">
                            Loading products...
                          </p>

                        </td>

                      </tr>

                    ) : filteredProducts.length > 0 ? (

                      filteredProducts.map((product) => (

                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                        >

                          <td className="px-4 py-4 whitespace-nowrap">

                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>

                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.sku}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.HSN_No}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">

                            <div className="text-sm font-semibold text-gray-900">
                              ₹{product.price.toFixed(2)}
                            </div>

                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">

                            <div className="text-sm text-gray-900">

                              {product.stock} units

                              <div className="text-xs text-gray-500">
                                Min: {product.minStock}
                              </div>

                            </div>

                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.IGST}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.CGST}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.SGST}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">

                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                product.status
                              )}`}
                            >
                              {product.status}
                            </span>

                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">

                            <div className="flex space-x-2">

                              <button
                                onClick={() =>
                                  handleEditProduct(product)
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                              >
                                <FaEdit />
                              </button>

                              <button
                                onClick={() =>
                                  setShowDeleteConfirm(
                                    product.id
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors"
                              >
                                <FaTrash />
                              </button>

                            </div>

                          </td>

                        </tr>

                      ))

                    ) : (

                      <tr>

                        <td
                          colSpan="11"
                          className="px-4 py-12 text-center"
                        >

                          <div className="text-gray-400 mb-2">
                            No products found
                          </div>

                          <div className="text-gray-500 text-sm">
                            Try adjusting your search or add a new
                            product
                          </div>

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* PAGINATION */}
            {!loading && totalPages > 0 && (

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">

                <div className="text-sm text-gray-600">

                  Showing{' '}
                  {(currentPage - 1) * itemsPerPage + 1}{' '}
                  to{' '}
                  {Math.min(
                    currentPage * itemsPerPage,
                    totalItems
                  )}{' '}
                  of {totalItems} products

                </div>

                <div className="flex items-center space-x-1">

                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaChevronLeft />
                  </button>

                  {getPageNumbers().map((page) => (

                    <button
                      key={page}
                      onClick={() =>
                        handlePageChange(page)
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>

                  ))}

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaChevronRight />
                  </button>

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (

        <AddProductModal
          product={editingProduct}
          categories={allCategories}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />

      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">

            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product?
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">

              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  handleDeleteProduct(showDeleteConfirm)
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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