import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faCalendarAlt, faUserMd, faFlask, 
  faFileMedicalAlt, faUser, faSignOutAlt, faBell,
  faComment, faSpinner, faCog,faGlobe
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useChat } from './ChatProvider';

const DoctorHeader = () => {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const { unreadMessagesCount, fetchChats, setActiveChat } = useChat();

  // Connect to WebSocket for real-time notifications
 useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Only create WebSocket if one doesn't exist
  if (!ws) {
    const websocket = new WebSocket(`ws://localhost:5000/?token=${token}`);
    setWs(websocket);

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          setNotifications(prev => [data.data, ...prev]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      setWs(null); // Reset WebSocket state when closed
    };
  }

  // Cleanup function
  return () => {
    if (ws) {
      ws.close();
    }
  };
}, [ws]); // Only re-run if ws changes

  // Fetch initial notifications
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications/doctor/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  fetchNotifications();
}, []); // Empty dependency array means run only once on mount

  // Fetch doctor profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/doctor/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDoctor(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    if (ws) ws.close();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/notifications/doctor/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setNotifications(prev => 
        prev.map(n => n._id === id ? {...n, read: true} : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
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

  const unreadCount = notifications.filter(n => !n.read).length;


  return (
    <header className="w-full bg-[#F6F4E8] text-white shadow-md fixed top-0 z-50 h-20 flex items-center">
      <div className="container mx-auto flex items-center justify-between px-6">
          {/* Logo and Branding */}
          <div className="flex items-center font-laila">
              <div className="bg-[#e59560] rounded-full w-12 h-12 flex items-center justify-center mr-3">
                  <FontAwesomeIcon icon={faUserMd} className="text-white text-xl" />
               </div>
              <span className="text-2xl font-bold text-[#e59560]">Doctor Portal</span>
         </div>

        
         <nav className="flex items-center space-x-8 ml-10 text-[#325747] font-laila font-semibold">
          <button 
            onClick={() => navigate('/doctor-dashboard')}
            className="flex items-center space-x-2 hover:text-[#e59560] transition"
          >
            <FontAwesomeIcon icon={faHome} className="mr-2" />
            Dashboard
          </button>
           <button 
            onClick={() => navigate('/community')}
            className="flex items-center space-x-2 hover:text-[#e59560] transition"
          >
            <FontAwesomeIcon icon={faGlobe} className="mr-2" />
            Community
          </button>
          <button 
            onClick={() => navigate('/doctor-appointments')}
            className="flex items-center space-x-2 hover:text-[#e59560] transition"
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            Appointments
          </button>
          <button 
            onClick={() => navigate('/doctor-patients')}
            className="flex items-center space-x-2 hover:text-[#e59560] transition"
          >
            <FontAwesomeIcon icon={faFileMedicalAlt} className="mr-2" />
            Patients
          </button>
          <button 
            onClick={() => navigate('/doctor-lab-tests')}
            className="flex items-center space-x-2 hover:text-[#e59560] transition"
          >
            <FontAwesomeIcon icon={faFlask} className="mr-2" />
            Lab Tests
          </button>
        </nav>
      

      <div className="flex items-center space-x-4">
                 {/* Notifications */}
          <div className="relative">
            <button 
              className="relative p-2 rounded-full text-[#E59560]"
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
                      <button
                        key={notification._id}
                        className={`block w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'font-semibold bg-[#fff8e8]' : ''}`}
                        onClick={() => {
                          markAsRead(notification._id);
                          if (notification.link) navigate(notification.link);
                        }}
                      >
                        <p>{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => navigate('/doctor-notifications')}
                  className="block w-full text-center py-2 text-sm text-[#e59560] hover:bg-gray-50"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>

          {/* Chat */}
          <button 
            onClick={() => navigate('/chat')}
            className="relative flex items-center space-x-2 text-[#E59560] transition  font-laila font-semibold"
          >
            <FontAwesomeIcon icon={faComment} className='text-xl '/>
            
            {unreadMessagesCount >= 0 && (
              <span className="absolute -top-1 -right-1 bg-[#325747] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                4
              </span>
            )}
          </button>
                {/* Profile Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center space-x-2 text-[#E59560] font-laila font-semibold hover:text-[#e9a476] transition"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {doctor?.profileImage ? (
                <img 
                  src={`http://localhost:5000${doctor.profileImage}`} 
                  alt={doctor.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#E59560]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-white" />
                </div>
              )}
              <span>{doctor?.name || 'Doctor'}</span>
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
                <button 
                  onClick={() => navigate('/doctor-profile')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Profile
                </button>
                <button 
                  onClick={() => navigate('/doctor-settings')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  <FontAwesomeIcon icon={faCog} className="mr-2" />
                  Settings
                </button>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
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

export default DoctorHeader;
