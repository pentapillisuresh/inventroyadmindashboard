import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  FaArrowLeft, FaPlus, FaTrash, FaEdit, FaBox, FaSnowflake, FaTruck,
  FaFileInvoice, FaMoneyBill, FaChartBar, FaWarehouse, FaEye, FaTimes,
  FaSave, FaSearch, FaHistory, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaBuilding, FaThermometerHalf, FaClipboardList, FaDollarSign, FaFilePdf,
  FaDownload, FaShare, FaPrint, FaChevronRight
} from 'react-icons/fa';
import { storage } from '../data/storage';
import axios from 'axios';
import ApiService from '../components/ApiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState(null);
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // add this state at top of component
  const [openBatch, setOpenBatch] = useState(null);

  // group waybills by batchId
  const batchArray = Object.entries(
    waybills.reduce((acc, item) => {
      if (!acc[item.batchId]) {
        acc[item.batchId] = [];
      }
      acc[item.batchId].push(item);
      return acc;
    }, {})
  ).map(([batchId, items]) => ({
    batchId,
    items,
    totalAmount: items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    invoice: items[0]?.invoice || null, // Add invoice data from the first item in the batch
    invoiceId: items[0]?.invoiceId, // Add invoice ID
    invoiceNumber: items[0]?.invoice?.invoiceNumber, // Add invoice number
    invoiceType: items[0]?.invoice?.type // Add invoice type (distribution/outlet_sale)
  }));
  useEffect(() => {
    loadStoreData();
    loadCategories();
    loadWaybills();
  }, [id]);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get(`/stores/${id}`, {
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
        totalValue: `₹${response.stockValue?.toLocaleString('en-IN') || '0'}`,
          totalItems: response.totalItems || 0,
          infrastructure: response.rooms || [],
          racks: response.racks || [],
          freezers: response.freezers || []
        };
        console.log("rack:::", response.racks);
        console.log("freezers:::", response.freezers);
        console.log("room:::", response.rooms);
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

  const loadWaybills = async () => {
    try {
      const response = await ApiService.get(`/stores/${id}/waybills`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },

      });
      if (response.waybills) {
        console.log("response:::",response);
        setWaybills(response.waybills);
      }
    } catch (error) {
      console.error('Error loading waybills:', error);
      // Fallback data
      const allWaybills = JSON.parse(localStorage.getItem('waybills') || '[]');
      const storeWaybills = allWaybills.filter(wb => wb.storeId === parseInt(id));
      setWaybills(storeWaybills);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await ApiService.get(`/categories`, {
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
      setCategories([]);
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

    setIsSubmitting(true);
    try {
      const roomData = {
        name: newRoom.name,
        roomNumber: newRoom.roomNumber,
        storeId: parseInt(id),
        capacity: parseInt(newRoom.capacity)
      };

      const response = await ApiService.post(`/stores/${id}/rooms`, roomData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        await loadStoreData();
        setNewRoom({ name: '', roomNumber: '', capacity: '' });
        setShowAddRoom(false);
        alert('Room added successfully!');
      }
    } catch (error) {
      console.error('Error adding room:', error);
      alert('❌ Failed to add room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRack = async () => {
    if (!newRack.name || !newRack.rackNumber || !newRack.roomId || !newRack.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const rackData = {
        name: newRack.name,
        rackNumber: newRack.rackNumber,
        roomId: parseInt(newRack.roomId),
        capacity: parseInt(newRack.capacity)
      };

      const response = await ApiService.post(
        `/stores/rooms/${newRack.roomId}/racks`,
        rackData,
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response) {
        await loadStoreData();
        setNewRack({ name: '', rackNumber: '', roomId: '', capacity: '' });
        setShowAddRack(false);
        alert('Rack added successfully!');
      }
    } catch (error) {
      console.error('Error adding rack:', error);
      alert('❌ Failed to add rack. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFreezer = async () => {
    if (!newFreezer.name || !newFreezer.freezerNumber || !newFreezer.roomId || !newFreezer.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const freezerData = {
        name: newFreezer.name,
        freezerNumber: newFreezer.freezerNumber,
        roomId: parseInt(newFreezer.roomId),
        capacity: parseInt(newFreezer.capacity),
        temperature: newFreezer.temperature || null
      };

      const response = await ApiService.post(`/stores/rooms/${newFreezer.roomId}/freezers`, freezerData, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        await loadStoreData();
        setNewFreezer({ name: '', freezerNumber: '', roomId: '', capacity: '', temperature: '' });
        setShowAddFreezer(false);
        alert('Freezer added successfully!');
      }
    } catch (error) {
      console.error('Error adding freezer:', error);
      alert('❌ Failed to add freezer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room? This will also delete all racks and freezers in this room.')) {
      setLoading(true);
      try {
        await ApiService.delete(`/stores/rooms/${roomId}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        await loadStoreData();
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
        await ApiService.delete(`/stores/racks/${rackId}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        await loadStoreData();
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
        await ApiService.delete(`/stores/freezers/${freezerId}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        await loadStoreData();
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

    setIsSubmitting(true);
    try {
      let inventoryData = {
        productId: editingProduct?.productId || 1,
        storeId: parseInt(id),
        quantity: parseInt(productForm.quantity),
        reorderLevel: parseInt(productForm.minStock) || 10
      };

      if (productForm.roomId) inventoryData.roomId = parseInt(productForm.roomId);
      if (productForm.rackId) inventoryData.rackId = parseInt(productForm.rackId);
      if (productForm.freezerId) inventoryData.freezerId = parseInt(productForm.freezerId);

      if (editingProduct) {
        await ApiService.put(`/inventory/${editingProduct.id}`, inventoryData, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        alert('Product updated successfully!');
      } else {
        const productData = {
          name: productForm.name,
          sku: productForm.sku || `SKU-${Date.now().toString().slice(-6)}`,
          description: productForm.description,
          price: parseFloat(productForm.price),
          costPrice: parseFloat(productForm.price) * 0.8,
          thresholdQuantity: parseInt(productForm.minStock) || 10,
          categoryId: productForm.category || 1,
          isActive: true
        };

        const productResponse = await ApiService.post(`/products`, productData, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (productResponse.success) {
          inventoryData.productId = productResponse.product.id;
          await ApiService.post(`/inventory`, inventoryData, {
            headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json',
            },
          });
          alert('Product added successfully!');
        }
      }

      await loadStoreData();
      resetProductForm();
      setShowAddProduct(false);
      setShowEditProduct(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('❌ Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        await ApiService.delete(`/inventory/${productId}`, {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        });
        await loadStoreData();
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

  const handleViewWaybill = (waybill) => {
    setSelectedWaybill(waybill);
    setShowWaybillModal(true);
  };

  // NEW: Download Waybill as PDF function
 // Updated: Download Waybill as PDF function with Invoice Format
 const downloadWaybillPDF = async (batchId, batchItems, batchTotal, batchInvoice) => {
  setIsDownloading(true);
  
  // Create a temporary div for PDF rendering
  const pdfContent = document.createElement('div');
  pdfContent.style.padding = '40px';
  pdfContent.style.backgroundColor = '#ffffff';
  pdfContent.style.fontFamily = 'Arial, sans-serif';
  pdfContent.style.maxWidth = '1000px';
  pdfContent.style.margin = '0 auto';
  
  // Determine From and To addresses based on invoice type
  const isDistribution = batchInvoice?.type === 'distribution';
  
  // From address (createdBy data - from batchInvoice.createdUser)
  const fromAddress = {
    name: batchInvoice?.createdUser?.name || 'N/A',
    address: batchInvoice?.createdUser?.officeAddress || 'N/A',
    phone: batchInvoice?.createdUser?.phoneNumber || 'N/A',
    email: batchInvoice?.createdUser?.email || 'N/A'
  };
  
  // To address (Store for distribution, Outlet for outlet_sale)
  let toAddress = {};
  if (isDistribution) {
    toAddress = {
      name: batchInvoice?.Store?.name || 'N/A',
      address: batchInvoice?.Store?.address || 'N/A',
      phone: batchInvoice?.Store?.phoneNumber || 'N/A'
    };
  } else {
    toAddress = {
      name: batchInvoice?.Outlet?.name || 'N/A',
      address: batchInvoice?.Outlet?.address || 'N/A',
      phone: batchInvoice?.Outlet?.phoneNumber || 'N/A'
    };
  }
  
  // Calculate box groupings
  const boxesInBatch = batchItems.reduce((acc, item) => {
    if (!acc[item.boxName]) {
      acc[item.boxName] = {
        items: [],
        total: 0
      };
    }
    acc[item.boxName].items.push(item);
    acc[item.boxName].total += Number(item.totalPrice || 0);
    return acc;
  }, {});
  
  // Build HTML content with exact invoice format
  pdfContent.innerHTML = `
    <div style="border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;">
      <h1 style="text-align: center; color: #1e40af; margin: 0; font-size: 32px; font-weight: bold; text-transform: uppercase;">
        ${isDistribution ? 'DISTRIBUTION' : 'OUTLET SALE'} WAYBILL
      </h1>
      <p style="text-align: center; color: #6b7280; margin-top: 8px; font-size: 14px;">
        ${batchInvoice?.invoiceNumber || 'Invoice Number'} | ${new Date(batchInvoice?.createdAt).toLocaleDateString() || ''}
      </p>
    </div>

    <!-- From and To Address Section -->
    <div style="margin-bottom: 25px; display: flex; justify-content: space-between; gap: 20px;">
      <!-- From Address -->
      <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">📤 FROM</h3>
        <p style="margin: 5px 0; font-weight: 600;">${fromAddress.name}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">${fromAddress.address}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">Phone: ${fromAddress.phone}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">Email: ${fromAddress.email}</p>
      </div>
      
      <!-- To Address -->
      <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">📥 TO</h3>
        <p style="margin: 5px 0; font-weight: 600;">${toAddress.name}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">${toAddress.address}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">Phone: ${toAddress.phone}</p>
      </div>
    </div>

    <!-- Batch Information -->
    <div style="margin-bottom: 25px; background: #f3f4f6; padding: 15px; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px; width: 33%;"><strong>Batch ID:</strong> ${batchId}</td>
          <td style="padding: 5px; width: 33%;"><strong>Invoice No:</strong> ${batchInvoice?.invoiceNumber || 'N/A'}</td>
          <td style="padding: 5px; width: 33%;"><strong>Total Amount:</strong> ₹${batchTotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 5px;"><strong>Date:</strong> ${new Date(batchInvoice?.createdAt || new Date()).toLocaleString()}</td>
          <td style="padding: 5px;"><strong>Type:</strong> ${isDistribution ? 'Distribution' : 'Outlet Sale'}</td>
          <td style="padding: 5px;"></td>
        </tr>
      </table>
    </div>

    ${Object.entries(boxesInBatch).map(([boxName, boxData], boxIndex) => `
      <!-- Box ${boxIndex + 1} -->
      <div style="margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #f8fafc; padding: 12px 15px; border-bottom: 2px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">📦 BOX: ${boxName}</h3>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">SL NO</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">PRODUCT NAME</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">HSN CODE</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600;">QTY</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">RATE (₹)</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">AMOUNT (₹)</th>
             </tr>
          </thead>
          <tbody>
            ${boxData.items.map((item, idx) => `
              <tr>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${idx + 1}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${item.Product?.name || 'N/A'}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${item.Product?.HSN_No || 'N/A'}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right;">${parseFloat(item.price || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 500;">${parseFloat(item.totalPrice || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc;">
              <td colspan="5" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #e2e8f0;">BOX TOTAL:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #e2e8f0;">₹${boxData.total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `).join('')}

    <!-- Summary Section -->
    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <div style="width: 350px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
          <span style="font-weight: 600;">Total Gross Amount</span>
          <span>₹${batchTotal.toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Add CGST (9%)</span>
          <span>₹${(batchTotal * 0.09).toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">Add SGST (9%)</span>
          <span>₹${(batchTotal * 0.09).toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 15px; background: #f0fdf4; font-weight: bold; font-size: 16px;">
          <span>GRAND TOTAL</span>
          <span>₹${(batchTotal * 1.18).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <!-- Payment Details -->
    <div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px;">
      <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">PAYMENT DETAILS</h4>
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="padding: 5px; width: 33%;"><strong>Payment Method:</strong> ${batchItems[0]?.paymentMethod || 'Paid'}</td>
          <td style="padding: 5px; width: 33%;"><strong>Paid Amount:</strong> ₹${(batchTotal * 0.5).toLocaleString('en-IN')}</td>
          <td style="padding: 5px; width: 33%;"><strong>Credit Amount:</strong> ₹${(batchTotal * 0.5).toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <!-- Signature Section -->
    <div style="margin-top: 40px; display: flex; justify-content: space-between;">
      <div style="width: 45%;">
        <p style="font-weight: 600; margin-bottom: 40px;">Receiver's Signature</p>
        <div style="border-bottom: 1px solid #000; width: 80%;"></div>
        <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Name: ${toAddress.name || '___________________'}</p>
        <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="width: 45%; text-align: right;">
        <p style="font-weight: 600; margin-bottom: 40px;">Authorized Signature</p>
        <div style="border-bottom: 1px solid #000; width: 80%; margin-left: auto;"></div>
        <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Name: ${fromAddress.name || '___________________'}</p>
        <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 10px; color: #9ca3af;">
      <p>This is a computer-generated waybill. Valid without signature.</p>
      <p>${fromAddress.name} - ${fromAddress.address} | Phone: ${fromAddress.phone}</p>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
  `;
  
  document.body.appendChild(pdfContent);
  
  try {
    const canvas = await html2canvas(pdfContent, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`Waybill_${batchId}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    document.body.removeChild(pdfContent);
    setIsDownloading(false);
  }
};


const handlePrintWaybill = (waybill) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Waybill ${waybill.waybillNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .waybill-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .store-info { margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
            .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
            .detail-item { margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #4b5563; }
            .products-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .products-table th, .products-table td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            .products-table th { background: #f9fafb; font-weight: bold; }
            .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DISTRIBUTION WAYBILL</h1>
            <div class="waybill-number">${waybill.waybillNumber}</div>
          </div>
          
          <div class="store-info">
            <h3>Store Information</h3>
            <p><strong>Store:</strong> ${store?.name || 'N/A'}</p>
            <p><strong>Address:</strong> ${store?.address || 'N/A'}</p>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Date:</div>
              <div>${new Date(waybill.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Type:</div>
              <div>${waybill.paymentType || 'Paid'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Total Amount:</div>
              <div>$${(waybill.totalAmount || 0).toLocaleString()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Status:</div>
              <div>${waybill.status || 'Completed'}</div>
            </div>
          </div>
          
          <h3>Products Distributed</h3>
          <table class="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${waybill.items?.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.sku || 'N/A'}</td>
                  <td>${item.quantity}</td>
                  <td>$${(item.price || 0).toFixed(2)}</td>
                  <td>$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <div class="total">
            Grand Total: $${(waybill.totalAmount || 0).toLocaleString()}
          </div>
          
          <div class="footer">
            <p>This is a system-generated waybill. Valid with electronic signature.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'In Stock': return 'bg-emerald-100 text-emerald-800';
      case 'Low Stock': return 'bg-amber-100 text-amber-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1">
        <Header title="Store Details" showSearch={false} />

        <main className="p-6">
          {/* Back Button and Store Title */}
          <div className="mb-6">
            <Link
              to="/stores"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 text-sm font-medium bg-white px-3 py-1.5 rounded-lg shadow-sm transition-all hover:shadow"
            >
              <FaArrowLeft className="mr-2" size={12} />
              Back to Stores
            </Link>

            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{store.name}</h1>
                  <p className="text-gray-600">{store.address}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(store.status)}`}>
                      {store.status}
                    </span>
                    <span className="text-sm text-gray-600 flex items-center">
                      <FaBuilding className="mr-1" size={12} />
                      Manager: {store.manager || 'Unassigned'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Credit Limit</p>
                    {/* <p className="text-2xl font-bold text-gray-800">${parseFloat(store.creditLimit || 0).toLocaleString()}</p> */}
                    <p className="text-2xl font-bold text-gray-800">₹{parseFloat(store.creditLimit || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Store Stats - Redesigned Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Stock Value</p>
                  {/* <p className="text-2xl font-bold text-gray-800">{store.totalValue || '$0'}</p> */}
                  <p className="text-2xl font-bold text-gray-800">{store.totalValue || '₹0'}</p>
                </div>
                <div className="bg-blue-200 p-3 rounded-full">
                  <FaDollarSign className="text-blue-700" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl shadow-sm border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium mb-1">Total Products</p>
                  <p className="text-2xl font-bold text-gray-800">{inventoryData.length}</p>
                </div>
                <div className="bg-emerald-200 p-3 rounded-full">
                  <FaBox className="text-emerald-700" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-sm border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-gray-800">{store.totalItems || 0}</p>
                </div>
                <div className="bg-purple-200 p-3 rounded-full">
                  <FaClipboardList className="text-purple-700" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl shadow-sm border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium mb-1">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-gray-800">{inventoryData.filter(p => p.status === 'Low Stock').length}</p>
                </div>
                <div className="bg-amber-200 p-3 rounded-full">
                  <FaExclamationTriangle className="text-amber-700" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Modern Design with 4 tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 bg-white rounded-t-lg px-4">
              <nav className="flex space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('infrastructure')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === 'infrastructure'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  disabled={loading}
                >
                  <FaWarehouse className={activeTab === 'infrastructure' ? 'text-blue-500' : 'text-gray-400'} />
                  Infrastructure
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventory'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  disabled={loading}
                >
                  <FaBox className={activeTab === 'inventory' ? 'text-blue-500' : 'text-gray-400'} />
                  Inventory ({inventoryData.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === 'invoices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  disabled={loading}
                >
                  <FaFileInvoice className={activeTab === 'invoices' ? 'text-blue-500' : 'text-gray-400'} />
                  Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => setActiveTab('waybills')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === 'waybills'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  disabled={loading}
                >
                  <FaFilePdf className={activeTab === 'waybills' ? 'text-blue-500' : 'text-gray-400'} />
                  Waybills ({waybills.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Search Bar - Improved */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search by product, category, SKU, invoice or waybill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                disabled={loading}
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col justify-center items-center py-12 bg-white rounded-xl shadow-sm">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
              <span className="text-gray-600">Loading store data...</span>
            </div>
          )}

          {/* Tab Content */}
          {!loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Infrastructure Tab */}
              {activeTab === 'infrastructure' && (
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <FaWarehouse className="text-blue-600" />
                      Infrastructure Management
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowAddRoom(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
                        disabled={loading}
                      >
                        <FaPlus size={12} />
                        <span>Add Room</span>
                      </button>
                      <button
                        onClick={() => setShowAddRack(true)}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
                        disabled={loading}
                      >
                        <FaPlus size={12} />
                        <span>Add Rack</span>
                      </button>
                      <button
                        onClick={() => setShowAddFreezer(true)}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
                        disabled={loading}
                      >
                        <FaPlus size={12} />
                        <span>Add Freezer</span>
                      </button>
                    </div>
                  </div>

                  {/* Rooms Section - Redesigned Cards */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaBuilding className="text-gray-600" />
                      Rooms ({store.infrastructure?.length || 0})
                    </h3>
                    {store.infrastructure && store.infrastructure.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {store.infrastructure.map((room) => (
                          <div key={room.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex justify-between items-center">
                              <div>
                                <h4 className="font-semibold text-white">{room.name}</h4>
                                <p className="text-xs text-gray-300">Room #{room.roomNumber}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteRoom(room.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete Room"
                                disabled={loading}
                              >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                              </button>
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-blue-50 rounded-lg p-2 text-center">
                                  <p className="text-xs text-gray-500">Capacity</p>
                                  <p className="font-bold text-gray-800">{room.capacity} units</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                                  <p className="text-xs text-gray-500">Current Occupancy</p>
                                  <p className="font-bold text-gray-800">{room.currentOccupancy || 0} units</p>
                                </div>
                              </div>

                              {/* Racks in this room */}
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                  <FaBox size={12} className="text-gray-500" />
                                  Racks ({store.racks?.filter(rack => rack.roomId === room.id).length || 0})
                                </h5>
                                {store.racks && store.racks.filter(rack => rack.roomId === room.id).length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {store.racks.filter(rack => rack.roomId === room.id).map((rack) => (
                                      <div key={rack.id} className="bg-gray-100 rounded-lg p-2 flex justify-between items-center">
                                        <div>
                                          <p className="font-medium text-gray-800 text-sm">{rack.name}</p>
                                          <p className="text-xs text-gray-500">Rack #{rack.rackNumber} | Cap: {rack.capacity}</p>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteRack(rack.id)}
                                          className="text-red-500 hover:text-red-700 transition"
                                          disabled={loading}
                                        >
                                          <FaTrash size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">No racks in this room</p>
                                )}
                              </div>

                              {/* Freezers in this room */}
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                  <FaSnowflake size={12} className="text-blue-500" />
                                  Freezers ({store.freezers?.filter(freezer => freezer.roomId === room.id).length || 0})
                                </h5>
                                {store.freezers && store.freezers.filter(freezer => freezer.roomId === room.id).length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {store.freezers.filter(freezer => freezer.roomId === room.id).map((freezer) => (
                                      <div key={freezer.id} className="bg-blue-50 rounded-lg p-2 flex justify-between items-center">
                                        <div>
                                          <p className="font-medium text-gray-800 text-sm">{freezer.name}</p>
                                          <p className="text-xs text-gray-500">
                                            Freezer #{freezer.freezerNumber} | Cap: {freezer.capacity}
                                            {freezer.temperature && ` | ${freezer.temperature}°C`}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteFreezer(freezer.id)}
                                          className="text-red-500 hover:text-red-700 transition"
                                          disabled={loading}
                                        >
                                          <FaTrash size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">No freezers in this room</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <FaWarehouse className="text-5xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No rooms added yet</p>
                        <p className="text-sm text-gray-400 mt-1">Click "Add Room" to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inventory Tab - Improved Table Design */}
              {activeTab === 'inventory' && (
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <FaBox className="text-emerald-600" />
                      Inventory Management
                    </h2>
                    <button
                      onClick={() => {
                        resetProductForm();
                        setShowAddProduct(true);
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
                    >
                      <FaPlus size={12} />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {/* Inventory Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{item.product}</div>
                                {item.description && <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">{item.category}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.sku}</code>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{item.location}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900 font-medium">{item.quantity} units</div>
                                <div className="text-xs text-gray-500">Min: {item.minStock}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {/* <div className="text-gray-900 font-medium">${item.price}</div> */}
                                <div className="text-gray-900 font-medium">₹{Number(item.price).toLocaleString('en-IN')}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleEditProduct(item)}
                                  className="text-blue-600 hover:text-blue-800 mr-3 transition"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(item.id)}
                                  className="text-red-600 hover:text-red-800 transition"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <FaBox className="text-4xl text-gray-300 mb-3" />
                                <p className="text-gray-500">
                                  {searchTerm ? 'No products found matching your search' : 'No products available'}
                                </p>
                                {!searchTerm && (
                                  <button
                                    onClick={() => {
                                      resetProductForm();
                                      setShowAddProduct(true);
                                    }}
                                    className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                                  >
                                    + Add your first product
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Cards */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                      <p className="text-sm text-blue-700 font-medium">Total Products</p>
                      <p className="text-2xl font-bold text-gray-800">{inventoryData.length}</p>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl">
                      <p className="text-sm text-emerald-700 font-medium">In Stock</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {inventoryData.filter(p => p.status === 'In Stock').length}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl">
                      <p className="text-sm text-amber-700 font-medium">Low Stock</p>
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
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <FaFileInvoice className="text-purple-600" />
                      Invoice History
                    </h2>
                    <Link
                      to="/invoice/create"
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
                    >
                      <FaPlus size={12} />
                      <span>New Invoice</span>
                    </Link>
                  </div>

                  {/* Invoice Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-700">
                                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="capitalize text-gray-700">{invoice.type}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {/* <div className="text-gray-900 font-medium">${parseFloat(invoice.totalAmount || 0).toLocaleString()}</div> */}
                                <div className="text-gray-900 font-medium">
  ₹{parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN')}
</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${invoice.paymentMethod === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                  {invoice.paymentMethod}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <FaFileInvoice className="text-4xl text-gray-300 mb-3" />
                                <p className="text-gray-500">
                                  {searchTerm ? 'No invoices found matching your search' : 'No invoice history available'}
                                </p>
                                {!searchTerm && (
                                  <Link
                                    to="/invoice/create"
                                    className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
                                  >
                                    + Create your first invoice
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Summary */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                      <p className="text-sm text-blue-700 font-medium">Total Invoices</p>
                      <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl">
                      <p className="text-sm text-emerald-700 font-medium">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {/* ${invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0).toLocaleString()}
                         */}
                         ₹{invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                      <p className="text-sm text-purple-700 font-medium">Completed</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {invoices.filter(d => d.status === 'completed').length}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl">
                      <p className="text-sm text-amber-700 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {invoices.filter(d => d.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Waybills Tab - with Download PDF Button */}
              {activeTab === 'waybills' && (
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaFilePdf className="text-red-600" />
                        Waybills & Distribution Records
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Batch wise distribution and box tracking
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => loadWaybills()}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
                      >
                        <FaHistory size={12} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Waybill List */}
                  <div className="space-y-5">
                    {batchArray.length > 0 ? (
                      batchArray.map((batch, batchIndex) => {
                        const isOpen = openBatch === batch.batchId;
                        const batchId = batch.batchId;
                        const batchItems = batch.items;
                        const batchTotal = batch.totalAmount;
                        const batchInvoice = batch.invoice;

                        // Group boxes within this batch
                        const boxesInBatch = batchItems.reduce((acc, item) => {
                          if (!acc[item.boxName]) {
                            acc[item.boxName] = {
                              items: [],
                              total: 0
                            };
                          }
                          acc[item.boxName].items.push(item);
                          acc[item.boxName].total += Number(item.totalPrice || 0);
                          return acc;
                        }, {});

                        return (
                          <div
                            key={batchIndex}
                            className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            {/* Batch Header - Click to Expand */}
                            <button
                              onClick={() => setOpenBatch(isOpen ? null : batch.batchId)}
                              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 p-5 text-white"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="text-white" size={16} />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-xs uppercase tracking-wider opacity-80">
                                      Batch ID
                                    </p>
                                    <h3 className="text-xl font-bold">
                                      {batch.batchId}
                                    </h3>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                  <div className="text-right">
                                    <p className="text-xs opacity-80">Total Boxes</p>
                                    <p className="text-lg font-semibold">{Object.keys(boxesInBatch).length}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs opacity-80">Total Products</p>
                                    <p className="text-lg font-semibold">{batchItems.length}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs opacity-80">Total Amount</p>
                                    <p className="text-xl font-bold">₹{batchTotal.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </button>

                            {/* Expandable Content */}
                            {isOpen && (
                              <div className="p-5 bg-white">
                                {/* Download Button for this batch */}
                                <div className="flex justify-end mb-4">
                                  <button
                                    onClick={() => downloadWaybillPDF(batchId, batchItems, batchTotal,batchInvoice)}
                                    disabled={isDownloading}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                                  >
                                    {isDownloading ? <FaSpinner className="animate-spin" size={14} /> : <FaDownload size={14} />}
                                    <span>Download Waybill PDF</span>
                                  </button>
                                </div>
                                
                                <div className="space-y-4">
                                  {Object.entries(boxesInBatch).map(([boxName, boxData], boxIndex) => {
                                    const boxItems = boxData.items;
                                    const boxTotal = boxData.total;

                                    return (
                                      <div
                                        key={boxIndex}
                                        className="bg-gradient-to-r from-blue-50/30 to-purple-50/30 rounded-xl p-4 border border-blue-100"
                                      >
                                        {/* Box Header */}
                                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-blue-200">
                                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <FaBox className="text-blue-600" size={16} />
                                            Box: {boxName}
                                          </h4>
                                          <div className="text-right">
                                            <p className="font-bold text-gray-800">₹{boxTotal.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">Box Total</p>
                                          </div>
                                        </div>

                                        {/* Products Table */}
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                              <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">HSN No.</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Quantity</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price/Unit</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                                              </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                              {boxItems.map((item, itemIndex) => (
                                                <tr key={itemIndex} className="hover:bg-gray-50">
                                                  <td className="px-3 py-2 text-sm text-gray-900">
                                                    <div>
                                                      <p className="font-medium">{item.Product?.name || 'N/A'}</p>
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-gray-500">
                                                    {item.Product?.HSN_No || 'N/A'}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-center text-gray-700">
                                                    {item.quantity}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-right text-gray-700">
                                                    ₹{parseFloat(item.price || 0).toLocaleString()}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                                                    ₹{parseFloat(item.totalPrice || 0).toLocaleString()}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                              <tr>
                                                <td colSpan="4" className="px-3 py-2 text-right font-semibold text-gray-800">
                                                  Box Total:
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold text-gray-900">
                                                  ₹{boxTotal.toLocaleString()}
                                                </td>
                                              </tr>
                                            </tfoot>
                                          </table>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                        <FaFilePdf className="text-5xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          No Waybills Found
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm
                            ? 'No matching waybills available'
                            : 'No waybills generated yet'}
                        </p>
                        {!searchTerm && (
                          <Link
                            to={`/stores/${id}/distribute`}
                            className="inline-flex items-center gap-2 mt-5 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition"
                          >
                            <FaTruck size={14} />
                            Create Distribution
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Buttons - Modern Design */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
            <Link
              to="/invoices"
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 px-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <FaFileInvoice size={14} />
              <span>Invoices</span>
            </Link>
            <Link
              to="/expenditures"
              className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-2.5 px-3 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <FaMoneyBill size={14} />
              <span>Expenditures</span>
            </Link>
            <Link
              to="/reports"
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2.5 px-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <FaChartBar size={14} />
              <span>Reports</span>
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this store?')) {
                  storage.deleteStore(store.id);
                  navigate('/stores');
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 px-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <FaTrash size={14} />
              <span>Delete Store</span>
            </button>
            <button
              onClick={onLogout}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2.5 px-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <span>Logout</span>
            </button>
          </div>
        </main>
      </div>

      {/* Add/Edit Product Modal - Improved Design */}
      {(showAddProduct || showEditProduct) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setShowEditProduct(false);
                  resetProductForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    onChange={(e) => setProductForm({ ...productForm, roomId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    onChange={(e) => setProductForm({ ...productForm, rackId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    onChange={(e) => setProductForm({ ...productForm, freezerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                    onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter product description"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2.5 px-4 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    setShowEditProduct(false);
                    resetProductForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal - Improved Design */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Add New Room</h3>
              <button
                onClick={() => setShowAddRoom(false)}
                className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., ARK Room 1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., R-001"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity (units) *
                  </label>
                  <input
                    type="number"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., 300"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddRoom}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : null}
                  <span>{isSubmitting ? 'Adding...' : 'Add Room'}</span>
                </button>
                <button
                  onClick={() => setShowAddRoom(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal - Improved Design */}
      {showAddRack && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Add New Rack</h3>
              <button
                onClick={() => setShowAddRack(false)}
                className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rack Name *
                  </label>
                  <input
                    type="text"
                    value={newRack.name}
                    onChange={(e) => setNewRack({ ...newRack, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., ARK Rack A"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rack Number *
                  </label>
                  <input
                    type="text"
                    value={newRack.rackNumber}
                    onChange={(e) => setNewRack({ ...newRack, rackNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., RA-01"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room *
                  </label>
                  <select
                    value={newRack.roomId}
                    onChange={(e) => setNewRack({ ...newRack, roomId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    disabled={isSubmitting}
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
                    onChange={(e) => setNewRack({ ...newRack, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., 200"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddRack}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2.5 px-4 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : null}
                  <span>{isSubmitting ? 'Adding...' : 'Add Rack'}</span>
                </button>
                <button
                  onClick={() => setShowAddRack(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Freezer Modal - Improved Design */}
      {showAddFreezer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Add New Freezer</h3>
              <button
                onClick={() => setShowAddFreezer(false)}
                className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freezer Name *
                  </label>
                  <input
                    type="text"
                    value={newFreezer.name}
                    onChange={(e) => setNewFreezer({ ...newFreezer, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., ARK Freezer A"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freezer Number *
                  </label>
                  <input
                    type="text"
                    value={newFreezer.freezerNumber}
                    onChange={(e) => setNewFreezer({ ...newFreezer, freezerNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., 1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room *
                  </label>
                  <select
                    value={newFreezer.roomId}
                    onChange={(e) => setNewFreezer({ ...newFreezer, roomId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    disabled={isSubmitting}
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
                    onChange={(e) => setNewFreezer({ ...newFreezer, temperature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., -18"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity (units) *
                  </label>
                  <input
                    type="number"
                    value={newFreezer.capacity}
                    onChange={(e) => setNewFreezer({ ...newFreezer, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., 200"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddFreezer}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : null}
                  <span>{isSubmitting ? 'Adding...' : 'Add Freezer'}</span>
                </button>
                <button
                  onClick={() => setShowAddFreezer(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waybill Details Modal */}
      {showWaybillModal && selectedWaybill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaFilePdf className="text-red-600" />
                Waybill Details - {selectedWaybill.waybillNumber}
              </h3>
              <button
                onClick={() => {
                  setShowWaybillModal(false);
                  setSelectedWaybill(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {/* Waybill Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Waybill Number</p>
                    <p className="text-2xl font-bold text-blue-800">{selectedWaybill.waybillNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(selectedWaybill.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Distribution Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaTruck className="text-emerald-600" />
                    Distribution Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedWaybill.type} Distribution</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Type:</span>
                      <span className="font-medium">{selectedWaybill.paymentType || 'Paid'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedWaybill.status)}`}>
                        {selectedWaybill.status || 'Completed'}
                      </span>
                    </div>
                    {selectedWaybill.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-orange-600">{selectedWaybill.discount}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaDollarSign className="text-green-600" />
                    Payment Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${(selectedWaybill.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {selectedWaybill.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount Amount:</span>
                        <span className="font-medium text-green-600">-${selectedWaybill.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-800">Total Amount:</span>
                      <span className="font-bold text-gray-900">${(selectedWaybill.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Amount:</span>
                      <span className="font-medium text-green-600">${(selectedWaybill.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    {selectedWaybill.creditAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credit Amount:</span>
                        <span className="font-medium text-blue-600">${selectedWaybill.creditAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaBox className="text-purple-600" />
                  Products Distributed
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedWaybill.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.sku || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">${(item.price || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-800">Grand Total:</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">${(selectedWaybill.totalAmount || 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedWaybill.notes && (
                <div className="mb-6 bg-amber-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                  <p className="text-gray-700 text-sm">{selectedWaybill.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handlePrintWaybill(selectedWaybill)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaPrint size={14} />
                  <span>Print Waybill</span>
                </button>
                <button
                  onClick={() => {
                    setShowWaybillModal(false);
                    setSelectedWaybill(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreDetails;