import React, { useState, useEffect,useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useChat } from './ChatProvider';
import { 
  faHome, faCalendarAlt, faPaw, faBell, faPrescriptionBottleAlt,
  faUser, faSignOutAlt, faHospital, faChartLine, faNotesMedical,
  faMapMarkedAlt, faCog, faUserMd, faFlaskVial, faSpinner,faComment,
  faGlobe
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const VetHeader = () => {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const { unreadMessagesCount } = useChat();
  // Connect to WebSocket when component mounts
// In VetHeader.js
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const websocket = new WebSocket(`ws://localhost:5000/?token=${token}`);
  setWs(websocket);

  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data); // Debug log
      
      if (data.type === "notification") {
        setNotifications(prev => [data.data, ...prev]); // Note: using data.data
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  return () => {
    websocket.close();
  };
}, [navigate]);

const { fetchChats, setActiveChat } = useChat();

useEffect(() => {
  fetchChats();
}, []);

const handleChatSelect = (chat) => {
  setActiveChat(chat);
};

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:5000/api/notifications/clinic/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setNotifications(response.data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    if (ws) ws.close();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/notifications/clinic/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );

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
  return (
    <header className="w-full bg-[#F6F4E8] text-white shadow-md fixed top-0 z-50 h-20 flex items-center">
      <div className="container mx-auto flex items-center justify-between px-6">
        {/* Logo and Branding */}
        <div className="flex items-center">
          <div className="bg-[#e59560] rounded-full w-12 h-12 flex items-center justify-center mr-3">
            <FontAwesomeIcon icon={faHospital} className="text-white text-xl" />
          </div>
          <span className="text-2xl font-bold text-[#e59560]">Vet Dashboard</span>
        </div>

        {/* Main Navigation */}
        <nav className="flex items-center space-x-8 ml-10 text-[#325747] font-laila font-semibold">
          <a href="/clinic" className="flex items-center space-x-2 hover:text-[#e59560] transition">
            <FontAwesomeIcon icon={faHome} />
            <span>Dashboard</span>
          </a>
          <a href="/clinic-appointments" className="flex items-center space-x-2 hover:text-[#e59560] transition">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>Appointments</span>
          </a>
          <a href="/clinic-doctors" className="flex items-center space-x-2 hover:text-[#E59560] transition">
            <FontAwesomeIcon icon={faUserMd} />
            <span>Doctors</span>
          </a>
          <a href="/clinic/patients" className="flex items-center space-x-2 hover:text-[#e59560] transition">
            <FontAwesomeIcon icon={faPaw} />
            <span>Patients</span>
          </a>
          <a href="/clinic-vaccinations" className="flex items-center space-x-2 hover:text-[#e59560] transition">
            <FontAwesomeIcon icon={faPrescriptionBottleAlt} />
            <span>Vaccination</span>
          </a>
          <a href="/clinic/lab-test" className="flex items-center space-x-2 hover:text-[#e59560] transition">
            <FontAwesomeIcon icon={faFlaskVial} />
            <span>laboratory</span>
          </a>
        </nav>

        {/* User Controls */}
        <div className="flex items-center space-x-6">
          {/* Notifications */}
          <div className="relative">
            <button 
              className="relative p-2 rounded-full text-[#E59560] "
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <FontAwesomeIcon icon={faBell} className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#325747] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-3 border-b border-gray-200 bg-[#f6f4e8]">
                  <h4 className="font-bold text-[#325747]">Notifications</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center p-4">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-[#325747]" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(notification => (
                      <a 
                        key={notification._id}
                        href={notification.link || "#"}
                        className={`block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'font-semibold bg-[#fff8e8]' : ''}`}
                        onClick={() => markAsRead(notification._id)}
                      >
                        <p>{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </a>
                    ))
                  )}
                </div>
                <a 
                  href="/clinic/notifications" 
                  className="block text-center py-2 text-sm text-[#e59560] hover:bg-gray-50"
                >
                  View All Notifications
                </a>
              </div>
            )}
          </div>
           <a href="/chat" className="relative flex items-center space-x-2 text-[#E59560] transition">
           <FontAwesomeIcon icon={faComment} className="text-xl" />
        
        {unreadMessagesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#325747] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {unreadMessagesCount}
          </span>
        )}
      </a>
          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center space-x-2 text-[#E59560] font-laila font-semibold hover:text-[#e9a476] transition"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-white" />
              </div>
              <span>Vet Profile</span>
              <svg 
                className={`w-4 h-4 transition-transform ${profileOpen ? 'transform rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-[#325747] rounded-md shadow-lg py-1 z-50">
                <a href="/clinic-profile" className="block px-4 py-2 hover:bg-gray-100">
                  <FontAwesomeIcon icon={faUser} className="mr-2 text-[#325747]" />
                   Profile
                </a>
                <a href="/clinic-temporary-care" className="block px-4 py-2 hover:bg-gray-100">
                  <FontAwesomeIcon icon={faCog} className="mr-2 text-[#325747]" />
                  Clinic Settings
                </a>
                <a href="/community" className="block px-4 py-2 hover:bg-gray-100">
                  <FontAwesomeIcon icon={faGlobe} className="mr-2 text-[#325747]" />
                   Community
                </a>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default VetHeader;
