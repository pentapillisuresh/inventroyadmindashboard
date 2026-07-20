import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle,
  FaFileInvoice, FaExclamationTriangle, FaDownload, FaPrint,
  FaRupeeSign, FaClock, FaStore, FaUser, FaCalendarAlt,
  FaMapMarkerAlt, FaTruck, FaBox, FaHashtag, FaDollarSign
} from 'react-icons/fa';
import ApiService from '../components/ApiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceManagement = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceRef = useRef();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [storeCreditStatus, setStoreCreditStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    outlet_sale: 0,
    credit: 0,
    paid: 0,
    totalValue: 0
  });

  const clientToken = localStorage.getItem('token');

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (id) {
      const invoice = invoices.find(inv => inv.id.toString() === id);
      setSelectedInvoice(invoice);
      if (invoice && invoice.type === 'credit' && invoice.Store) {
        checkStoreCredit(invoice.Store, invoice.totalAmount);
      }
    }
  }, [id, invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/invoice/allDistributed/Invoices/admin', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.invoices) {
        const transformedInvoices = response.invoices.map(invoice => {
          const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);

          const mapStatus = (status) => {
            switch (status) {
              case 'pending': return 'pending';
              case 'completed': return 'completed';
              case 'cancelled': return 'cancelled';
              default: return status;
            }
          };

          const mapPaymentMethod = (method) => {
            switch (method) {
              case 'paid': return 'Paid';
              case 'credit': return 'Credit';
              case 'mixed': return 'Mixed';
              default: return method.charAt(0).toUpperCase() + method.slice(1);
            }
          };

          return {
            id: invoice.invoiceNumber,
            invoiceId: invoice.id,
            outletName: invoice.Outlet?.name || 'N/A',
            storeName: invoice.Store?.name || 'N/A',
            storeId: invoice.storeId,
            managerName: invoice.StoreManager?.name || invoice.Admin?.name || 'Unassigned',
            date: new Date(invoice.invoiceDate).toLocaleDateString(),
            totalAmount: parseFloat(invoice.totalAmount),
            creditAmount: parseFloat(invoice.creditAmount),
            paidAmount: parseFloat(invoice.paidAmount),
            paymentMethod: invoice.paymentMethod,
            paymentType: mapPaymentMethod(invoice.paymentMethod),
            type: invoice.type,
            status: mapStatus(invoice.status),
            createdAt: invoice.createdAt,
            dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
            totalItems: totalItems,
            products: invoice.items.map(item => ({
              productId: item.productId,
              productName: item.Product?.name || 'Unknown Product',
              sku: item.Product?.sku || 'N/A',
              quantity: item.quantity,
              price: parseFloat(item.price),
              total: parseFloat(item.totalPrice)
            })),
            Store: invoice.Store,
            Admin: invoice.Admin,
            items: invoice.items,
            notes: invoice.notes || 'Thank you for your business!'
          };
        });

        setInvoices(transformedInvoices);

        const total = transformedInvoices.length;
        const outlet_sale = transformedInvoices.filter(i => i.type === 'outlet_sale').length;
        const credit = transformedInvoices.filter(i => i.type === 'credit').length;
        const paid = transformedInvoices.filter(i => i.type === 'paid' || i.type === 'distribution').length;
        const totalValue = transformedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

        setStats({ total, outlet_sale, credit, paid, totalValue });
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      alert('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkStoreCredit = (store, invoiceAmount) => {
    if (!store) {
      setStoreCreditStatus(null);
      return;
    }

    const currentCredit = parseFloat(store.currentCredit) || 0;
    const creditLimit = parseFloat(store.creditLimit) || 0;

    const newCreditUsed = currentCredit + invoiceAmount;
    const percentage = Math.round((newCreditUsed / creditLimit) * 100);
    const isBlocked = newCreditUsed >= creditLimit;
    const isNearLimit = percentage >= 80 && percentage < 100;

    setStoreCreditStatus({
      store,
      currentCredit,
      newCreditUsed,
      percentage,
      isBlocked,
      isNearLimit,
      availableCredit: creditLimit - currentCredit
    });
  };

  const formatCurrency = (amount) => {
    return `₹ ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) {
      console.error("No invoice reference or selected invoice");
      return;
    }

    setIsDownloading(true);

    try {
      const element = invoiceRef.current;
      const images = element.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const data = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(data, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(data, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${selectedInvoice.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    console.log("rrr::", invoice)
    if (invoice.type === 'credit' && invoice.Store) {
      checkStoreCredit(invoice.Store, invoice.totalAmount);
    }
  };

  const handleCloseDetails = () => {
    setSelectedInvoice(null);
    setStoreCreditStatus(null);
    if (id) {
      navigate('/invoices');
    }
  };

  const handleApproveInvoice = async (invoiceId) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);

      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      if (invoice.type === 'credit' || invoice.paymentMethod === 'credit') {
        if (invoice.Store) {
          const currentCredit = parseFloat(invoice.Store.currentCredit) || 0;
          const creditLimit = parseFloat(invoice.Store.creditLimit) || 0;
          const newCreditUsed = currentCredit + invoice.totalAmount;
          const percentage = Math.round((newCreditUsed / creditLimit) * 100);

          if (percentage >= 100) {
            alert(`⚠️ Store "${invoice.storeName}" credit limit would be exceeded (${percentage}%) if this invoice is approved.`);
            return;
          }

          if (percentage >= 80) {
            const confirmProceed = window.confirm(
              `⚠️ Warning: Store "${invoice.storeName}" credit usage would be at ${percentage}% (near limit). Do you want to proceed?`
            );
            if (!confirmProceed) return;
          }
        }
      }

      const response = await ApiService.patch(
        `/invoice/updateStatus/${invoice.invoiceId}`,
        { status: 'completed' },
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response) {
        alert('Invoice approved successfully!');
        loadInvoices();

        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          const updatedInvoice = { ...selectedInvoice, status: 'completed' };
          setSelectedInvoice(updatedInvoice);
        }
      }
    } catch (error) {
      console.error('Error approving invoice:', error);
      alert('Failed to approve invoice. Please try again.');
    }
  };

  const handleRejectInvoice = async (invoiceId) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);

      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      const response = await ApiService.patch(
        `/invoice/updateStatus/${invoice.invoiceId}`,
        { status: 'cancelled' },
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response) {
        alert('Invoice rejected successfully!');
        loadInvoices();

        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          const updatedInvoice = { ...selectedInvoice, status: 'cancelled' };
          setSelectedInvoice(updatedInvoice);
        }
      }
    } catch (error) {
      console.error('Error rejecting invoice:', error);
      alert('Failed to reject invoice. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'outlet_sale': return 'bg-purple-100 text-purple-800';
      case 'credit': return 'bg-blue-100 text-blue-800';
      case 'paid':
      case 'distribution':
        return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (paymentType) => {
    switch (paymentType) {
      case 'Paid': return 'bg-green-50 text-green-700 border border-green-200';
      case 'Credit': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Mixed': return 'bg-purple-50 text-purple-700 border border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.managerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Invoice Management" onLogout={onLogout} />

        <div className="flex-1 overflow-auto p-6">
          {/* Invoice Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black/60 overflow-auto z-50 p-6">

              <div className="bg-white max-w-7xl mx-auto rounded-xl shadow-2xl relative">

                {/* HEADER ACTIONS */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center print:hidden z-10">

                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      TAX INVOICE
                    </h2>

                    <p className="text-sm text-gray-500">
                      {selectedInvoice.id}
                    </p>
                  </div>

                  <div className="flex gap-3">

                    <button
                      onClick={downloadPDF}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <FaDownload />
                      PDF
                    </button>


                    <button
                      onClick={handleCloseDetails}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <FaTimesCircle />
                      Close
                    </button>

                  </div>

                </div>

                {/* PDF CONTENT */}
                <div
                  ref={invoiceRef}
                  className="bg-white p-8 text-[13px] text-gray-900"
                >

                  {/* COMPANY HEADER */}
                  <div className="border-b-2 border-gray-300 pb-4">

                    <h1 className="text-center text-3xl font-bold uppercase">
                      {selectedInvoice.Admin.name}
                    </h1>

                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">

                      <div>
                        <p>
                          <span className="font-semibold">Regd Office :</span>
                          {' '}
                          {selectedInvoice.Admin.officeAddress}
                        </p>

                        {/* <p>
                          <span className="font-semibold">Godown :</span>
                          {' '}
                          AUTONAGAR VIZAG
                        </p>

                        <p>
                          <span className="font-semibold">Office :</span>
                          {' '}
                          VISAKHAPATNAM
                        </p> */}
                      </div>

                      <div>
                        <p>
                          <span className="font-semibold">FSSAI No :</span>
                          {' '}
                          {selectedInvoice.Admin.FSSAI_No}
                        </p>

                        <p>
                          <span className="font-semibold">GST No :</span>
                          {' '}
                          {selectedInvoice.Admin.GST_No}
                        </p>

                        <p>
                          <span className="font-semibold">CIN No :</span>
                          {' '}
                          {selectedInvoice.Admin.CIN_No}
                        </p>
                      </div>

                      <div className="text-right">
                        <p>
                          <span className="font-semibold">Invoice No :</span>
                          {' '}
                          {selectedInvoice.id}
                        </p>

                        {/* <p>
                          <span className="font-semibold">Batch ID :</span>
                          {' '}
                          {selectedInvoice.batchID}
                        </p> */}

                        <p>
                          <span className="font-semibold">Invoice Date :</span>
                          {' '}
                          {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                        </p>

                        <p>
                          <span className="font-semibold">Status :</span>
                          {' '}
                          {selectedInvoice.status}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* BILL TO & SHIP TO */}
                  <div className="grid grid-cols-2 gap-8 py-6 border-b border-gray-300">

                    {/* BILL TO */}
                    <div>

                      <h3 className="font-bold text-gray-800 mb-3 uppercase">
                        BILL TO
                      </h3>

                      <p className="font-semibold">
                        {selectedInvoice.Store?.name}
                      </p>

                      <p className="mt-1">
                        {selectedInvoice.Store?.address}
                      </p>

                      <p className="mt-1">
                        PHONE NO :
                        {' '}
                        {selectedInvoice.Store?.phoneNumber}
                      </p>

                      <p className="mt-1">
                        EMAIL :
                        {' '}
                        {selectedInvoice.Store?.email}
                      </p>
                      <p className="mt-1">
                        GST NO :
                        {' '}
                        {selectedInvoice.Store?.Manager?.GST_No}
                      </p>
                    </div>

                    {/* SHIP TO */}
                    <div>

                      <h3 className="font-bold text-gray-800 mb-3 uppercase">
                        SHIP TO
                      </h3>

                      <p className="font-semibold">
                        {selectedInvoice.Store?.name}
                      </p>

                      <p className="mt-1">
                        {selectedInvoice.Store?.address}
                      </p>

                      <p className="mt-1">
                        PHONE NO :
                        {' '}
                        {selectedInvoice.Store?.phoneNumber}
                      </p>
                      <p className="mt-1">
                        EMAIL :
                        {' '}
                        {selectedInvoice.Store?.email}
                      </p>
                      <p className="mt-1">
                        GST NO :
                        {' '}
                        {selectedInvoice.Store?.Manager?.GST_No}
                      </p>

                    </div>

                  </div>

                  {/* ITEMS TABLE */}
                  <div className="mt-6 overflow-x-auto">

                    <table className="w-full border border-gray-300 text-sm">

                      <thead>

                        <tr className="bg-gray-100 border-b border-gray-300">
                          <th className="border border-gray-300 px-2 py-2 text-left">
                            HSN_No
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left">
                            SKU
                          </th>

                          <th className="border border-gray-300 px-2 py-2 text-left">
                            Product
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left">
                            MRP
                          </th>
                          
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Order Qty
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Batch
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Delvd Qty
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Rate
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Ltr/Kg
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Amt
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Net Amt
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            IGST
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            SGST
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            CGST
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-right">
                            Net Value
                          </th>
                        </tr>

                      </thead>

                      <tbody>

                        {selectedInvoice.items?.map((item, idx) => (

                          <tr
                            key={idx}
                            className="border-b border-gray-200"
                          >


                            <td className="border border-gray-300 px-2 py-2">
                              {item.Product?.HSN_No}
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              {item.Product?.sku}
                            </td>

                            <td className="border border-gray-300 px-2 py-2">
                              {item.Product?.name}
                            </td>

                            <td className="border border-gray-300 px-2 py-2">
                              {item.Product?.costPrice}
                            </td>

                            <td className="border border-gray-300 px-2 py-2 text-right">
                              {item.quantity}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right">
                              {item.batchId}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right">
                              {item.quantity}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right">
                              ₹{parseFloat(item.price || 0).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right">
                              {item.Product?.units}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right font-medium">
                              ₹{parseFloat(item.price || 0).toFixed(2) * parseFloat(item.quantity || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right font-medium">
                              ₹{parseFloat(item.price || 0).toFixed(2) * parseFloat(item.quantity || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right font-medium">
                              ₹{parseFloat(item.IGSTAmount || 0).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right font-medium">
                              ₹{parseFloat(item.SGSTAmount || 0).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right font-medium">
                              ₹{parseFloat(item.CGSTAmount || 0).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-right font-medium">
                              ₹
                              {(
                                parseFloat(item.totalPrice || 0) +
                                parseFloat(item.CGSTAmount || 0) +
                                parseFloat(item.SGSTAmount || 0) +
                                parseFloat(item.IGSTAmount || 0)
                              ).toFixed(2)}
                            </td>
                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                  {/* TOTALS */}
                  <div className="flex justify-end mt-8">

                    <div className="w-[350px] border border-gray-300">

                      <div className="flex justify-between border-b border-gray-300 px-4 py-2">
                        <span>Total Gross Amount</span>

                        <span>
                          ₹{parseFloat(selectedInvoice.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-gray-300 px-4 py-2">
                        <span>Add OUTPUT CGST 9%</span>

                        <span>
                          ₹{(
                            parseFloat(selectedInvoice.totalAmount || 0) * 0.09
                          ).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-gray-300 px-4 py-2">
                        <span>Add OUTPUT SGST 9%</span>

                        <span>
                          ₹{(
                            parseFloat(selectedInvoice.totalAmount || 0) * 0.09
                          ).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between px-4 py-3 font-bold text-lg bg-gray-50">
                        <span>Total</span>

                        <span>
                          ₹{(
                            parseFloat(selectedInvoice.totalAmount || 0) * 1.18
                          ).toFixed(2)}
                        </span>
                      </div>

                    </div>

                  </div>

                  {/* NOTES */}
                  <div className="mt-8 text-sm">

                    <p>
                      <span className="font-semibold">
                        Payment Method :
                      </span>
                      {' '}
                      {selectedInvoice.paymentMethod}
                    </p>

                    <p className="mt-1">
                      <span className="font-semibold">
                        Paid Amount :
                      </span>
                      {' '}
                      ₹{parseFloat(selectedInvoice.paidAmount || 0).toFixed(2)}
                    </p>

                    <p className="mt-1">
                      <span className="font-semibold">
                        Credit Amount :
                      </span>
                      {' '}
                      ₹{parseFloat(selectedInvoice.creditAmount || 0).toFixed(2)}
                    </p>

                  </div>

                  {/* SIGNATURES */}
                  <div className="grid grid-cols-3 gap-8 mt-20">

                    <div>
                      <p className="font-medium">
                        Customer Signature
                      </p>

                      <div className="mt-12 border-b border-gray-400"></div>
                    </div>

                    <div className="text-center">

                      <p className="text-sm text-gray-500">
                        Received Goods In Good Condition
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="font-medium">
                        Authorised Signature
                      </p>

                      <div className="mt-12 border-b border-gray-400"></div>

                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="mt-10 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">

                    This is a computer generated invoice.

                  </div>

                </div>

               
              </div>

            </div>
          )}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border-l-4 border-gray-500 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <FaFileInvoice className="text-gray-400 text-3xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter('outlet_sale')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Outlet Sales</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.outlet_sale}</p>
                </div>
                <FaStore className="text-purple-400 text-3xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter('credit')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Credit</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.credit}</p>
                </div>
                <FaRupeeSign className="text-blue-400 text-3xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter('paid')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Paid/Distribution</p>
                  <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                </div>
                <FaCheckCircle className="text-green-400 text-3xl" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-amber-500 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalValue)}</p>
                </div>
                <FaDollarSign className="text-amber-400 text-3xl" />
              </div>
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
                    placeholder="Search invoices by ID, store, outlet, or manager..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading invoices...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INVOICE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STORE / OUTLET</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITEMS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYMENT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => {
                      const statusStyle = getStatusColor(invoice.status);
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{invoice.id}</div>
                            <div className="text-xs text-gray-500">Mgr: {invoice.managerName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{invoice.storeName}</div>
                            {invoice.outletName !== 'N/A' && (
                              <div className="text-xs text-gray-500">Outlet: {invoice.outletName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{invoice.date}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{invoice.totalItems} items</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</div>
                            {invoice.creditAmount > 0 && (
                              <div className="text-xs text-blue-600">Credit: {formatCurrency(invoice.creditAmount)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(invoice.type)}`}>
                              {invoice.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPaymentColor(invoice.paymentType)}`}>
                              {invoice.paymentType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                              {invoice.status === 'completed' && <FaCheckCircle className="mr-1 text-xs" />}
                              {invoice.status === 'pending' && <FaClock className="mr-1 text-xs" />}
                              {invoice.status === 'cancelled' && <FaTimesCircle className="mr-1 text-xs" />}
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewDetails(invoice)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                            >
                              <FaEye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredInvoices.length === 0 && (
                  <div className="text-center py-12">
                    <FaFileInvoice className="text-4xl text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-400 mb-2">No invoices found</div>
                    <div className="text-gray-500 text-sm">
                      {searchTerm || statusFilter !== 'All'
                        ? 'Try adjusting your search or filters'
                        : 'No invoices available'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;