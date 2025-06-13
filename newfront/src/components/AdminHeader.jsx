// src/components/admin/AdminLayout.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, faUsers, faClinicMedical, faStore, 
  faPaw, faMoneyBillWave, faClipboardList, faBook,
  faMapMarkerAlt, faComments, faBell, faCog, faUserShield,
  faChartLine, faUser, faSignOutAlt, faQrcode,
  faLightbulb, faMicrochip, faExclamationTriangle, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationContext } from './NotificationContext';
import axios from 'axios';
import LogiImg from "../assets/petLogo.png";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useContext(NotificationContext);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.dropdown-button')) {
        setNotificationsOpen(false);
        setProfileOpen(false);
        setNavDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('http://localhost:5000/api/admin/notifications', {
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

  // Handle notification click
  const handleNotificationClick = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.patch(
        `http://localhost:5000/api/admin/notifications/${notificationId}/read`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  // Main navigation items (shown in header)
  const mainNavItems = [
    { path: '/admin/dashboard', icon: faTachometerAlt, label: 'Dashboard' },
    { path: '/admin/pet-owner', icon: faUsers, label: 'Pet Owners' },
    { path: '/admin/pets', icon: faPaw, label: 'Pets' },
    { path: '/admin/vets', icon: faClinicMedical, label: 'Clinics' },
    { path: '/admin/shops', icon: faStore, label: 'Shops' }
  ];

  // Secondary navigation items (shown in dropdown)
  const secondaryNavItems = [
    { path: '/admin/doctors', icon: faUserShield, label: 'Doctors' },
    { path: '/admin/payments', icon: faMoneyBillWave, label: 'Payments' },
    { path: '/admin/approvals', icon: faClipboardList, label: 'Approvals' },
    { path: '/admin/library', icon: faBook, label: 'Library' },
    { path: '/admin/services', icon: faMapMarkerAlt, label: 'Services' },
    { path: '/admin/community', icon: faComments, label: 'Community' },
    { path: '/admin/alerts', icon: faExclamationTriangle, label: 'Tempraturecd Alerts' },
    { path: '/admin/disease-alerts', icon: faExclamationTriangle, label: 'Health Alerts' },

  ];

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
                alt="Pet Cuddles Logo"
                className="h-10 w-auto"
                style={{ transform: "scale(3)", transformOrigin: "center" }}
              />
              <span className="text-3xl font-bold text-[#E59560] ml-6 font-laila">Pet Cuddles</span>
            </motion.div>
          </div>

          {/* Main Navigation */}
          <div className="hidden lg:flex items-center space-x-6 ml-10">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  px-3 py-2 rounded-md text-sm font-medium transition
                  ${isActive ? 'bg-[#E59560] text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-[#E59560]'}
                `}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-2" />
                {item.label}
              </NavLink>
            ))}
            
            {/* More dropdown */}
            <div className="relative dropdown-button">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition
                  ${navDropdownOpen ? 'bg-gray-100 text-[#E59560]' : 'text-gray-700 hover:bg-gray-100 hover:text-[#E59560]'}`}
                onClick={() => setNavDropdownOpen(!navDropdownOpen)}
              >
                More
                <FontAwesomeIcon 
                  icon={navDropdownOpen ? faChevronUp : faChevronDown} 
                  className="ml-2 text-xs" 
                />
              </motion.button>
              
              <AnimatePresence>
                {navDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                  >
                    {secondaryNavItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                          block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#E59560]
                          ${isActive ? 'bg-gray-100 text-[#E59560]' : ''}
                        `}
                        onClick={() => setNavDropdownOpen(false)}
                      >
                        <FontAwesomeIcon icon={item.icon} className="mr-3" />
                        {item.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <div className="relative dropdown-button">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-full text-gray-600 hover:text-[#E59560] hover:bg-gray-100 transition"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <FontAwesomeIcon icon={faBell} className="text-xl" />
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
                          <NavLink
                            key={notification._id}
                            to={notification.link || '#'}
                            className={`block px-4 py-2 hover:bg-gray-100 ${!notification.read ? 'font-semibold' : ''}`}
                            onClick={() => {
                              handleNotificationClick(notification._id);
                              setNotificationsOpen(false);
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
                          </NavLink>
                        ))
                      )}
                    </div>
                    <NavLink 
                      to="/admin/notifications" 
                      className="block text-center py-2 text-sm text-[#e59560] hover:bg-gray-50 font-medium"
                    >
                      View All Notifications
                    </NavLink>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative dropdown-button">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 text-gray-700 font-medium hover:text-[#E59560] transition"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center shadow-md">
                  <FontAwesomeIcon icon={faUser} className="text-white" />
                </div>
                <span>Admin</span>
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
                      onClick={() => navigate("/admin/profile")} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                    >
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-600" />
                      Profile
                    </button>
                    <button 
                      onClick={() => navigate("/admin/settings")}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                    >
                      <FontAwesomeIcon icon={faCog} className="mr-2 text-gray-600" />
                      Settings
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

      {/* Main Content */}
      <main className="pt-20 p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;