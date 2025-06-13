// components/WeatherAlertsAdmin.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThermometerHalf, faExclamationTriangle, 
  faSnowflake, faSun, faBell, faTrash, faEdit
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Chart } from 'chart.js';
import { Bar } from 'react-chartjs-2';

const WeatherAlertsAdmin = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAlert, setNewAlert] = useState({
    thresholdType: 'high',
    temperature: 30,
    severity: 'warning',
    affectedSpecies: ['dog', 'cat'],
    regions: [],
    message: '',
    durationHours: 24
  });
  const [weatherData, setWeatherData] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchCurrentWeather();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/weather-alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const fetchCurrentWeather = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/check-weather', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const handleCreateAlert = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/weather-alerts', newAlert, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
      setShowCreateForm(false);
      setNewAlert({
        thresholdType: 'high',
        temperature: 30,
        severity: 'warning',
        affectedSpecies: ['dog', 'cat'],
        regions: [],
        message: '',
        durationHours: 24
      });
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/weather-alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'danger': return 'bg-orange-100 text-orange-800';
      case 'extreme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getThresholdIcon = (type) => {
    return type === 'high' ? faSun : faSnowflake;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faThermometerHalf} className="text-[#325747]" />
            Weather Alerts Management
          </h2>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#325747] text-white px-4 py-2 rounded-lg hover:bg-[#1a2e25] transition"
          >
            {showCreateForm ? 'Cancel' : 'Create New Alert'}
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-50 p-4 rounded-lg mb-6"
          >
            <h3 className="font-medium mb-3">Create New Temperature Alert</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Alert Type</label>
                <select
                  value={newAlert.thresholdType}
                  onChange={(e) => setNewAlert({...newAlert, thresholdType: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="high">High Temperature</option>
                  <option value="low">Low Temperature</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Temperature Threshold (°C)
                </label>
                <input
                  type="number"
                  value={newAlert.temperature}
                  onChange={(e) => setNewAlert({...newAlert, temperature: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <select
                  value={newAlert.severity}
                  onChange={(e) => setNewAlert({...newAlert, severity: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (hours)</label>
                <input
                  type="number"
                  value={newAlert.durationHours}
                  onChange={(e) => setNewAlert({...newAlert, durationHours: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Affected Species</label>
                <div className="flex flex-wrap gap-2">
                  {['dog', 'cat', 'bird', 'rabbit', 'cow', 'sheep'].map(species => (
                    <label key={species} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newAlert.affectedSpecies.includes(species)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAlert({
                              ...newAlert,
                              affectedSpecies: [...newAlert.affectedSpecies, species]
                            });
                          } else {
                            setNewAlert({
                              ...newAlert,
                              affectedSpecies: newAlert.affectedSpecies.filter(s => s !== species)
                            });
                          }
                        }}
                      />
                      <span>{species.charAt(0).toUpperCase() + species.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Affected Regions</label>
                <div className="flex flex-wrap gap-2">
                  {['Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Jenin'].map(region => (
                    <label key={region} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newAlert.regions.includes(region)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAlert({
                              ...newAlert,
                              regions: [...newAlert.regions, region]
                            });
                          } else {
                            setNewAlert({
                              ...newAlert,
                              regions: newAlert.regions.filter(r => r !== region)
                            });
                          }
                        }}
                      />
                      <span>{region}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Custom Message</label>
                <textarea
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Optional custom message for the alert"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreateAlert}
                className="bg-[#325747] text-white px-4 py-2 rounded-lg hover:bg-[#1a2e25] transition"
              >
                Create Alert
              </button>
            </div>
          </motion.div>
        )}

        {weatherData && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Current Weather Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weatherData.weatherChecks.map((check, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{check.city}</span>
                    <span className={`font-bold ${
                      check.temp > 30 ? 'text-red-600' : 
                      check.temp < 5 ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                      {check.temp}°C
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {check.conditions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getThresholdIcon(alert.thresholdType)} 
                        className={`mr-2 ${
                          alert.thresholdType === 'high' ? 'text-orange-500' : 'text-blue-500'
                        }`}
                      />
                      {alert.thresholdType === 'high' ? 'High' : 'Low'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.temperature}°C
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getSeverityColor(alert.severity)
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.affectedSpecies.join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    {alert.regions.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteAlert(alert._id)}
                      className="text-red-600 hover:text-red-900 mr-3"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-xl font-bold mb-4">Alert Statistics</h2>
          <div className="h-64">
            <Bar
              data={{
                labels: ['High Temp', 'Low Temp'],
                datasets: [
                  {
                    label: 'Warning',
                    data: [
                      alerts.filter(a => a.thresholdType === 'high' && a.severity === 'warning').length,
                      alerts.filter(a => a.thresholdType === 'low' && a.severity === 'warning').length
                    ],
                    backgroundColor: '#F6D55C',
                  },
                  {
                    label: 'Danger',
                    data: [
                      alerts.filter(a => a.thresholdType === 'high' && a.severity === 'danger').length,
                      alerts.filter(a => a.thresholdType === 'low' && a.severity === 'danger').length
                    ],
                    backgroundColor: '#ED553B',
                  },
                  {
                    label: 'Extreme',
                    data: [
                      alerts.filter(a => a.thresholdType === 'high' && a.severity === 'extreme').length,
                      alerts.filter(a => a.thresholdType === 'low' && a.severity === 'extreme').length
                    ],
                    backgroundColor: '#850000',
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    stacked: true,
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WeatherAlertsAdmin;
