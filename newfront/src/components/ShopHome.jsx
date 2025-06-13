import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faStore, faBoxOpen, faShoppingCart, 
  faChartLine, faUser, faCog, faSignOutAlt,
  faBell, faHome, faListAlt, faSpinner, faPlus,
  faSearch, faCalendarAlt, faTags, faUsers
} from "@fortawesome/free-solid-svg-icons";
import ShopLayout from './ShopLayout';

import LogiImg from "../assets/petLogo.png"; 
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Sample data - replace with real data from your backend
  const [stats, setStats] = useState({
    totalProducts: 3,
    pendingOrders: 11,
    completedOrders: 28,
    monthlyRevenue: 1250,
    newCustomers: 5,
    lowStockItems: 1
  });

  const recentOrders = [
    { id: 1001, customer: "Mohammed Omar", total: 45.50, status: "Processing", date: "2023-05-15T10:30:00Z" },
    { id: 1002, customer: "Jumana Saif", total: 32.75, status: "Shipped", date: "2023-05-14T14:45:00Z" },
    { id: 1003, customer: "Malak", total: 68.20, status: "Completed", date: "2023-05-13T09:15:00Z" },
  ];

  const lowStockProducts = [
    { id: 2001, name: "Cat Litter", stock: 3, threshold: 10 },
    { id: 2002, name: "Bird Cage", stock: 1, threshold: 3 }
  ];

  // Sales data for charts
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [1200, 1900, 1500, 2000, 1800, 2200],
        borderColor: '#E59560',
        backgroundColor: 'rgba(229, 149, 96, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const categoryData = {
    labels: ['Food', 'Toys', 'Accessories', 'Health', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#E59560',
          '#325747',
          '#BACEC1',
          '#8AB8A8',
          '#D9B48F'
        ],
        borderWidth: 1
      }
    ]
  };

  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get('http://localhost:5000/api/shop/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setShopData(response.data);

        // Simulate fetching stats from backend
        setTimeout(() => {
          setStats({
            totalProducts: 3,
            pendingOrders: 11,
            completedOrders: 28,
            monthlyRevenue: 1250,
            newCustomers: 5,
            lowStockItems: 1
          });
          setLoading(false);
        }, 1000);

      } catch (err) {
        console.error('Error fetching shop data:', err);
        if (err.response?.status === 401) navigate('/shop-login');
      }
    };

    fetchShopData();
  }, [navigate]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Simulate API call
        setTimeout(() => {
          setNotifications([
            {
              _id: "1",
              message: "New order #1005 received",
              read: false,
              createdAt: new Date(),
              link: "/shop/orders/1005"
            },
            {
              _id: "2",
              message: "3 products are low in stock",
              read: false,
              createdAt: new Date(Date.now() - 3600000),
              link: "/shop/inventory"
            },
            {
              _id: "3",
              message: "Monthly sales report is ready",
              read: true,
              createdAt: new Date(Date.now() - 86400000),
              link: "/shop/reports"
            }
          ]);
        }, 800);

      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      // Simulate API call
      setNotifications(prev => 
        prev.map(n => n._id === id ? {...n, read: true} : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const statusBadge = (status) => {
    switch(status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
  <ShopLayout activeTab="dashboard">
    <div className="p-6">
        {/* Main Content */}
        <main className="flex-col md:flex-row justify-between items-start md:items-center">
          {/* Welcome Banner */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-[#325747] to-[#1E3A2A] text-white p-6 rounded-xl shadow-lg mb-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {shopData?.shopName || 'Shop Owner'}!</h1>
                <p className="text-[#BACEC1] mt-2">Here's what's happening with your shop today.</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/shop/products/new")}
                className="bg-[#E59560] text-white px-6 py-3 rounded-lg flex items-center gap-2 mt-4 md:mt-0 shadow-md"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add New Product
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
          >
            {/* Total Products */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold text-[#325747]">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E59560] bg-opacity-20">
                  <FontAwesomeIcon icon={faBoxOpen} className="text-xl text-[#E59560]" />
                </div>
              </div>
            </motion.div>

            {/* Pending Orders */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Pending Orders</p>
                  <p className="text-2xl font-bold text-[#325747]">{stats.pendingOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-xl text-yellow-600" />
                </div>
              </div>
            </motion.div>

            {/* Completed Orders */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Completed Orders</p>
                  <p className="text-2xl font-bold text-[#325747]">{stats.completedOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-xl text-green-600" />
                </div>
              </div>
            </motion.div>

            {/* Monthly Revenue */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-[#325747]">${stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                  <FontAwesomeIcon icon={faChartLine} className="text-xl text-blue-600" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Charts Row */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Sales Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#325747]">Sales Overview</h3>
                <button className="text-sm text-[#E59560] hover:underline">View Report</button>
              </div>
              <div className="h-64">
                <Line 
                  data={salesData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Categories Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#325747]">Sales by Category</h3>
                <button className="text-sm text-[#E59560] hover:underline">View Details</button>
              </div>
              <div className="h-64">
                <Pie 
                  data={categoryData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Recent Orders and Low Stock */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#325747]">Recent Orders</h3>
                <button 
                  className="px-4 py-2 rounded-lg bg-[#E59560] text-white hover:bg-[#d48a55] transition"
                  onClick={() => navigate("/shop/orders")}
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, index) => (
                      <motion.tr 
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/shop/orders/${order.id}`)}
                      >
                        <td className="py-3 px-4 text-sm text-[#325747] font-medium">#{order.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{order.customer}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">${order.total.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${statusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Stock Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#325747]">Low Stock Products</h3>
                <button 
                  className="px-4 py-2 rounded-lg bg-[#325747] text-white hover:bg-[#28463a] transition"
                  onClick={() => navigate("/shop/inventory")}
                >
                  Manage Inventory
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Current Stock</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product, index) => (
                      <motion.tr 
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/shop/products/${product.id}`)}
                      >
                        <td className="py-3 px-4 text-sm text-[#325747] font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-sm text-red-600">{product.stock}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{product.threshold}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Add Product */}
            <motion.button 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl flex flex-col items-center justify-center bg-white shadow-sm border border-gray-100"
              onClick={() => navigate("/shop/products/new")}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#E59560] bg-opacity-20 mb-4">
                <FontAwesomeIcon icon={faPlus} className="text-2xl text-[#E59560]" />
              </div>
              <h3 className="font-bold text-[#325747]">Add Product</h3>
              <p className="text-sm mt-2 text-center text-gray-600">Add new items to your inventory</p>
            </motion.button>

            {/* Manage Orders */}
            <motion.button 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl flex flex-col items-center justify-center bg-white shadow-sm border border-gray-100"
              onClick={() => navigate("/shop/orders")}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100 mb-4">
                <FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-blue-600" />
              </div>
              <h3 className="font-bold text-[#325747]">Manage Orders</h3>
              <p className="text-sm mt-2 text-center text-gray-600">Process customer orders</p>
            </motion.button>

            {/* View Reports */}
            <motion.button 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl flex flex-col items-center justify-center bg-white shadow-sm border border-gray-100"
              onClick={() => navigate("/shop/reports")}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-purple-100 mb-4">
                <FontAwesomeIcon icon={faChartLine} className="text-2xl text-purple-600" />
              </div>
              <h3 className="font-bold text-[#325747]">View Reports</h3>
              <p className="text-sm mt-2 text-center text-gray-600">Analyze sales and performance</p>
            </motion.button>

            {/* Shop Settings */}
            <motion.button 
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl flex flex-col items-center justify-center bg-white shadow-sm border border-gray-100"
              onClick={() => navigate("/shop/settings")}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 mb-4">
                <FontAwesomeIcon icon={faCog} className="text-2xl text-green-600" />
              </div>
              <h3 className="font-bold text-[#325747]">Shop Settings</h3>
              <p className="text-sm mt-2 text-center text-gray-600">Configure your shop details</p>
            </motion.button>
          </motion.div>
        </main>
    </div>
  </ShopLayout>

  );
};

export default ShopDashboard;