import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaDownload, FaFilePdf, FaFileExcel, FaFileCsv, FaChartBar, FaChartLine, FaChartPie, FaDollarSign, FaBox, FaReceipt, FaCreditCard, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { storage } from '../data/storage';
import ApiService from '../components/ApiService';

const ReportsAnalytics = ({ onLogout }) => {
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({
    reportType: 'inventory',
    dateRange: 'Month',
    startDate: '',
    endDate: '',
    exportFormat: 'json'
  });
  const clientToken = localStorage.getItem('token');
  const [stats, setStats] = useState({
    revenue: 0,
    revenueChange: 0,
    inventory: 0,
    inventoryChange: 0,
    invoices: 0,
    invoicesChange: 0,
    credit: 0,
    creditChange: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [showReportDetails, setShowReportDetails] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = storage.getReports();
    setReports(allReports);
  };

  const handleGenerateReport = async (e) => {
    setLoading(true);
    setError('');
    setShowReportDetails(true);

    try {
      const payload = {
        reportType: formData.reportType.toLowerCase(),
        // format: formData.exportFormat.toLowerCase()
      };

      // Only include dates if they are provided
      if (formData.startDate) {
        payload.startDate = formData.startDate;
      }
      if (formData.endDate) {
        payload.endDate = formData.endDate;
      }

      // You can add these if needed
      const response = await ApiService.post('/reports',payload, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (response.success) {
        setReportData(response);

        // Update stats based on API response
        setStats({
          revenue: response.TotalRevenue || 0,
          revenueChange: 12.5, // You might want to calculate this based on previous data
          inventory: response.report?.summary?.totalItems || 0,
          inventoryChange: 8.3, // You might want to calculate this based on previous data
          invoices: response.TotalInvoice || 0,
          invoicesChange: 5, // You might want to calculate this based on previous data
          credit: response.TotalCredit || 0,
          creditChange: 15.2 // You might want to calculate this based on previous data
        });

        // Generate report name for history
        const reportName = `${formData.reportType.charAt(0).toUpperCase() + formData.reportType.slice(1)} Report - ${formData.dateRange} (${formData.startDate || 'All time'} to ${formData.endDate || 'Now'})`;
        const size = `${(Math.random() * 2 + 0.5).toFixed(1)} MB`;

        const newReport = {
          name: reportName,
          type: formData.reportType.charAt(0).toUpperCase() + formData.reportType.slice(1),
          date: new Date().toISOString().split('T')[0],
          size: size,
          downloadUrl: '#',
          description: `${formData.reportType} analysis for ${formData.dateRange} period`,
          data: response // Store the actual report data
        };

        storage.addReport(newReport);
        loadReports();

        // Simulate download if not JSON format
        if (formData.exportFormat.toLowerCase() !== 'json') {
          alert(`Report generated successfully!\n\nName: ${reportName}\nFormat: ${formData.exportFormat}\nSize: ${size}`);
        }

      } else {
        throw new Error(response.message || 'Failed to generate report');
      }
    } catch (err) {
      setError(`Error generating report: ${err.message}`);
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleDateRangeChange = (range) => {
    const today = new Date();
    let startDate = null;

    switch (range) {
      case 'Week':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'Month':
        startDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case 'Quarter':
        startDate = new Date(today.setMonth(today.getMonth() - 3));
        break;
      case 'Year':
        startDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      case 'Custom':
        startDate = null;
        break;
      default:
        startDate = null;
    }

    setFormData(prev => ({
      ...prev,
      dateRange: range,
      startDate: startDate ? startDate.toISOString().split('T')[0] : '',
      endDate: range !== 'Custom' ? new Date().toISOString().split('T')[0] : ''
    }));
  };

  const renderReportDetails = () => {
    if (!reportData || !showReportDetails) return null;

    const reportType = formData.reportType.toLowerCase();
    const report = reportData.report?.report || reportData.report;
    const summary = report?.summary;

    return (
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Report Details</h2>
          <button
            onClick={() => setShowReportDetails(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">${reportData.TotalRevenue?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{reportData.TotalInvoice?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">${reportData.TotalCredit?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-500">Total Credit</div>
            </div>
          </div>
        </div>

        {/* Report Type Specific Details */}
        {reportType === 'inventory' && summary && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Inventory Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.totalItems}</div>
                <div className="text-sm text-gray-500">Total Items</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.totalQuantity}</div>
                <div className="text-sm text-gray-500">Total Quantity</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">${summary.totalValue}</div>
                <div className="text-sm text-gray-500">Total Value</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.lowStockItems}</div>
                <div className="text-sm text-gray-500">Low Stock</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.outOfStockItems}</div>
                <div className="text-sm text-gray-500">Out of Stock</div>
              </div>
            </div>

            {report.inventory && report.inventory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Inventory Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.inventory.slice(0, 5).map((item, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2">{item.Product?.name}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">
                            {item.Store?.name || 'N/A'}
                            {item.Room && ` / ${item.Room.name}`}
                            {item.Rack && ` / ${item.Rack.name}`}
                            {item.Freezer && ` / ${item.Freezer.name}`}
                          </td>
                          <td className="px-4 py-2">
                            {new Date(item.lastUpdated).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {report.inventory.length > 5 && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                      Showing 5 of {report.inventory.length} items
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {reportType === 'credit' && summary && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Credit Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">${summary.totalCreditGiven}</div>
                <div className="text-sm text-gray-500">Total Credit Given</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">${summary.totalOutstanding}</div>
                <div className="text-sm text-gray-500">Total Outstanding</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.creditUtilization?.toFixed(2)}%</div>
                <div className="text-sm text-gray-500">Credit Utilization</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.overdueInvoices}</div>
                <div className="text-sm text-gray-500">Overdue Invoices</div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'expenditure' && summary && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Expenditure Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{summary.totalExpenditures}</div>
                <div className="text-sm text-gray-500">Total Expenditures</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">${summary.totalAmount}</div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">${summary.verifiedAmount}</div>
                <div className="text-sm text-gray-500">Verified Amount</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">${summary.pendingAmount}</div>
                <div className="text-sm text-gray-500">Pending Amount</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p>Report generated on: {new Date().toLocaleString()}</p>
          <p>Report type: {formData.reportType}</p>
          <p>Date range: {formData.startDate || 'All time'} to {formData.endDate || 'Now'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 flex flex-col">
        <Header title="Reports & Analytics" />

        <div className="flex-1 p-6">
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Generate comprehensive business reports</h1>
              <p className="text-gray-600 mt-1">Analyze performance and export data for insights</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaDollarSign className="text-blue-600 text-xl" />
                  </div>
                  <span className={`text-sm font-medium ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">${stats.revenue.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">Total Revenue</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaBox className="text-green-600 text-xl" />
                  </div>
                  <span className={`text-sm font-medium ${stats.inventoryChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.inventoryChange >= 0 ? '+' : ''}{stats.inventoryChange}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.inventory.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">Total Inventory Items</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <FaReceipt className="text-yellow-600 text-xl" />
                  </div>
                  <span className={`text-sm font-medium ${stats.invoicesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.invoicesChange >= 0 ? '+' : ''}{stats.invoicesChange}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.invoices}</div>
                <div className="text-sm text-gray-500 mt-1">Total Invoices</div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaCreditCard className="text-purple-600 text-xl" />
                  </div>
                  <span className={`text-sm font-medium ${stats.creditChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.creditChange >= 0 ? '+' : ''}{stats.creditChange}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">${stats.credit.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">Total Credit</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
              {/* Generate Report Form */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Generate Report</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                    <FaExclamationCircle className="text-red-500 mt-0.5" />
                    <div className="text-red-700 text-sm">{error}</div>
                  </div>
                )}

                <form>
                  <div className="space-y-6">
                    {/* Report Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['inventory', 'credit', 'expenditure'].map(type => (
                          <label key={type} className="flex items-center">
                            <input
                              type="radio"
                              name="reportType"
                              value={type}
                              checked={formData.reportType === type}
                              onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
                              className="mr-2"
                            />
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Week', 'Month', 'Quarter', 'Year', 'Custom'].map(range => (
                          <button
                            type="button"
                            key={range}
                            onClick={() => handleDateRangeChange(range)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${formData.dateRange === range
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (Optional)</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for all time</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for current date</p>
                      </div>
                    </div>

                    {/* Export Format */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                      <div className="grid grid-cols-3 gap-3">
                        <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.exportFormat === 'JSON' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                          <input
                            type="radio"
                            name="exportFormat"
                            value="JSON"
                            checked={formData.exportFormat === 'JSON'}
                            onChange={(e) => setFormData(prev => ({ ...prev, exportFormat: e.target.value }))}
                            className="sr-only"
                          />
                          <FaFilePdf className="text-red-500 text-xl mb-2" />
                          <span className="text-sm">JSON</span>
                        </label>
                        <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.exportFormat === 'Excel' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                          <input
                            type="radio"
                            name="exportFormat"
                            value="Excel"
                            checked={formData.exportFormat === 'Excel'}
                            onChange={(e) => setFormData(prev => ({ ...prev, exportFormat: e.target.value }))}
                            className="sr-only"
                          />
                          <FaFileExcel className="text-green-500 text-xl mb-2" />
                          <span className="text-sm">Excel</span>
                        </label>
                        <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.exportFormat === 'CSV' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                          <input
                            type="radio"
                            name="exportFormat"
                            value="CSV"
                            checked={formData.exportFormat === 'CSV'}
                            onChange={(e) => setFormData(prev => ({ ...prev, exportFormat: e.target.value }))}
                            className="sr-only"
                          />
                          <FaFileCsv className="text-blue-500 text-xl mb-2" />
                          <span className="text-sm">CSV</span>
                        </label>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors font-medium ${loading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                        onClick={handleGenerateReport}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>Generating Report...</span>
                        </>
                      ) : (
                        <>
                          <FaDownload />
                          <span>Generate & Download Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Display Report Results */}
              {renderReportDetails()}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;