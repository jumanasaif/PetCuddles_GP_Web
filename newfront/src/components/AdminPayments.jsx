import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, faFilter, faSearch, faCalendarAlt,
  faChartLine, faClinicMedical, faStore, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import AdminLayout from './AdminHeader';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart, registerables } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
Chart.register(...registerables);

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    vetPayments: 0,
    shopPayments: 0,
    thisMonth: 0,
    lastMonth: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    // Chart data state
  const [chartData, setChartData] = useState({
    monthlyTrends: null,
    typeDistribution: null,
    revenueComparison: null
  });


  
  // Fetch chart data
  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/payment-chart-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChartData({
        monthlyTrends: {
          labels: response.data.monthlyTrends.labels,
          datasets: [
            {
              label: 'Vet Subscriptions',
              data: response.data.monthlyTrends.vetData,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Shop Subscriptions',
              data: response.data.monthlyTrends.shopData,
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }
          ]
        },
        typeDistribution: {
          labels: ['Vet Subscriptions', 'Shop Subscriptions'],
          datasets: [
            {
              data: [response.data.typeDistribution.vet, response.data.typeDistribution.shop],
              backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(153, 102, 255, 0.6)'
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(153, 102, 255, 1)'
              ],
              borderWidth: 1
            }
          ]
        },
        revenueComparison: {
          labels: response.data.revenueComparison.labels,
          datasets: [
            {
              label: 'Revenue',
              data: response.data.revenueComparison.data,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };


  useEffect(() => {
    fetchPayments();
    fetchStats();
    fetchChartData();
  }, []);

  useEffect(() => {
    filterAndSortPayments();
  }, [payments, searchTerm, dateRange, paymentTypeFilter, statusFilter, sortConfig]);



  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/payment-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const filterAndSortPayments = () => {
    let result = [...payments];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(payment => 
        payment.name?.toLowerCase().includes(term) ||
        payment.type?.toLowerCase().includes(term) ||
        payment.status?.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (startDate && endDate) {
      result = result.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    // Apply type filter
    if (paymentTypeFilter !== 'all') {
      result = result.filter(payment => payment.type === paymentTypeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(payment => payment.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredPayments(result);
  };

  const getSortValue = (payment, key) => {
    switch(key) {
      case 'date': return new Date(payment.createdAt);
      case 'name': return payment.name.toLowerCase();
      case 'type': return payment.type;
      case 'amount': return payment.amount;
      case 'status': return payment.status;
      default: return payment[key] || '';
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const statusBadge = (status) => {
    switch(status) {
      case 'completed':
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const typeIcon = (type) => {
    return type === 'clinic' ? faClinicMedical : faStore;
  };

  const typeColor = (type) => {
    return type === 'clinic' ? 'text-blue-500' : 'text-purple-500';
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1a2e25] to-[#0f1a15] text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Payments Management</h1>
              <p className="text-gray-300 mt-2">
                Manage and analyze all subscription payments from shops and veterinary clinics
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Total Revenue */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-green-100">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {stats.lastMonth > 0 ? 
                  `${Math.round((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100)}%` : '100%'
                }
              </span>
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          </motion.div>

          {/* Vet Payments */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Vet Subscriptions</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(stats.vetPayments)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-blue-100">
                <FontAwesomeIcon icon={faClinicMedical} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ 
                    width: stats.totalRevenue > 0 ? 
                      `${(stats.vetPayments / stats.totalRevenue) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalRevenue > 0 ? 
                  `${Math.round((stats.vetPayments / stats.totalRevenue) * 100)}% of total` : '0% of total'
                }
              </p>
            </div>
          </motion.div>

          {/* Shop Payments */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Shop Subscriptions</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(stats.shopPayments)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-purple-100">
                <FontAwesomeIcon icon={faStore} className="text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-purple-500 rounded-full" 
                  style={{ 
                    width: stats.totalRevenue > 0 ? 
                      `${(stats.shopPayments / stats.totalRevenue) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalRevenue > 0 ? 
                  `${Math.round((stats.shopPayments / stats.totalRevenue) * 100)}% of total` : '0% of total'
                }
              </p>
            </div>
          </motion.div>

          {/* This Month */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(stats.thisMonth)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-amber-100">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.thisMonth >= stats.lastMonth ? (
                <span className="text-green-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {stats.lastMonth > 0 ? 
                    `${Math.round((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100)}%` : '100%'
                  }
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {Math.abs(Math.round((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100))}%
                </span>
              )}
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search payments..."
                className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Date Range */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
              </div>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Select date range"
                className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent"
              />
            </div>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                className="rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent w-full"
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="clinic">Vet Subscriptions</option>
                <option value="shop">Shop Subscriptions</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                className="rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="succeeded">Completed</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
         <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-white rounded-xl shadow-sm p-6"
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <FontAwesomeIcon icon={faChartLine} className="text-[#325747]" />
        Payment Trends
      </h2>
      <div className="flex gap-2">
        <button className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg">
          Monthly
        </button>
        <button className="text-sm bg-[#325747] text-white px-3 py-1 rounded-lg">
          Yearly
        </button>
      </div>
    </div>
    
    {/* Monthly Trends Line Chart */}
    <div className="bg-gray-50 rounded-lg p-4 h-96">
      {chartData.monthlyTrends ? (
        <Line 
          data={chartData.monthlyTrends}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Monthly Subscription Revenue',
                font: {
                  size: 16
                }
              },
              legend: {
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + (value / 100).toLocaleString();
                  }
                }
              }
            }
          }}
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Loading chart data...</p>
        </div>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Type Distribution Pie Chart */}
      <div className="bg-gray-50 rounded-lg p-4 h-80">
        {chartData.typeDistribution ? (
          <Pie 
            data={chartData.typeDistribution}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Revenue by Subscription Type',
                  font: {
                    size: 14
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = Math.round((value / total) * 100);
                      return `${label}: $${(value / 100).toLocaleString()} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        )}
      </div>
      
      {/* Revenue Comparison Bar Chart */}
      <div className="bg-gray-50 rounded-lg p-4 h-80">
        {chartData.revenueComparison ? (
          <Bar 
            data={chartData.revenueComparison}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Revenue Comparison',
                  font: {
                    size: 14
                  }
                },
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '$' + (value / 100).toLocaleString();
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        )}
      </div>
    </div>
  </motion.div>

        {/* Payments Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || dateRange[0] || paymentTypeFilter !== 'all' || statusFilter !== 'all' ? 
                  'No matching payments found' : 'No payments recorded'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#325747]">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortConfig.key === 'date' ? (
                          sortConfig.direction === 'asc' ? (
                            <FontAwesomeIcon icon={faChevronUp} className="ml-1" />
                          ) : (
                            <FontAwesomeIcon icon={faChevronDown} className="ml-1" />
                          )
                        ) : (
                          <FontAwesomeIcon icon={faChevronUp} className="ml-1 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortConfig.key === 'name' ? (
                          sortConfig.direction === 'asc' ? (
                            <FontAwesomeIcon icon={faChevronUp} className="ml-1" />
                          ) : (
                            <FontAwesomeIcon icon={faChevronDown} className="ml-1" />
                          )
                        ) : (
                          <FontAwesomeIcon icon={faChevronUp} className="ml-1 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('type')}
                    >
                      <div className="flex items-center">
                        Type
                        {sortConfig.key === 'type' ? (
                          sortConfig.direction === 'asc' ? (
                            <FontAwesomeIcon icon={faChevronUp} className="ml-1" />
                          ) : (
                            <FontAwesomeIcon icon={faChevronDown} className="ml-1" />
                          )
                        ) : (
                          <FontAwesomeIcon icon={faChevronUp} className="ml-1 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('amount')}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortConfig.key === 'amount' ? (
                          sortConfig.direction === 'asc' ? (
                            <FontAwesomeIcon icon={faChevronUp} className="ml-1" />
                          ) : (
                            <FontAwesomeIcon icon={faChevronDown} className="ml-1" />
                          )
                        ) : (
                          <FontAwesomeIcon icon={faChevronUp} className="ml-1 opacity-30" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortConfig.key === 'status' ? (
                          sortConfig.direction === 'asc' ? (
                            <FontAwesomeIcon icon={faChevronUp} className="ml-1" />
                          ) : (
                            <FontAwesomeIcon icon={faChevronDown} className="ml-1" />
                          )
                        ) : (
                          <FontAwesomeIcon icon={faChevronUp} className="ml-1 opacity-30" />
                        )}
                      </div>
                    </th>
                    
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <motion.tr 
                      key={payment._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FontAwesomeIcon 
                            icon={typeIcon(payment.type)} 
                            className={`mr-2 ${typeColor(payment.type)}`} 
                          />
                          {payment.type === 'clinic' ? 'Vet Subscription' : 'Shop Subscription'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default PaymentManagement;
