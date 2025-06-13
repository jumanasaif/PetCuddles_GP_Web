import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  faBox, faBoxOpen, faSearch, 
  faFilter, faChevronDown, faChevronUp,
  faUser, faMapMarkerAlt, faCreditCard,
  faTruck, faCalendarAlt, faInfoCircle,
  faCheckCircle, faTimesCircle, faSpinner,
  faChevronLeft, faChevronRight,
  faPrint, faEllipsisV, faArrowUp, faArrowDown,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ShopLayout from './ShopLayout';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    dateRange: null,
    sort: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userInfoModal, setUserInfoModal] = useState(false);
  const [orderDetailModal, setOrderDetailModal] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Status colors mapping
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  // Payment method icons
  const paymentIcons = {
    cash_on_delivery: faCreditCard,
    credit_card: faCreditCard
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:5000/api/orders/shop?page=${currentPage}`;
      
      // Add search term if exists
      if (debouncedSearchTerm) {
        url += `&search=${debouncedSearchTerm}`;
      }
      
      // Add status filter if exists
      if (filters.status) {
        url += `&status=${filters.status}`;
      }
      
      // Add payment method filter if exists
      if (filters.paymentMethod) {
        url += `&paymentMethod=${filters.paymentMethod}`;
      }
      
      // Add date range filter if exists
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        if (startDate) {
          url += `&startDate=${startDate.toISOString()}`;
        }
        if (endDate) {
          url += `&endDate=${endDate.toISOString()}`;
        }
      }
      
      // Add sorting
      url += `&sort=${filters.sort}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      if (error.response?.status === 404) {
        setOrders([]);
        setTotalPages(1);
      } else {
        toast.error('Failed to load orders');
        console.error('Error fetching orders:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearchTerm, filters, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh the orders list
      setSelectedOrder(null);
      setOrderDetailModal(false);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />;
      case 'processing':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />;
      case 'shipped':
        return <FontAwesomeIcon icon={faTruck} className="mr-2" />;
      case 'delivered':
        return <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />;
      case 'cancelled':
        return <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: '_id',
      cell: (row) => (
        <span className="font-mono text-sm text-gray-600">#{row._id?.slice(-6)?.toUpperCase() || 'N/A'}</span>
      )
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (row) => formatDate(row.createdAt)
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => (
        <div className="flex items-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(row);
              setUserInfoModal(true);
              setOrderDetailModal(false);
            }}
            className="flex items-center hover:text-[#E59560] transition"
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            <span>{row.customerId?.fullName || 'N/A'}</span>
          </button>
        </div>
      )
    },
    {
      header: 'Items',
      accessor: 'items',
      cell: (row) => (
        <div className="flex items-center">
          <FontAwesomeIcon icon={faBox} className="mr-2" />
          <span>{row.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0}</span>
        </div>
      )
    },
    {
      header: 'Total',
      accessor: 'totalAmount',
      cell: (row) => `$${(row.totalAmount || 0).toFixed(2)}`
    },
    {
      header: 'Payment',
      accessor: 'paymentMethod',
      cell: (row) => (
        <div className="flex items-center">
          <FontAwesomeIcon 
            icon={paymentIcons[row.paymentMethod] || faCreditCard} 
            className="mr-2" 
          />
          <span>
            {row.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
             row.paymentMethod === 'credit_card' ? 'Credit Card' : row.paymentMethod || 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
          {getStatusIcon(row.status)}
          {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'N/A'}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionMenu(actionMenu === row._id ? null : row._id);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
          
          {actionMenu === row._id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrder(row);
                  setOrderDetailModal(true);
                  setUserInfoModal(false);
                  setActionMenu(null);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View Details
              </button>
              {row.status !== 'cancelled' && row.status !== 'delivered' && (
                <>
                  {row.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(row._id, 'processing');
                        setActionMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mark as Processing
                    </button>
                  )}
                  {row.status === 'processing' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(row._id, 'shipped');
                        setActionMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {row.status === 'shipped' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(row._id, 'delivered');
                        setActionMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(row._id, 'cancelled');
                      setActionMenu(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.print();
                  setActionMenu(null);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Print Invoice
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  // DataTable component
  const DataTable = ({ columns, data }) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <motion.tr 
                key={rowIndex} 
                className="hover:bg-gray-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex} 
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => {
                      setSelectedOrder(row);
                      setOrderDetailModal(true);
                      setUserInfoModal(false);
                    }}
                  >
                    {column.cell ? column.cell(row) : row[column.accessor]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
      const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
      
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        
        <div className="flex space-x-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 rounded-md border border-gray-300"
              >
                1
              </button>
              {startPage > 2 && <span className="px-3 py-1">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-[#325747] text-white' : 'border border-gray-300'}`}
            >
              {page}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-3 py-1">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 rounded-md border border-gray-300"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  // FilterModal component
  const FilterModal = ({ isOpen, onClose, filters, onApply }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
      onApply(localFilters);
    };

    const handleReset = () => {
      setLocalFilters({
        status: '',
        paymentMethod: '',
        dateRange: null,
        sort: 'newest'
      });
    };

    if (!isOpen) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-lg p-6 w-full max-w-md"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filter Orders</h3>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={localFilters.status}
                onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={localFilters.paymentMethod}
                onChange={(e) => setLocalFilters({...localFilters, paymentMethod: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Methods</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <DatePicker
                selectsRange={true}
                startDate={localFilters.dateRange?.[0]}
                endDate={localFilters.dateRange?.[1]}
                onChange={(update) => {
                  setLocalFilters({...localFilters, dateRange: update});
                }}
                isClearable={true}
                placeholderText="Select date range"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setLocalFilters({...localFilters, sort: 'newest'})}
                  className={`flex items-center px-3 py-1 rounded-md ${localFilters.sort === 'newest' ? 'bg-[#325747] text-white' : 'border border-gray-300'}`}
                >
                  <FontAwesomeIcon icon={faArrowDown} className="mr-2" />
                  Newest First
                </button>
                <button
                  onClick={() => setLocalFilters({...localFilters, sort: 'oldest'})}
                  className={`flex items-center px-3 py-1 rounded-md ${localFilters.sort === 'oldest' ? 'bg-[#325747] text-white' : 'border border-gray-300'}`}
                >
                  <FontAwesomeIcon icon={faArrowUp} className="mr-2" />
                  Oldest First
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setLocalFilters({
                      ...localFilters,
                      dateRange: [today, today]
                    });
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    setLocalFilters({
                      ...localFilters,
                      dateRange: [yesterday, today]
                    });
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  Last 2 Days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const lastWeek = new Date(today);
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    setLocalFilters({
                      ...localFilters,
                      dateRange: [lastWeek, today]
                    });
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today);
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    setLocalFilters({
                      ...localFilters,
                      dateRange: [lastMonth, today]
                    });
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  Last 30 Days
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-[#325747] text-white rounded-md hover:bg-[#28463a]"
            >
              Apply Filters
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // OrderDetailModal component
 const OrderDetailModal = ({ order, onClose, onStatusChange }) => {
    if (!order) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">Order Details</h3>
              <p className="text-sm text-gray-500">#{order._id?.slice(-6)?.toUpperCase() || 'N/A'}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-[#E59560]" />
                Customer Information
              </h4>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {order.customerId?.fullName || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {order.customerId?.phone || 'N/A'}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FontAwesomeIcon icon={faCreditCard} className="mr-2 text-[#E59560]" />
                Payment Information
              </h4>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Method:</span> 
                  {order.paymentMethod === 'cash_on_delivery' ? ' Cash on Delivery' : 
                   order.paymentMethod === 'credit_card' ? ' Credit Card' : ` ${order.paymentMethod || 'N/A'}`}
                </p>
                <p><span className="font-medium">Status:</span> {order.paymentStatus || 'N/A'}</p>
                <p><span className="font-medium">Total:</span> ${(order.totalAmount || 0).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FontAwesomeIcon icon={faTruck} className="mr-2 text-[#E59560]" />
                Delivery Information
              </h4>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}
                  </span>
                </p>
                {order.deliveryAddress ? (
                  <>
                    <p><span className="font-medium">Address:</span> {order.deliveryAddress.street || 'N/A'}</p>
                    <p><span className="font-medium">City:</span> {order.deliveryAddress.city || 'N/A'}</p>
                    {order.deliveryAddress.village && (
                      <p><span className="font-medium">Village:</span> {order.deliveryAddress.village}</p>
                    )}
                  </>
                ) : (
                  <p>No delivery address (pickup)</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.productId?.images?.[0]?.data ? (
                            <img 
                              src={item.productId.images[0].data} 
                              alt={item.productName}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                              <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.productName || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{item.productId?.category || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">${(item.priceAtPurchase || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.quantity || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${((item.priceAtPurchase || 0) * (item.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">Subtotal</td>
                    <td className="px-6 py-4 whitespace-nowrap">${(order.subtotal || 0).toFixed(2)}</td>
                  </tr>
                  {(order.discount || 0) > 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right font-medium">Discount</td>
                      <td className="px-6 py-4 whitespace-nowrap">-${(order.discount || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  {(order.deliveryCost || 0) > 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right font-medium">Delivery</td>
                      <td className="px-6 py-4 whitespace-nowrap">${(order.deliveryCost || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right font-medium">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">${(order.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Ordered on {formatDate(order.createdAt)}
              </p>
            </div>
            
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => onStatusChange(order._id, 'processing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Mark as Processing
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => onStatusChange(order._id, 'shipped')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Mark as Shipped
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={() => onStatusChange(order._id, 'delivered')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Mark as Delivered
                  </button>
                )}
                <button
                  onClick={() => onStatusChange(order._id, 'cancelled')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // UserInfoModal component
   const UserInfoModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-lg p-6 w-full max-w-md"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">Customer Details</h3>
              <p className="text-sm text-gray-500">{user.customerId?.fullName || 'N/A'}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <FontAwesomeIcon icon={faUser} className="text-[#E59560] text-xl" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Personal Information</h4>
                <div className="mt-2 space-y-1">
                  <p><span className="font-medium">Name:</span> {user.customerId?.fullName || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {user.customerId?.email || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {user.customerId?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#E59560] text-xl" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Delivery Address</h4>
                {user.deliveryAddress ? (
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Street:</span> {user.deliveryAddress.street || 'N/A'}</p>
                    <p><span className="font-medium">City:</span> {user.deliveryAddress.city || 'N/A'}</p>
                    {user.deliveryAddress.village && (
                      <p><span className="font-medium">Village:</span> {user.deliveryAddress.village}</p>
                    )}
                    {user.deliveryAddress.coordinates && (
                      <p>
                        <span className="font-medium">Location:</span> 
                        {user.deliveryAddress.coordinates.lat}, {user.deliveryAddress.coordinates.lng}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No delivery address (pickup)</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#325747] text-white rounded-md hover:bg-[#28463a]"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // LoadingSpinner component
   // LoadingSpinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
    </div>
  );

  // EmptyState component
  const EmptyState = ({ title, description, buttonText, onButtonClick }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400 text-2xl" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      <button
        onClick={onButtonClick}
        className="px-4 py-2 bg-[#325747] text-white rounded-md hover:bg-[#28463a]"
      >
        {buttonText}
      </button>
    </motion.div>
  );

  return (
    <ShopLayout activeTab="orders">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <h1 className="text-2xl md:text-3xl font-bold font-laila text-[#325747] flex items-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mr-3"
              >
                <FontAwesomeIcon icon={faBox} className="text-[#E59560]" />
              </motion.div>
              Orders Management
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "150px", marginLeft: "20px" }}></div>
          </motion.div>
          
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-3 md:space-y-0 md:space-x-3">
            <div className="relative flex-grow md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[#E59560] focus:border-[#E59560]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 text-[#325747] border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2 text-[#E59560]" />
              Filters
            </button>
          </div>
        </div>

         {loading && orders.length === 0 ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description={searchTerm || filters.status || filters.paymentMethod || filters.dateRange
              ? "Try adjusting your search or filters"
              : "You haven't received any orders yet."}
            buttonText="Reset Filters"
            onButtonClick={() => {
              setSearchTerm('');
              setFilters({
                status: '',
                paymentMethod: '',
                dateRange: null,
                sort: 'newest'
              });
            }}
          />
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
            >
              <DataTable 
                columns={columns} 
                data={orders}
              />
            </motion.div>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        <FilterModal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onApply={handleFilterChange}
        />

        {orderDetailModal && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => {
              setOrderDetailModal(false);
              setSelectedOrder(null);
            }}
            onStatusChange={handleStatusChange}
          />
        )}

        {userInfoModal && (
          <UserInfoModal
            user={selectedOrder}
            onClose={() => {
              setUserInfoModal(false);
              setSelectedOrder(null);
            }}
          />
        )}
      </div>
    </ShopLayout>
  );
};
export default Orders;
