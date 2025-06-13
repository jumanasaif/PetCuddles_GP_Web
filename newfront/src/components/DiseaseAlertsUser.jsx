import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, faBell, faCheck,
  faShieldVirus, faInfoCircle, faMapMarkerAlt,
  faChartLine, faChartPie, faToggleOn, faToggleOff
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const DiseaseAlertsUser = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  // Color palette
  const colors = {
    primary: '#325747',
    primaryLight: '#4a7c64',
    secondary: '#E59560',
    secondaryLight: '#F6B17A',
    background: '#F6F4E8',
    accent: '#BACEC1',
    danger: '#E53935',
    warning: '#FFA000',
    success: '#43A047',
    text: '#2D3748',
    textLight: '#718096'
  };

  useEffect(() => {
    fetchActiveAlerts();
    fetchNotifications();
  }, []);

  const fetchActiveAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/disease-alerts/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveAlerts(response.data);
    } catch (error) {
      console.error('Error fetching active alerts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/disease-alerts/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };


  const markAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/disease-alerts/notifications/${alertId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' };
      case 'medium': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' };
      default: return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' };
    }
  };

  const getDiseaseIcon = (severity) => {
    switch (severity) {
      case 'high': return faExclamationTriangle;
      case 'medium': return faShieldVirus;
      default: return faInfoCircle;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila" style={{ marginTop: '80px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#325747] to-[#233c31] text-white p-6 ml-8 mr-8 rounded-3xl shadow-lg "
       
      >
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold">Disease Alert Center</h1>
          <p className="text-gray-300 mt-2">
            Stay informed about disease outbreaks in your area
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex space-x-2">
          {['alerts', 'notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === tab ? 'bg-white text-[#325747]' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'alerts' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Active Alerts */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Alerts</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {activeAlerts.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>

              {/* High Severity */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">High Severity</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {activeAlerts.filter(a => a.severity === 'high').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-red-100">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-800" />
                  </div>
                </div>
              </motion.div>

              {/* Affected Species */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Affected Species</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {[...new Set(activeAlerts.map(alert => alert.species))].length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faShieldVirus} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>

              {/* Unread Notifications */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Unread Notifications</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {notifications.filter(n => !n.read).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faBell} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Active Alerts */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                Active Disease Alerts in Your Area
              </h2>
              
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active disease alerts in your area currently
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAlerts.map((alert) => (
                    <Link 
                      to={`/user/disease-alerts/${alert._id}`}
                      key={alert._id}
                      className="block hover:opacity-90 transition-opacity"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity).border} ${getSeverityColor(alert.severity).bg}`}
                      >
                        <div className="flex items-start">
                          <FontAwesomeIcon 
                            icon={getDiseaseIcon(alert.severity)} 
                            className={`mt-1 mr-3 ${getSeverityColor(alert.severity).text}`}
                          />

                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-bold">
                                {alert.disease} Alert ({alert.species})
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity).text} ${getSeverityColor(alert.severity).bg}`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{alert.message}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {alert.regions.slice(0, 3).map((region, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-xs" />
                                  {region.city}{region.village ? `, ${region.village}` : ''}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs mt-2">
                              <span className="font-medium">Cases:</span> {alert.caseCount} | 
                              <span className="font-medium ml-2">Detected:</span> {new Date(alert.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : activeTab === 'notifications' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faBell} className="text-[#325747]" />
              Your Disease Alert Notifications
            </h2>
            
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No disease alerts received yet
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg border ${
                      notification.read ? 'border-gray-200 bg-gray-50' : 'border-[#325747] bg-white'
                    }`}
                  >
                    <div className="flex items-start">
                      <FontAwesomeIcon 
                        icon={getDiseaseIcon(notification.alertId.severity)} 
                        className={`mt-1 mr-3 ${
                          notification.alertId.severity === 'high' ? 'text-red-500' : 
                          notification.alertId.severity === 'medium' ? 'text-orange-500' : 'text-blue-500'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <Link 
                            to={`/user/disease-alerts/${notification.alertId._id}`}
                            className="font-medium hover:underline"
                          >
                            {notification.alertId.disease} Alert
                          </Link>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-sm text-[#325747] hover:underline flex items-center"
                            >
                              <FontAwesomeIcon icon={faCheck} className="mr-1" />
                              Mark as read
                            </button>
                          )}
                        </div>
                        <p className="text-sm mt-1">{notification.alertId.message}</p>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            Received: {new Date(notification.receivedAt).toLocaleString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            getSeverityColor(notification.alertId.severity).text} ${
                            getSeverityColor(notification.alertId.severity).bg
                          }`}>
                            {notification.alertId.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* Analytics Tab */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
       
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DiseaseAlertsUser;