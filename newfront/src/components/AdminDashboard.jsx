import React, { useState, useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faClinicMedical, faStore, faPaw, 
  faMoneyBillWave, faChartLine, faBell, faUserShield,
  faExclamationTriangle, faMicrochip, faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import AdminLayout from './AdminHeader';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    clinics: 0,
    shops: 0,
    pets: 0,
    revenue: 0,
    pendingApprovals: 0,
    aiModels: 3,
    alerts: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const [statsRes, paymentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/dashboard-stats', config),
        axios.get('http://localhost:5000/api/admin/recent-payments', config),
      ]);

      console.log('Stats:', statsRes.data);
      console.log('Payments:', paymentsRes.data);

      setStats(statsRes.data);
      setRecentPayments(paymentsRes.data);
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const statusBadge = (status) => {
  switch(status) {
    case 'completed':
    case 'succeeded': // Added to handle both payment types
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

  const activityIcon = (type) => {
    switch(type) {
      case 'user':
        return { icon: faUsers, color: 'text-blue-500' };
      case 'clinic':
        return { icon: faClinicMedical, color: 'text-green-500' };
      case 'shop':
        return { icon: faStore, color: 'text-purple-500' };
      case 'admin':
        return { icon: faUserShield, color: 'text-indigo-500' };
      default:
        return { icon: faBell, color: 'text-gray-500' };
    }
  };
const DashboardCard = ({ icon, title, value, color, trend, percentage, link }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 cursor-pointer"
      onClick={() => navigate (link)}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color.split(' ')[0]}`}>
          <FontAwesomeIcon icon={icon} className={`${color.split(' ')[1]}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        {trend === 'up' ? (
          <span className="text-green-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {percentage}
          </span>
        ) : (
          <span className="text-red-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {percentage}
          </span>
        )}
        <span className="text-gray-500 ml-2">vs last month</span>
      </div>
    </motion.div>
  );
};

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#1a2e25] to-[#0f1a15] text-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-300 mt-2">Welcome back! Here's what's happening with your platform.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 md:mt-0 bg-[#E59560] hover:bg-[#d48a55] text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md"
              >
                <FontAwesomeIcon icon={faMicrochip} />
                AI Model Insights
              </motion.button>
            </div>
          </motion.div>

          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <DashboardCard 
              icon={faUsers}
              title="Pet Owners"
              value={stats.users}
              color="bg-blue-100 text-blue-600"
              trend="up"
              percentage="12%"
              link="/admin/users"
            />
            <DashboardCard 
              icon={faClinicMedical}
              title="Clinics"
              value={stats.clinics}
              color="bg-green-100 text-green-600"
              trend="up"
              percentage="8%"
              link="/admin/clinics"
            />
            <DashboardCard 
              icon={faStore}
              title="Shops"
              value={stats.shops}
              color="bg-purple-100 text-purple-600"
              trend="up"
              percentage="5%"
              link="/admin/shops"
            />
            <DashboardCard 
              icon={faPaw}
              title="Pets"
              value={stats.pets}
              color="bg-amber-100 text-amber-600"
              trend="up"
              percentage="15%"
              link="/admin/pets"
            />
            <DashboardCard 
              icon={faMoneyBillWave}
              title="Revenue"
              value={formatCurrency(stats.revenue)}
              color="bg-indigo-100 text-indigo-600"
              trend="up"
              percentage="22%"
              link="/admin/payments"
            />
            <DashboardCard 
              icon={faBell}
              title="Pending Approvals"
              value={stats.pendingApprovals}
              color="bg-red-100 text-red-600"
              trend="down"
              percentage="3%"
              link="/admin/approvals"
            />
            <DashboardCard 
              icon={faMicrochip}
              title="AI Models"
              value={stats.aiModels}
              color="bg-teal-100 text-teal-600"
              trend="up"
              percentage="100%"
              link="/admin/ai-models"
            />
            <DashboardCard 
              icon={faExclamationTriangle}
              title="Alerts"
              value={stats.alerts}
              color="bg-pink-100 text-pink-600"
              trend="down"
              percentage="10%"
              link="/admin/alerts"
            />
          </motion.div>

          {/* Recent Payments and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Recent Payments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                  Recent Payments
                </h2>
                <a href="/admin/payments" className="text-[#E59560] hover:underline text-sm">
                  View All
                </a>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentPayments.map((payment) => (
  <motion.tr 
    key={payment._id}
    whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
    className="cursor-pointer"
    onClick={() => navigate(`/admin/payments/${payment._id}`)}
  >
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(payment.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
      {payment.type === 'clinic' ? 'Clinic Payment' : 'Shop Payment'} - {payment.name}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {formatCurrency(payment.amount)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge(payment.status)}`}>
        {payment.status}
      </span>
    </td>
  </motion.tr>
))}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

          {/* AI Model Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faMicrochip} className="text-teal-500" />
                AI Model Performance
              </h2>
              <a href="/admin/ai-models" className="text-[#E59560] hover:underline text-sm">
                View Details
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Model 1 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Pet Health Predictor</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Accuracy</span>
                  <span>92%</span>
                </div>
              </div>
              
              {/* Model 2 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Image Recognition</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Accuracy</span>
                  <span>88%</span>
                </div>
              </div>
              
              {/* Model 3 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Chat Assistant</h3>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Training</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '76%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Accuracy</span>
                  <span>76%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
};



export default AdminDashboard;
