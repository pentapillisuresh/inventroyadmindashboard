import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { FaDownload, FaFilePdf, FaFileExcel, FaFileCsv, FaChartBar, FaChartLine, FaChartPie, FaDollarSign, FaBox, FaReceipt, FaCreditCard } from 'react-icons/fa';
import { storage } from '../data/storage';

const ReportsAnalytics = ({ onLogout }) => {
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({
    reportType: 'Inventory',
    dateRange: 'Month',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    exportFormat: 'PDF'
  });

  const [stats, setStats] = useState({
    revenue: 284500,
    revenueChange: 12.5,
    inventory: 1245,
    inventoryChange: 8.3,
    invoices: 48,
    invoicesChange: 5,
    credit: 425800,
    creditChange: 15.2
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = storage.getReports();
    setReports(allReports);
  };

  const handleGenerateReport = (e) => {
    e.preventDefault();
    
    const reportName = `${formData.reportType} Report - ${formData.dateRange} (${formData.startDate} to ${formData.endDate})`;
    const size = `${(Math.random() * 2 + 0.5).toFixed(1)} MB`;
    
    const newReport = {
      name: reportName,
      type: formData.reportType,
      date: new Date().toISOString().split('T')[0],
      size: size,
      downloadUrl: '#',
      description: `${formData.reportType} analysis for ${formData.dateRange} period`
    };
    
    storage.addReport(newReport);
    loadReports();
    
    // Simulate download
    alert(`Report generated successfully!\n\nName: ${reportName}\nFormat: ${formData.exportFormat}\nSize: ${size}`);
  };

  const handleDownloadReport = (report) => {
    alert(`Downloading: ${report.name}\nSize: ${report.size}\nFormat: ${report.type}`);
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'Inventory': return <FaBox className="text-blue-500" />;
      case 'Invoice': return <FaReceipt className="text-green-500" />;
      case 'Credit': return <FaCreditCard className="text-purple-500" />;
      case 'Expense': return <FaDollarSign className="text-red-500" />;
      default: return <FaFilePdf className="text-gray-500" />;
    }
  };

  const handleDateRangeChange = (range) => {
    const today = new Date();
    let startDate = new Date();
    
    switch (range) {
      case 'Week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'Quarter':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'Year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(today.getMonth() - 1);
    }
    
    setFormData(prev => ({
      ...prev,
      dateRange: range,
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }));
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
                <div className="text-xs text-gray-400 mt-2">+12.5% from last period</div>
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
                <div className="text-sm text-gray-500 mt-1">Total Inventory</div>
                <div className="text-xs text-gray-400 mt-2">+8.3% from last period</div>
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
                <div className="text-xs text-gray-400 mt-2">+5 from last period</div>
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
                <div className="text-xs text-gray-400 mt-2">+15.2% from last period</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Generate Report Form */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Generate Report</h2>
                
                <form onSubmit={handleGenerateReport}>
                  <div className="space-y-6">
                    {/* Report Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Inventory', 'Invoice', 'Credit', 'Expense'].map(type => (
                          <label key={type} className="flex items-center">
                            <input
                              type="radio"
                              name="reportType"
                              value={type}
                              checked={formData.reportType === type}
                              onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
                              className="mr-2"
                            />
                            <span>{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['Week', 'Month', 'Quarter', 'Year'].map(range => (
                          <button
                            type="button"
                            key={range}
                            onClick={() => handleDateRangeChange(range)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              formData.dateRange === range
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Export Format */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                      <div className="grid grid-cols-3 gap-3">
                        <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.exportFormat === 'PDF' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name="exportFormat"
                            value="PDF"
                            checked={formData.exportFormat === 'PDF'}
                            onChange={(e) => setFormData(prev => ({ ...prev, exportFormat: e.target.value }))}
                            className="sr-only"
                          />
                          <FaFilePdf className="text-red-500 text-xl mb-2" />
                          <span className="text-sm">PDF</span>
                        </label>
                        <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.exportFormat === 'Excel' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
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
                        <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.exportFormat === 'CSV' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
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
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <FaDownload />
                      <span>Generate & Download Report</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Recent Reports */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Reports</h2>
                
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getReportIcon(report.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{report.name}</h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                            <span>{report.type}</span>
                            <span>•</span>
                            <span>{report.date}</span>
                            <span>•</span>
                            <span>{report.size}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <FaDownload />
                        <span className="text-sm">Download</span>
                      </button>
                    </div>
                  ))}
                </div>
                
                {reports.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">No reports generated yet</div>
                    <div className="text-gray-500 text-sm">Generate your first report using the form</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chart Placeholders */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
                  <FaChartLine className="text-blue-500" />
                </div>
                <div className="h-64 bg-gradient-to-b from-blue-50 to-white rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FaChartLine className="text-blue-300 text-4xl mb-2" />
                    <p className="text-gray-500">Revenue chart visualization</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Category Distribution</h3>
                  <FaChartPie className="text-green-500" />
                </div>
                <div className="h-64 bg-gradient-to-b from-green-50 to-white rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FaChartPie className="text-green-300 text-4xl mb-2" />
                    <p className="text-gray-500">Category distribution chart</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;