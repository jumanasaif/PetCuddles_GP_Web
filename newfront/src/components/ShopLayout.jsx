// components/shop/Layout.js
import React, { useState, useEffect ,useContext} from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LogiImg from "../assets/petLogo.png"; 
import ProductImg from "../assets/pet-food.png"; 
import { Link } from "react-router-dom";
import { useChat } from './ChatProvider';

import { NotificationContext } from './NotificationContext';

import { 
  faStore, FaUsers, faShoppingCart, 
  faChartLine, faUser, faComment, faSignOutAlt,
  faBell, faHome, faListAlt, faTags, faUsers,faSearch,faMoneyBill,faGlobe
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ShopLayout = ({ children, activeTab }) => {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
   const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
    const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
      const { notifications, setNotifications, unreadCount, setUnreadCount } = useContext(NotificationContext);
  // Sample data - replace with real data from your backend
  const [stats] = useState({
    pendingOrders: 5,
    lowStockItems: 3
  });
  const { unreadMessagesCount } = useChat();
  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get('http://localhost:5000/api/shop/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setShopData(response.data);
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
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/notifications/shop/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(response.data);
    
        setUnreadCount(response.data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
  
    fetchNotifications();
  }, [setNotifications, setUnreadCount]); 


  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

   const handleNotificationClick = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.patch(
        `http://localhost:5000/api/notifications/shop/notifications/${notificationId}/read`, 
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Optional: show error to user
      console.error('Failed to mark notification as read');
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

  return (
    <div className="min-h-screen bg-[#F6F4E8]">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-[#F6F4E8] shadow-md fixed top-0 z-50 h-20 flex items-center border-b border-gray-100"
      >
        <div className="container mx-auto flex items-center justify-between px-6">
          {/* Logo and Branding */}
          <div className="flex items-center">
            <motion.div 
              whileHover={{ rotate: 10 }}
              className="flex items-center overflow-visible" 
              style={{ height: "60px" }}
            >
              <img 
                src={LogiImg} 
                alt="PetShop Logo"
                className="h-10 w-auto"
                style={{ transform: "scale(3)", transformOrigin: "center" }}
              />
              <span className="text-3xl font-bold text-[#E59560] ml-6 font-laila">PetShop</span> 
            </motion.div>
          </div>

          {/* Search Bar - Only visible on larger screens */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-1/3 mx-4">
            <FontAwesomeIcon icon={faSearch} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search products, orders..."
              className="bg-transparent border-none outline-none w-full text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <div className="relative">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-full text-gray-600 hover:text-[#E59560] hover:bg-gray-100 transition"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <FontAwesomeIcon icon={faBell} className="text-2xl text-[#E59560]" />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 bg-[#325747] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>
              
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200"
                  >
                    <div className="p-3 border-b border-gray-200 bg-[#325747]">
                      <h4 className="font-bold text-white">Notifications</h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No notifications</div>
                      ) : (
                         notifications.map(notification => (
          <Link
            key={notification._id}
            to={notification.link || '#'}
            className={`block px-4 py-2 hover:bg-gray-100 ${!notification.read ? 'font-semibold' : ''}`}
            onClick={() => {
              handleNotificationClick(notification._id);
              setNotificationsDropdownOpen(false);
            }}
          >
            <div className="flex justify-between items-start">
              <span>{notification.message}</span>
              {!notification.read && (
                <span className="inline-block w-2 h-2 bg-[#E59560] rounded-full ml-2"></span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(notification.createdAt).toLocaleString()}
            </div>
          </Link>
        ))
                      )}
                    </div>
                    <a 
                      href="/shop/notifications" 
                      className="block text-center py-2 text-sm text-[#e59560] hover:bg-gray-50 font-medium"
                    >
                      View All Notifications
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
             <a href="/chat" className="relative flex items-center space-x-2  text-2xl text-[#E59560] transition">
               <FontAwesomeIcon icon={faComment} />
             {unreadMessagesCount > 0 && (
           <span className="absolute -top-1 -right-1 bg-[#325747] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {unreadMessagesCount}
          </span>
        )}
      </a>
            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 text-gray-700 font-medium hover:text-[#E59560] transition"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center shadow-md">
                  <FontAwesomeIcon icon={faStore} className="text-white" />
                </div>
                <span>{shopData?.shopName || 'Shop'}</span>
              </motion.button>
              
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                  >
                    <button 
                      onClick={() => navigate("/shop/profile")} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                    >
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-600" />
                      Profile
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500 flex items-center"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Sidebar and Main Content */}
      <div className="flex pt-20">
        {/* Sidebar */}
        <motion.aside 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden md:block w-64 bg-[#F6F4E8] shadow-2xl h-screen fixed"
        >
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#325747]">PetShop Admin</h3>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate("/shop")}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition ${activeTab === "dashboard" ? 'bg-[#E59560] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FontAwesomeIcon icon={faHome} className="mr-3" />
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/shop/products")}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition ${activeTab === "products" ? 'bg-[#E59560] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                       <img 
                           src={ProductImg} 
                            alt="PetShop Logo"
                            className=" mr-3"
                            style={{ width:"20px",height:"20px"}}
                       />
                 
                  Products
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/shop/orders")}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition ${activeTab === "orders" ? 'bg-[#E59560] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-3" />
                  Orders
                  <span className="ml-auto bg-[#325747] text-white text-xs px-2 py-1 rounded-full">
                    {stats.pendingOrders}
                  </span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/shop/inventory")}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition ${activeTab === "inventory" ? 'bg-[#E59560] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FontAwesomeIcon icon={faListAlt} className="mr-3" />
                  Inventory
                  {stats.lowStockItems > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {stats.lowStockItems}
                    </span>
                  )}
                </button>
              </li>
               <li>
                <button 
                  onClick={() => navigate("/shop/coupons")}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition ${activeTab === "customers" ? 'bg-[#E59560] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FontAwesomeIcon icon={faMoneyBill} className="mr-3"/>
                  Coupons
                </button>
              </li>
              <li>
         
              </li>
              <li>
                <button 
                  onClick={() => navigate("/community")}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition ${activeTab === "community" ? 'bg-[#E59560] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FontAwesomeIcon icon={faGlobe} className="mr-3" />
                  Community
                </button>
              </li>
            </ul>
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;