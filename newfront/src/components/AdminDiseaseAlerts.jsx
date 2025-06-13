import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, faPlus, faFilter,
  faToggleOn, faToggleOff, faSearch, 
  faChartLine, faChartPie, faChartBar,
  faEdit, faTrash, faInfoCircle, faMapMarkerAlt,faPaw
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AdminLayout from './AdminHeader';

// Register Chart.js components
Chart.register(...registerables);

const DiseaseAlertsAdmin = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    active: true,
    severity: 'all',
    species: 'all',
    dateRange: [null, null]
  });
  const [stats, setStats] = useState(null);
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
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/disease-alert', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/disease-alert-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStats(response.data);
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Set default empty stats to prevent errors in charts
    setStats({
      monthlyCounts: [],
      topDiseases: [],
      speciesDistribution: [],
      regionalDistribution: []
    });
  }
};

  const toggleAlertStatus = async (alertId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/disease-alert/${alertId}/status`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error toggling alert status:', error);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/disease-alert/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    // Search term filter
    const matchesSearch = alert.disease.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         alert.species.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = filters.active ? alert.isActive : true;
    
    // Severity filter
    const matchesSeverity = filters.severity === 'all' ? true : alert.severity === filters.severity;
    
    // Species filter
    const matchesSpecies = filters.species === 'all' ? true : alert.species === filters.species;
    
    // Date range filter
    const matchesDateRange = filters.dateRange[0] && filters.dateRange[1] 
      ? new Date(alert.createdAt) >= filters.dateRange[0] && new Date(alert.createdAt) <= filters.dateRange[1]
      : true;

    return matchesSearch && matchesStatus && matchesSeverity && matchesSpecies && matchesDateRange;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      case 'medium': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
      default: return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    }
  };

  const getStatusColor = (status) => {
    return status ? 'text-green-600' : 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
      </div>
    );
  }

  // Extract unique species for filter dropdown
  const uniqueSpecies = [...new Set(alerts.map(alert => alert.species))];

  return (
    <AdminLayout>
    <div className="min-h-screen font-laila" style={{ backgroundColor: colors.background }} >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#325747] to-[#233c31] text-white p-6 rounded-3xl shadow-lg mt-10"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Disease Outbreak Management</h1>
            <p className="text-gray-300 mt-2">
              Monitor and manage disease alerts in your region
            </p>
          </div>
          <Link 
            to="/admin/disease-alerts/new"
            className="mt-4 md:mt-0 bg-[#E59560] hover:bg-[#F6B17A] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Create New Alert
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex space-x-2">
          {['alerts', 'analytics'].map((tab) => (
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
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-4 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    className="pl-10 pr-4 py-2 border rounded-lg w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center">
                  <button
                    onClick={() => setFilters({...filters, active: !filters.active})}
                    className={`px-4 py-2 rounded-lg flex items-center ${filters.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    <FontAwesomeIcon 
                      icon={filters.active ? faToggleOn : faToggleOff} 
                      className="mr-2"
                    />
                    {filters.active ? 'Active Only' : 'All Alerts'}
                  </button>
                </div>

                {/* Severity Filter */}
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({...filters, severity: e.target.value})}
                  className="border rounded-lg px-4 py-2"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                {/* Species Filter */}
                <select
                  value={filters.species}
                  onChange={(e) => setFilters({...filters, species: e.target.value})}
                  className="border rounded-lg px-4 py-2"
                >
                  <option value="all">All Species</option>
                  {uniqueSpecies.map(species => (
                    <option key={species} value={species}>{species}</option>
                  ))}
                </select>

                {/* Date Range Filter */}
                <DatePicker
                  selectsRange={true}
                  startDate={filters.dateRange[0]}
                  endDate={filters.dateRange[1]}
                  onChange={(update) => {
                    setFilters({...filters, dateRange: update});
                  }}
                  isClearable={true}
                  placeholderText="Date range"
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
            >
              {/* Total Alerts */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Alerts</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {alerts.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>

              {/* Active Alerts */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Alerts</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {alerts.filter(a => a.isActive).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((alerts.filter(a => a.isActive).length / alerts.length * 100))}% of total
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faToggleOn} className="text-[#325747]" />
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
                      {alerts.filter(a => a.severity === 'high').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((alerts.filter(a => a.severity === 'high').length / alerts.length * 100))}% of total
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
                      {uniqueSpecies.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {uniqueSpecies.join(', ')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faPaw} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Alerts Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disease</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAlerts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No alerts match your filters
                        </td>
                      </tr>
                    ) : (
                      filteredAlerts.map((alert) => (
                        <motion.tr 
                          key={alert._id} 
                          className="hover:bg-gray-50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{alert.disease}</div>
                            <div className="text-sm text-gray-500">{new Date(alert.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{alert.species}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {alert.regions.slice(0, 3).map((region, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-xs" />
                                  {region.city}{region.village ? `, ${region.village}` : ''}
                                </span>
                              ))}
                              {alert.regions.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  +{alert.regions.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity).bg} ${getSeverityColor(alert.severity).text}`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{alert.caseCount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleAlertStatus(alert._id, alert.isActive)}
                              className={`flex items-center ${getStatusColor(alert.isActive)}`}
                            >
                              <FontAwesomeIcon 
                                icon={alert.isActive ? faToggleOn : faToggleOff} 
                                className="mr-2 text-lg"
                              />
                              {alert.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link
                                to={`/admin/disease-alerts/${alert._id}`}
                                className="text-[#325747] hover:text-[#4a7c64] p-2 rounded-full hover:bg-gray-100"
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faInfoCircle} />
                              </Link>
                              <Link
                                to={`/admin/disease-alerts/${alert._id}`}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-gray-100"
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Link>
                              <button
                                onClick={() => deleteAlert(alert._id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-gray-100"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        ) : (
          /* Analytics Tab */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Alerts by Severity */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Alerts by Severity</h3>
                <div className="h-64">
                  <Pie
                    data={{
                      labels: ['High', 'Medium', 'Low'],
                      datasets: [{
                        data: [
                          alerts.filter(a => a.severity === 'high').length,
                          alerts.filter(a => a.severity === 'medium').length,
                          alerts.filter(a => a.severity === 'low').length
                        ],
                        backgroundColor: [
                          colors.danger,
                          colors.warning,
                          colors.success
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Alerts Over Time */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Alerts Over Time</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: stats?.monthlyCounts.map(item => `${item._id.month}/${item._id.year}`) || [],
                      datasets: [{
                        label: 'Alerts',
                        data: stats?.monthlyCounts.map(item => item.count) || [],
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>

              {/* Top Diseases */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Top Diseases</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: stats?.topDiseases.map(item => item._id) || [],
                      datasets: [{
                        label: 'Cases',
                        data: stats?.topDiseases.map(item => item.count) || [],
                        backgroundColor: colors.secondary,
                        borderColor: colors.primary,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerts by Species */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Alerts by Species</h3>
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: stats?.speciesDistribution.map(item => item._id) || [],
                      datasets: [{
                        data: stats?.speciesDistribution.map(item => item.count) || [],
                        backgroundColor: [
                          colors.primary,
                          colors.secondary,
                          colors.accent,
                          '#A8D5BA',
                          '#7C9EB2'
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Regional Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: stats?.regionalDistribution.map(item => `${item._id.city}${item._id.village ? `, ${item._id.village}` : ''}`) || [],
                      datasets: [{
                        label: 'Alerts',
                        data: stats?.regionalDistribution.map(item => item.count) || [],
                        backgroundColor: colors.accent,
                        borderColor: colors.primary,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
};

export default DiseaseAlertsAdmin;
