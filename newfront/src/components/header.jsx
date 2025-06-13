import React, { useState ,useEffect,useContext} from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser,faComment,faSignOutAlt, faWarning, faMarker, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import {FaBell,FaHandHoldingHeart } from "react-icons/fa";
import { NotificationContext } from './NotificationContext';
import { faPaw ,faBook,faHome,faGlobe,faToolbox,faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ClipboardDocumentListIcon, BellAlertIcon, MapPinIcon, MagnifyingGlassIcon ,QrCodeIcon,ShoppingBagIcon,CpuChipIcon, LightBulbIcon }from "@heroicons/react/24/outline";
import LogiImg from "../assets/petLogo.png"; 
import pawImg from "../assets/paw.png"; 
import food from "../assets/dog-food.png"; 
import axios from "axios";
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { toast } from "react-toastify";
import { useChat } from './ChatProvider';
import { motion, AnimatePresence } from 'framer-motion';

import { Link } from "react-router-dom";
const Header = () => {
const navigate = useNavigate();
  const { startChat } = useChat();
  const [profileOpen, setProfileOpen] = useState(false);
  const [petOpen, setPetOpen] = useState(false);
  const { unreadMessagesCount } = useChat();
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
    const { notifications, setNotifications, unreadCount, setUnreadCount } = useContext(NotificationContext);
    const [counts, setCounts] = useState({
  appointments: 0,
  diseases: 0,
  temperature: 0
});


    // Close dropdowns when clicking outside
    useEffect(() => {
  const handleClickOutside = (event) => {
    const isNotificationButton = event.target.closest('.notification-button');
    const isNotificationMenu = event.target.closest('.notification-menu');

    if (!isNotificationMenu && !isNotificationButton) {
      setNotificationsDropdownOpen(false);
    }

    const isProfileButton = event.target.closest('.dropdown-button');
    const isProfileMenu = event.target.closest('.dropdown-menu');
     const isPetMenu = event.target.closest('.pet-menu');
    if (!isProfileMenu && !isProfileButton && !isPetMenu) {
      setProfileOpen(false);
      setServicesDropdownOpen(false);
      setPetOpen(false);
    }

  };

  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);





  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/notifications', {
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


  
// Fetch alert counts from backend
useEffect(() => {
  const fetchAlertCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Fetch all counts in parallel
      const [appointmentsRes, diseasesRes, temperatureRes] = await Promise.all([
        axios.get('http://localhost:5000/api/appointment/reminder-count', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/disease/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/weather/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCounts({
        appointments: appointmentsRes.data.count || 0,
        diseases: diseasesRes.data.count || 0,
        temperature: temperatureRes.data.count || 0
      });
    } catch (error) {
      console.error('Error fetching alert counts:', error);
    }
  };

  fetchAlertCounts();
}, []);


  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };


   // Mark notification as read when clicked
   const handleNotificationClick = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.patch(
        `http://localhost:5000/api/notifications/${notificationId}/read`, 
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

  return (
    <header className="w-full bg-[#F6F4E8] shadow-md fixed top-0 z-50 h-20 flex items-center">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo and Branding */}
        <div className="flex items-center overflow-visible" style={{ height: "60px" }}>
             <img src={LogiImg} alt="PetCuddles Logo"
               style={{
             transform: "scale(3)",
             transformOrigin: "center",
              height: "40px",
              width: "auto",
              }}
            />
            <span className="text-3xl font-bold text-[#E59560] ml-6">Pet Cuddles</span> {/* Increased margin */}
        </div>

     
            

        {/* Navigation Menu */}
        <nav className="flex items-center space-x-6 relative text-[#325747] font-semibold font-laila">
          <a href="/Home" className="flex items-center space-x-2 hover:text-[#e59560] transition">
            <FontAwesomeIcon icon={faHome} /> 
            <span>Home</span>
          </a>
           
          {/* Dropdown */}
          <div className="relative">
            <button
              className="flex items-center text-[#325747] hover:text-[#E59560] space-x-2 focus:outline-none dropdown-button"
              onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
            >
              <FontAwesomeIcon icon={faToolbox} />
              <span>Services </span><ChevronDownIcon className="w-4 h-4" style={{marginLeft:"-2px"}}/> 
            </button>

             {servicesDropdownOpen && (
              <div
                id="dropdown-menu"
                className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-md p-2 text-[#325747]"
              >
              
                <a href="/vet-discovery" className="flex items-center px-4 py-2  hover:bg-gray-100">
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-blue-500" /> Veterinary Services
                </a>
                <a href="/owner/library" className="flex items-center px-4 py-2 hover:bg-gray-100">
                  <FontAwesomeIcon icon={faBook}  className=" w-5 h-5  mr-2 text-green-500" />
                   Educational Library
                </a>
                <a href="/pet-health/skin-analysis" className="flex items-center px-4 py-2 hover:bg-gray-100">
                   <CpuChipIcon className="w-5 h-5 mr-2 text-indigo-500" /> AI Pet Health Check
               </a>
                <a href="/behavior" className="flex items-center px-4 py-2  hover:bg-gray-100">
                   <LightBulbIcon className="w-5 h-5 mr-2 text-purple-500" />  Behavior Analysis
                </a>
                <a href="/pet-nutrition" className="flex items-center px-4 py-2  hover:bg-gray-100">
                  <img src={food} alt="Search" className="w-5 h-5 mr-2" />
                      Pet Nutrition
                </a>
               <a href="/digital-pet-id" className="flex items-center px-4 py-2  hover:bg-gray-100">
                 <QrCodeIcon className="w-5 h-5 mr-2 text-blue-500" /> Digital Pet ID
               </a>
               <a href="/owner/shops" className="flex items-center px-4 py-2  hover:bg-gray-100">
                  <ShoppingBagIcon className="w-5 h-5 mr-2 text-teal-500" /> Pet Supply Stores
              </a>
            </div>
              
            )}
          </div>

          <a href="/community" className=" space-x-2 hover:text-[#E59560]">
               <FontAwesomeIcon icon={faGlobe} />
              <span>Community</span>
          </a>
          <a href="/adoption" className="hover:text-[#E59560] ">
             <FontAwesomeIcon icon={faHandHoldingHeart} className=" mr-2"/>
             Adoption
          </a>
          <a href="/travel-guid" className="hover:text-[#E59560] ">
             <FontAwesomeIcon icon={faMapMarkerAlt} className=" mr-2"/>
             Travel Guid
          </a>

  
          <a href="/alerts/dashboard" className="text-[#325747] hover:text-[#E59560] relative">
             <FontAwesomeIcon icon={faWarning} className=" mr-2"/>
              Alerts 
             {(counts.appointments + counts.diseases + counts.temperature) > 0 && (
               <span className="absolute -top-1 -right-3 bg-[#E59560] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {counts.appointments + counts.diseases + counts.temperature}
              </span>
             )}
         </a>

        </nav>

        {/* Call-to-Action Buttons */}
        <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
 <button 
  className="notification-button text-[#e59560] text-xl flex items-center py-2"
  onClick={(e) => {
    e.stopPropagation(); // prevent immediate close
    setNotificationsDropdownOpen(!notificationsDropdownOpen);
  }}
>

    <FaBell />
    {unreadCount > 0 && (
      <span className="absolute bg-[#325747] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full" 
            style={{marginLeft:"7px",marginTop:"-19px"}}>
        {unreadCount}
      </span>
    )}
  </button>

{notificationsDropdownOpen && (
    <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md p-2 max-h-80 overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="p-2 text-gray-500">No notifications</div>
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
      {notifications.length > 0 && (
        <Link 
          to="/notifications" 
          className="block text-center text-sm text-[#E59560] p-2 hover:bg-gray-100"
          onClick={() => setNotificationsDropdownOpen(false)}
        >
          View All
        </Link>
      )}
    </div>
  )}
</div>

      <a href="/chat" className="relative text-[#325747] hover:text-[#E59560]">
          <FontAwesomeIcon icon={faComment} className=" w-5 h-5   text-[#e59560]"  />
         {unreadMessagesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#325747] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {unreadMessagesCount}
          </span>
         )}
      </a>

           {/* Pet DropDown */}
           <div className="relative pet-menu">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 text-gray-700 font-medium hover:text-[#E59560] transition"
                onClick={() => setPetOpen(!petOpen)}
              >
          
                  <FontAwesomeIcon icon={faPaw} className="w-5 h-5   text-[#e59560]" />
                
              </motion.button>
              
              <AnimatePresence>
                {petOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                  >
                    <button 
                      onClick={() => navigate("/ownerpets")} 
                      className="w-full text-left px-4 py-2 font-laila flex text-[#325747] items-center"
                    >
                      <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#e59560]" />
                      Your Pets
                    </button>  
                    <button 
                      onClick={() => navigate("/adoption/requests")} 
                      className="w-full text-left px-4 py-2  font-laila text-[#325747] flex items-center"
                    >
                      <FaHandHoldingHeart className="text-[#e59560] text-xl mr-2" />
                      Adoption Requests 
                    </button>


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
                      onClick={() => navigate("/UserProfile")} 
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
    </header>
  );
};

export default Header;
