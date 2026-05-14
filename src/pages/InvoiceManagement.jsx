import React, { useState, useRef, useEffect } from "react";
import {
  FaEye,
  FaDownload,
  FaPrint,
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaFileInvoice,
  FaCheckCircle,
  FaClock,
  FaRupeeSign,
  FaStore,
  FaUser,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTruck,
} from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Header from "./Header";
import Sidebar from "./Sidebar";

// ================= DYNAMIC DATA =================
const INITIAL_INVOICES = [
  {
    id: "INV-001",
    customer: "SHANMUKA SAI AGENCIES",
    city: "VISAKHAPATNAM",
    date: "29-04-26",
    dueDate: "29-05-26",
    amount: "11137.34",
    status: "Paid",
    paymentMethod: "Bank Transfer",
    notes: "Thank you for your business!",
    items: [
      {
        hsn: "21050000",
        itemNo: "1334371",
        flavour: "MFFD CHOCO CRUNCH",
        mrp: "300.00",
        pack: "30 ML X 30",
        qty: "27.00",
        batch: "D-26-16",
        delvd: "27.00",
        rate: "212.14",
        ltr: "24.30",
        amt: "5727.78",
        sgst: "143.19",
        cgst: "143.19",
        net: "6014.16",
      },
      {
        hsn: "21050000",
        itemNo: "2322377",
        flavour: "LFIC JR. CHOCO BAR",
        mrp: "300.00",
        pack: "30 ML X 30",
        qty: "23.00",
        batch: "D-26-16",
        delvd: "23.00",
        rate: "212.14",
        ltr: "20.70",
        amt: "4879.22",
        sgst: "121.98",
        cgst: "121.98",
        net: "5123.18",
      },
    ],
  },
  {
    id: "INV-002",
    customer: "SRI DURGA AGENCIES",
    city: "HYDERABAD",
    date: "30-04-26",
    dueDate: "30-05-26",
    amount: "15300.00",
    status: "Pending",
    paymentMethod: "Cheque",
    notes: "Please make payment within due date.",
    items: [
      {
        hsn: "21050000",
        itemNo: "111111",
        flavour: "VANILLA ICE CREAM",
        mrp: "250.00",
        pack: "20 ML X 20",
        qty: "40",
        batch: "BATCH-01",
        delvd: "40",
        rate: "180.00",
        ltr: "30",
        amt: "7200",
        sgst: "180",
        cgst: "180",
        net: "7560",
      },
    ],
  },
  {
    id: "INV-003",
    customer: "MAHESH TRADING CO",
    city: "VIJAYAWADA",
    date: "01-05-26",
    dueDate: "01-06-26",
    amount: "28750.00",
    status: "Overdue",
    paymentMethod: "Cash",
    notes: "Past due amount. Please clear immediately.",
    items: [
      {
        hsn: "21050000",
        itemNo: "1334371",
        flavour: "MFFD CHOCO CRUNCH",
        mrp: "300.00",
        pack: "30 ML X 30",
        qty: "50",
        batch: "D-26-16",
        delvd: "45",
        rate: "212.14",
        ltr: "45",
        amt: "9546.30",
        sgst: "238.66",
        cgst: "238.66",
        net: "10023.62",
      },
      {
        hsn: "21050000",
        itemNo: "2322377",
        flavour: "LFIC JR. CHOCO BAR",
        mrp: "300.00",
        pack: "30 ML X 30",
        qty: "60",
        batch: "D-26-16",
        delvd: "60",
        rate: "212.14",
        ltr: "54",
        amt: "12728.40",
        sgst: "318.21",
        cgst: "318.21",
        net: "13364.82",
      },
    ],
  },
];

const InvoiceManagement = ({ onLogout }) => {
  const invoiceRef = useRef();
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const itemsPerPage = 5;

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ================= PDF GENERATION =================
  const downloadPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) {
      console.error("No invoice reference or selected invoice");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const element = invoiceRef.current;
      
      // Wait for any images to load
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

  // ================= PRINT =================
  const printInvoice = () => {
    if (!selectedInvoice) return;
    
    const printContent = invoiceRef.current;
    if (!printContent) return;
    
    const originalContents = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedInvoice.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              padding: 20px;
              background: white;
            }
            .invoice-container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .border-b {
              border-bottom: 1px solid #ddd;
            }
            .mt-4 {
              margin-top: 16px;
            }
            .mt-8 {
              margin-top: 32px;
            }
            .mb-4 {
              margin-bottom: 16px;
            }
            .mb-8 {
              margin-bottom: 32px;
            }
            .p-4 {
              padding: 16px;
            }
            .bg-gray-50 {
              background-color: #f9fafb;
            }
            .rounded-lg {
              border-radius: 8px;
            }
            .font-bold {
              font-weight: bold;
            }
            .text-blue-600 {
              color: #2563eb;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${printContent.outerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            }
          <\/script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // ================= STATUS STYLES =================
  const getStatusStyles = (status) => {
    switch (status) {
      case "Paid":
        return { bg: "bg-green-100", text: "text-green-700", icon: FaCheckCircle, label: "Paid" };
      case "Pending":
        return { bg: "bg-yellow-100", text: "text-yellow-700", icon: FaClock, label: "Pending" };
      case "Overdue":
        return { bg: "bg-red-100", text: "text-red-700", icon: FaTimesCircle, label: "Overdue" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", icon: FaClock, label: status };
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹ ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />
      
      <div className="flex-1 overflow-x-auto">
        <Header title="Invoice Management" />
        
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
                </div>
                <FaFileInvoice className="text-blue-500 text-3xl opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + parseFloat(i.amount), 0))}
                  </p>
                </div>
                <FaRupeeSign className="text-green-500 text-3xl opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(invoices.filter(i => i.status === "Pending").reduce((sum, i) => sum + parseFloat(i.amount), 0))}
                  </p>
                </div>
                <FaClock className="text-yellow-500 text-3xl opacity-75" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Overdue Amount</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(invoices.filter(i => i.status === "Overdue").reduce((sum, i) => sum + parseFloat(i.amount), 0))}
                  </p>
                </div>
                <FaTimesCircle className="text-red-500 text-3xl opacity-75" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 flex-wrap">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by ID, Customer or City..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="All">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">City</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No invoices found
                       </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((invoice) => {
                      const StatusIcon = getStatusStyles(invoice.status).icon;
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{invoice.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FaUser className="text-gray-400 mr-2" />
                              <span>{invoice.customer}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="text-gray-400 mr-2" />
                              <span>{invoice.city}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-gray-400 mr-2" />
                              <span>{invoice.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold">{formatCurrency(invoice.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles(invoice.status).bg} ${getStatusStyles(invoice.status).text}`}>
                              <StatusIcon className="mr-1 text-xs" />
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                              <FaEye size={14} />
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft size={12} />
                  Previous
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <FaChevronRight size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Invoice Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 overflow-auto p-6 z-50">
              <div className="bg-white max-w-6xl mx-auto rounded-xl shadow-2xl relative my-8">
                {/* Modal Header with Actions */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center print:hidden z-10">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice Details</h2>
                    <p className="text-sm text-gray-500">{selectedInvoice.id}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={downloadPDF}
                      disabled={isDownloading}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaDownload />
                          PDF
                        </>
                      )}
                    </button>
                    <button
                      onClick={printInvoice}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaPrint />
                      Print
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaTimesCircle />
                      Close
                    </button>
                  </div>
                </div>

                {/* Invoice Content for PDF/Print */}
                <div ref={invoiceRef} className="p-8 bg-white">
                  {/* Company Header */}
                  <div className="border-b-2 border-gray-300 pb-6 mb-6">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wide">
                        DINSHAWS DAIRY FOODS P. LTD
                      </h1>
                      <p className="text-gray-500 mt-1">VIZAG DIVISION</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
                      <div>
                        <p className="text-gray-600"><span className="font-semibold">Regd Office:</span> PLOT NO-7 BLOCK-F AUTONAGAR</p>
                        <p className="text-gray-600 mt-1"><span className="font-semibold">Godown:</span> AUTONAGAR VIZAG</p>
                      </div>
                      <div>
                        <p className="text-gray-600"><span className="font-semibold">FSSAI No:</span> 10121003000078</p>
                        <p className="text-gray-600 mt-1"><span className="font-semibold">GST No:</span> 37AAACD6125G1ZW</p>
                        <p className="text-gray-600 mt-1"><span className="font-semibold">CIN No:</span> U15200MH1998PTC116277</p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-gray-600"><span className="font-semibold">Invoice No:</span> {selectedInvoice.id}</p>
                        <p className="text-gray-600 mt-1"><span className="font-semibold">Date:</span> {selectedInvoice.date}</p>
                        <p className="text-gray-600 mt-1"><span className="font-semibold">Due Date:</span> {selectedInvoice.dueDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bill To & Ship To */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3 flex items-center">
                        <FaStore className="mr-2 text-blue-600" /> BILL TO
                      </h3>
                      <p className="font-semibold">{selectedInvoice.customer}</p>
                      <p>{selectedInvoice.city}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3 flex items-center">
                        <FaTruck className="mr-2 text-blue-600" /> SHIP TO
                      </h3>
                      <p className="font-semibold">{selectedInvoice.customer}</p>
                      <p>{selectedInvoice.city}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto mb-8">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-y-2 border-gray-300">
                          <th className="p-3 text-left font-semibold">#</th>
                          <th className="p-3 text-left font-semibold">Item Code</th>
                          <th className="p-3 text-left font-semibold">Flavour / Product</th>
                          <th className="p-3 text-left font-semibold">HSN</th>
                          <th className="p-3 text-right font-semibold">Qty</th>
                          <th className="p-3 text-right font-semibold">Rate</th>
                          <th className="p-3 text-right font-semibold">Amount</th>
                          <th className="p-3 text-right font-semibold">SGST</th>
                          <th className="p-3 text-right font-semibold">CGST</th>
                          <th className="p-3 text-right font-semibold">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">{idx + 1}</td>
                            <td className="p-3">{item.itemNo}</td>
                            <td className="p-3 font-medium">{item.flavour}</td>
                            <td className="p-3">{item.hsn}</td>
                            <td className="p-3 text-right">{item.qty}</td>
                            <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                            <td className="p-3 text-right">{formatCurrency(item.amt)}</td>
                            <td className="p-3 text-right">{formatCurrency(item.sgst)}</td>
                            <td className="p-3 text-right">{formatCurrency(item.cgst)}</td>
                            <td className="p-3 text-right font-bold">{formatCurrency(item.net)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary and Totals */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
                    <div className="flex-1">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-bold text-gray-800 mb-2">Notes / Terms</h3>
                        <p className="text-sm text-gray-600">{selectedInvoice.notes || "Thank you for your business!"}</p>
                        <p className="text-sm text-gray-600 mt-2">Payment Method: {selectedInvoice.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="w-80">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.amount)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">CGST (9%)</span>
                          <span>{formatCurrency(parseFloat(selectedInvoice.amount) * 0.09)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">SGST (9%)</span>
                          <span>{formatCurrency(parseFloat(selectedInvoice.amount) * 0.09)}</span>
                        </div>
                        <div className="flex justify-between py-3">
                          <span className="font-bold text-lg">Total</span>
                          <span className="font-bold text-lg text-blue-600">
                            {formatCurrency(parseFloat(selectedInvoice.amount) * 1.18)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">Customer Signature</p>
                      <div className="mt-8 border-b border-gray-300 w-40"></div>
                    </div>
                    <div className="text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(selectedInvoice.status).bg} ${getStatusStyles(selectedInvoice.status).text}`}>
                        {React.createElement(getStatusStyles(selectedInvoice.status).icon, { className: "mr-1" })}
                        {selectedInvoice.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Authorised Signature</p>
                      <div className="mt-8 border-b border-gray-300 w-40 ml-auto"></div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-8 pt-4 text-xs text-gray-400 border-t border-gray-200">
                    This is a computer generated invoice and does not require physical signature.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InvoiceManagement;