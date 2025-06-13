import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaw, faQrcode, faUtensils, faClinicMedical, 
  faShoppingCart, faRobot, faChartLine, faChartPie,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import AdminLayout from './AdminHeader';
import { Chart, registerables } from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
Chart.register(...registerables);

const PetAnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [healthDetections, setHealthDetections] = useState(null);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState(null);
  const [healthRecords, setHealthRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, healthRes, behaviorRes, recordsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/pet-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/health-detections', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/behavior-analysis', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/health-records', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setHealthDetections(healthRes.data);
      setBehaviorAnalysis(behaviorRes.data);
      setHealthRecords(recordsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

const getSpeciesIcon = (species) => {
  const petEmojis = {
    'dog': '🐶',
    'cat': '🐱',
    'rabbit': '🐇',
    'bird': '🐦',
    'cow': '🐄',
    'sheep': '🐏'
  };
  return petEmojis[species.toLowerCase()] || '🐾';
};

  const formatPercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1a2e25] to-[#0f1a15] text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Pet Services Analytics</h1>
              <p className="text-gray-300 mt-2">
                Comprehensive analysis of all pet services including health, behavior, and nutrition
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2">
          <div className="flex space-x-2">
            {['overview', 'health', 'behavior', 'nutrition'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab ? 'bg-[#325747] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Total Pets */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Pets</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stats?.totalPets || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faPaw} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>

              {/* Pets with QR */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pets with QR Codes</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stats?.petsWithQR || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(stats?.petsWithQR, stats?.totalPets)}% of total
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faQrcode} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>

              {/* Pets with Nutrition */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pets with Nutrition</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stats?.petsWithNutrition || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(stats?.petsWithNutrition, stats?.totalPets)}% of total
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faUtensils} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>


              {/* Pets with AI Detection */}
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pets with AI Detection</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stats?.petsWithAIDetection || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(stats?.petsWithAIDetection, stats?.totalPets)}% of total
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-[#BACEC1]">
                    <FontAwesomeIcon icon={faRobot} className="text-[#325747]" />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Species Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartPie} className="text-[#325747]" />
                Species Distribution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: stats?.speciesDistribution.map(item => item._id),
                      datasets: [{
                        data: stats?.speciesDistribution.map(item => item.count),
                        backgroundColor: [
                          '#E59560', '#325747', '#BACEC1', '#F6F4E8', 
                          '#A8D5BA', '#7C9EB2', '#52528C', '#372554'
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
                <div className="space-y-4">
                  {stats?.speciesDistribution.map((species, index) => (
  <div key={species._id} className="flex items-center">
    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xl">
      {getSpeciesIcon(species._id)}
    </div>
    <div className="flex-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{species._id}</span>
        <span>{species.count} ({formatPercentage(species.count, stats.totalPets)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div 
          className="h-2 rounded-full" 
          style={{ 
            width: `${formatPercentage(species.count, stats.totalPets)}%`,
            backgroundColor: [
              '#E59560', '#325747', '#BACEC1', '#F6F4E8', 
              '#A8D5BA', '#7C9EB2', '#52528C', '#372554'
            ][index % 8]
          }}
        ></div>
      </div>
    </div>
  </div>
))}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && healthDetections && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartLine} className="text-[#325747]" />
                Top Health Detections
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <Bar
                    data={{
                      labels: healthDetections.topDetections.map(d => d._id),
                      datasets: [{
                        label: 'Detection Count',
                        data: healthDetections.topDetections.map(d => d.count),
                        backgroundColor: '#E59560',
                        borderColor: '#325747',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: healthDetections.topDetections.map(d => d._id),
                      datasets: [{
                        label: 'Average Confidence',
                        data: healthDetections.topDetections.map(d => d.avgConfidence * 100),
                        backgroundColor: '#BACEC1',
                        borderColor: '#325747',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartLine} className="text-[#325747]" />
                Confidence Trend Over Time
              </h2>
              <div className="h-80">
                <Line
                  data={{
                    labels: healthDetections.confidenceTrend.map(item => 
                      `${new Date(0, item._id.month - 1).toLocaleString('default', { month: 'short' })} ${item._id.year}`
                    ),
                    datasets: [{
                      label: 'Average Confidence',
                      data: healthDetections.confidenceTrend.map(item => item.avgConfidence * 100),
                      backgroundColor: '#E59560',
                      borderColor: '#325747',
                      borderWidth: 2,
                      tension: 0.3,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </motion.div>

            {healthRecords && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faChartPie} className="text-[#325747]" />
                  Health Records Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-80">
                    <Pie
                      data={{
                        labels: healthRecords.recordTypes.map(r => r._id),
                        datasets: [{
                          data: healthRecords.recordTypes.map(r => r.count),
                          backgroundColor: [
                            '#E59560', '#325747', '#BACEC1', '#F6F4E8', 
                            '#A8D5BA', '#7C9EB2', '#52528C', '#372554'
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
                  <div className="h-80">
                    <Doughnut
                      data={{
                        labels: ['Vaccinated', 'Not Vaccinated'],
                        datasets: [{
                          data: [
                            healthRecords.vaccinationStatus.vaccinated,
                            healthRecords.vaccinationStatus.total - healthRecords.vaccinationStatus.vaccinated
                          ],
                          backgroundColor: ['#325747', '#BACEC1'],
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
              </motion.div>
            )}
          </>
        )}

        {/* Behavior Tab */}
        {activeTab === 'behavior' && behaviorAnalysis && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartBar} className="text-[#325747]" />
                Top Behavior Patterns
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <Bar
                    data={{
                      labels: behaviorAnalysis.topBehaviors.map(b => b._id),
                      datasets: [{
                        label: 'Occurrences',
                        data: behaviorAnalysis.topBehaviors.map(b => b.count),
                        backgroundColor: '#E59560',
                        borderColor: '#325747',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: behaviorAnalysis.topBehaviors.map(b => b._id),
                      datasets: [{
                        label: 'Average Intensity',
                        data: behaviorAnalysis.topBehaviors.map(b => b.avgIntensity),
                        backgroundColor: '#BACEC1',
                        borderColor: '#325747',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 5
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartLine} className="text-[#325747]" />
                Behavior Trends Over Time
              </h2>
              <div className="h-80">
                <Line
                  data={{
                    labels: behaviorAnalysis.behaviorTrends.map(item => 
                      `${new Date(0, item._id.month - 1).toLocaleString('default', { month: 'short' })} ${item._id.year}`
                    ),
                    datasets: [{
                      label: 'Behavior Reports',
                      data: behaviorAnalysis.behaviorTrends.map(item => item.count),
                      backgroundColor: '#E59560',
                      borderColor: '#325747',
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartBar} className="text-[#325747]" />
                Most Effective Solutions
              </h2>
              <div className="h-80">
                <Bar
                  data={{
                    labels: behaviorAnalysis.solutionEffectiveness?.map(s => s._id.substring(0, 30) + (s._id?.length > 30 ? '...' : '') || []),
                    datasets: [{
                       label: 'Effectiveness (%)',
                       data: behaviorAnalysis.solutionEffectiveness?.map(s => s.avgEffectiveness) || [],
                       backgroundColor: '#BACEC1',
                       borderColor: '#325747',
                       borderWidth: 1
                   }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          </>
        )}

        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faChartPie} className="text-[#325747]" />
              Nutrition Analysis Coming Soon
            </h2>
            <div className="text-center py-12 text-gray-500">
              <p>Detailed nutrition analytics will be available in the next update</p>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PetAnalyticsDashboard;