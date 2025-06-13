// components/WeatherAlertsUser.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThermometerHalf, faExclamationTriangle, 
  faSnowflake, faSun, faBell, faCheck,
  faTemperatureHigh, faTemperatureLow
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const WeatherAlertsUser = () => {
  const [alerts, setAlerts] = useState([]);
  const [currentAlerts, setCurrentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    fetchAlerts();
    fetchCurrentAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pets/weather-alerts/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const fetchCurrentAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pets/current-weather-alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentAlerts(response.data);
    } catch (error) {
      console.error('Error fetching current alerts:', error);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/pets/weather-alerts/notifications/${alertId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-400',
        text: 'text-yellow-800',
        icon: 'text-yellow-500'
      },
      danger: {
        bg: 'bg-orange-100',
        border: 'border-orange-400',
        text: 'text-orange-800',
        icon: 'text-orange-500'
      },
      extreme: {
        bg: 'bg-red-50',
        border: 'border-red-400',
        text: 'text-red-800',
        icon: 'text-red-500'
      },
      default: {
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        text: 'text-gray-800',
        icon: 'text-gray-500'
      }
    };
    
    return colors[severity] || colors.default;
  };

  const getThresholdIcon = (type) => {
    return type === 'high' ? faTemperatureHigh : faTemperatureLow;
  };

  const getRecommendations = (alert, petSpecies) => {
    const recommendations = [];
    
    if (alert.thresholdType === 'high') {
      recommendations.push('Ensure access to shade and fresh water at all times');
      recommendations.push('Avoid walks during the hottest parts of the day');
      
      if (petSpecies === 'dog') {
        recommendations.push('Consider a cooling mat or vest for your dog');
        recommendations.push('Watch for signs of heatstroke: excessive panting, drooling, lethargy');
      }
      
      if (petSpecies === 'cat') {
        recommendations.push('Provide cool surfaces like tiles for your cat to lie on');
      }
    } else {
      recommendations.push('Provide warm bedding and shelter');
      recommendations.push('Limit time outdoors in extreme cold');
      
      if (petSpecies === 'dog') {
        recommendations.push('Consider a dog coat for short-haired breeds');
        recommendations.push('Check paws for ice buildup after walks');
      }
    }
    
    return recommendations;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-100 rounded-full mb-4"></div>
          <div className="h-4 bg-blue-100 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto px-4 sm:px-6 lg:px-8 py-6 font-laila bg-[#F6F4E8]" style={{marginTop:"80px"}}>
       {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#325747] to-[#233c31] text-white p-6 rounded-3xl shadow-lg mb-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold"> Weather Alerts</h1>
                    <p className="text-gray-300">
                      Stay informed about weather conditions affecting your pets
                   </p>
                  </div>
                </div>
              </motion.div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('current')}
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'current'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
          Active Alerts
          {currentAlerts.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {currentAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'history'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faBell} className="mr-2" />
          Alert History
        </button>
      </div>

      {/* Current Alerts Tab */}
      <AnimatePresence>
        {activeTab === 'current' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentAlerts.length > 0 ? (
              currentAlerts.map((alert) => {
                const severityColors = getSeverityColor(alert.severity);
                return (
                  <motion.div
                    key={alert._id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl shadow-sm overflow-hidden border ${severityColors.border}`}
                  >
                    <div className={`p-5 ${severityColors.bg}`}>
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${severityColors.bg} flex items-center justify-center mr-4`}>
                          <FontAwesomeIcon 
                            icon={getThresholdIcon(alert.alertId?.thresholdType || 'low')} 
                            className={`text-xl ${severityColors.icon}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-bold ${severityColors.text}`}>
                              {alert.thresholdType === 'high' ? 'High' : 'Low'} Temperature Alert
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColors.bg} ${severityColors.text}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-700">{alert.message || `Current ${alert.thresholdType} temperature warning`}</p>
                          
                          <div className="mt-3 bg-white rounded-lg p-3 border border-gray-100">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Affected Pets:</h4>
                            <div className="flex flex-wrap gap-2">
                              {alert.affectedSpecies.map((species, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded">
                                  {species}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Recommendations:</h4>
                            <ul className="space-y-2">
                              {getRecommendations(alert).map((rec, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2 mt-0.5">
                                    <FontAwesomeIcon icon={faCheck} />
                                  </span>
                                  <span className="text-gray-700">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3 text-sm text-gray-500">
                      Last updated: {new Date(alert.updatedAt || Date.now()).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gray-50 rounded-xl"
              >
                <FontAwesomeIcon icon={faSun} className="text-yellow-400 text-4xl mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No active weather alerts</h3>
                <p className="text-gray-500 mt-1">Your pets are safe from extreme temperatures</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Tab */}
      <AnimatePresence>
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gray-50 rounded-xl"
              >
                <FontAwesomeIcon icon={faBell} className="text-green-400 text-4xl mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No alert history</h3>
                <p className="text-gray-500 mt-1">You haven't received any weather alerts yet</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-lg shadow-xs overflow-hidden border ${
                      alert.read ? 'border-gray-200' : 'border-green-300'
                    }`}
                  >
                    <div className={`p-4 ${alert.read ? 'bg-white' : 'bg-green-50'}`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <FontAwesomeIcon 
                            icon={getThresholdIcon(alert.alertId?.thresholdType)} 
                            className={`text-sm ${
                              alert.alertId?.thresholdType === 'high' ? 'text-orange-500' : 'text-blue-500'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className={`text-sm font-medium ${
                              alert.read ? 'text-gray-700' : 'text-green-800'
                            }`}>
                              {alert.alertId?.thresholdType === 'high' ? 'High' : 'Low'} Temperature Alert
                            </h3>
                            {!alert.read && (
                              <button
                                onClick={() => markAsRead(alert._id)}
                                className="text-xs text-green-600 hover:text-green-800 flex items-center"
                              >
                                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                Mark as read
                              </button>
                            )}
                          </div>
                          <p className="text-sm mt-1 text-gray-600 truncate">{alert.alertId?.message}</p>
                          {alert.petId && (
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <span className="truncate">
                                For {alert.petId.name} ({alert.petId.species})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
                      <span>
                        {new Date(alert.receivedAt).toLocaleString()}
                      </span>
                      {alert.read ? (
                        <span className="text-gray-400">Read</span>
                      ) : (
                        <span className="text-green-500 font-medium">New</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeatherAlertsUser;