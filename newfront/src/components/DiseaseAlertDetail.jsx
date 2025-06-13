import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, faArrowLeft, faShieldVirus,
  faInfoCircle, faMapMarkerAlt, faCalendarAlt,
  faClipboardList, faPaw, faChartLine,faVirus
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const DiseaseAlertDetail = () => {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchAlert = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/disease-alerts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlert(response.data);
      } catch (err) {
        setError('Failed to load alert details');
      } finally {
        setLoading(false);
      }
    };

    fetchAlert();
  }, [id]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-500' };
      case 'medium': return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-500' };
      default: return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-500' };
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
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
      </div>
    );
  }

  if (error) return (
    <div className="flex justify-center items-center h-screen" style={{ backgroundColor: colors.background }}>
      <div className="text-center py-8 text-red-500">{error}</div>
    </div>
  );

  if (!alert) return (
    <div className="flex justify-center items-center h-screen" style={{ backgroundColor: colors.background }}>
      <div className="text-center py-8">Alert not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila" style={{ marginTop: '70px' }}
    
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#325747] to-[#233c31] text-white p-6 rounded-3xl shadow-lg mt-10"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
             <h1 className="text-2xl md:text-3xl font-bold">Disease Alert Details</h1>
             <p className="text-gray-300 mt-2"> Detailed information about this disease outbreak</p>
          </div>
            <Link 
              to="/user/disease-alerts"
              className="mt-4 md:mt-0 bg-[#E59560] hover:bg-[#F6B17A] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back
            </Link>
       
        </div>
      </motion.div>

      {/* Main Content */}
   <div className="p-6 max-w-6xl mx-auto rounded-2xl ">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
       className="flex flex-col items-center gap-6"
     >
    {/* Left Column */}
    <div className="lg:col-span-2 space-y-6 w-full">

      {/* Alert Summary */}
      <motion.div 
        whileHover={{ y: -2 }}
        className={`rounded-xl shadow-md p-6 border-l-4 ${getSeverityColor(alert.severity).border} ${getSeverityColor(alert.severity).bg}`}
      >
        <div className="flex items-start mb-4">
          <FontAwesomeIcon 
            icon={getDiseaseIcon(alert.severity)} 
            className={`text-2xl mr-4 ${getSeverityColor(alert.severity).text}`}
          />
        <div className="flex items-start gap-4">
           <div>
              <h1 className="text-2xl font-extrabold text-[#325747] tracking-wide flex items-center gap-2">
               {alert.disease} Alert
             </h1>
             <p className="text-base text-gray-700 mt-2 leading-relaxed">
               {alert.message}
             </p>
           </div>
       </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faPaw} className="text-[#4a7c64] mr-3" />
            <div>
              <h3 className="text-sm text-gray-500">Affected Species</h3>
              <p className="font-medium text-gray-800">{alert.species}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-[#FFA000] mr-3" />
            <div>
              <h3 className="text-sm text-gray-500">Severity</h3>
              <p className="font-medium capitalize text-gray-800">{alert.severity}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faChartLine} className="text-[#E59560] mr-3" />
            <div>
              <h3 className="text-sm text-gray-500">Cases Reported</h3>
              <p className="font-medium text-gray-800">{alert.caseCount}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-[#BACEC1] mr-3" />
            <div>
              <h3 className="text-sm text-gray-500">First Detected</h3>
              <p className="font-medium text-gray-800">{new Date(alert.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {alert.regions && alert.regions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm text-gray-500 mb-2">Affected Locations</h3>
            <div className="flex flex-wrap gap-2">
              {alert.regions.map((region, i) => (
                <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#BACEC1] text-gray-900 shadow-sm">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-xs" />
                  {region.city}{region.village ? `, ${region.village}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Recommended Actions */}
     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
     className="bg-[#F6FDF9] rounded-xl shadow-md p-6 border-l-4 border-green-600"
    >
  <h2 className="text-xl font-bold mb-4 flex items-center text-[#2E7D62]">
    <FontAwesomeIcon icon={faClipboardList} className="text-[#4a7c64] mr-3" />
    Recommended Actions
  </h2>
  <ul className="space-y-3 text-gray-800">
    {alert.recommendations.map((rec, i) => (
      <motion.li 
        key={i}
        initial={{ x: -10 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.1 * i }}
        className="flex items-start"
      >
        <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-3 ${getSeverityColor(alert.severity).bg}`}></span>
        <span>{rec}</span>
      </motion.li>
    ))}
  </ul>
</motion.div>


      {/* Alert Details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-300"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center text-[#325747]">
          <FontAwesomeIcon icon={faInfoCircle} className="text-[#4a7c64] mr-3" />
          About This Alert
        </h2>
        <p className="mb-4 text-gray-700">
          This alert was automatically generated when our system detected multiple cases of <strong>{alert.disease.toLowerCase()}</strong> 
          in <strong>{alert.species.toLowerCase()}</strong> within your area. The confidence level for this detection is <strong>{Math.round(alert.confidenceThreshold * 100)}%</strong>.
        </p>
        
        {alert.isActive ? (
          <div className={`p-4 rounded-lg ${getSeverityColor(alert.severity).bg} ${getSeverityColor(alert.severity).text}`}>
            <p className="font-medium">This alert is currently active.</p>
            <p>Please monitor your pets and follow the recommendations above.</p>
          </div>
        ) : (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-800 rounded-md">
            <p>This alert is no longer active.</p>
          </div>
        )}
      </motion.div>
    </div>
  </motion.div>
</div>

    </div>
  );
};

export default DiseaseAlertDetail;