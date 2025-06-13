import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, faArrowLeft, faExclamationTriangle, 
  faPlus, faTimes, faChevronDown 
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import AdminLayout from './AdminHeader';

const DiseaseAlertForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [alert, setAlert] = useState({
    disease: '',
    species: '',
    regions: [{ city: '', village: '' }],
    severity: 'medium',
    message: '',
    recommendations: [''],
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Color palette matching the alerts component
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
    if (id) {
      setIsEditMode(true);
      fetchAlert();
    }
  }, [id]);

  const fetchAlert = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/disease-alert/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlert(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load alert');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAlert(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegionChange = (index, field, value) => {
    const newRegions = [...alert.regions];
    newRegions[index][field] = value;
    setAlert(prev => ({
      ...prev,
      regions: newRegions
    }));
  };

  const addRegion = () => {
    setAlert(prev => ({
      ...prev,
      regions: [...prev.regions, { city: '', village: '' }]
    }));
  };

  const removeRegion = (index) => {
    const newRegions = alert.regions.filter((_, i) => i !== index);
    setAlert(prev => ({
      ...prev,
      regions: newRegions
    }));
  };

  const handleRecommendationChange = (index, value) => {
    const newRecommendations = [...alert.recommendations];
    newRecommendations[index] = value;
    setAlert(prev => ({
      ...prev,
      recommendations: newRecommendations
    }));
  };

  const addRecommendation = () => {
    setAlert(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, '']
    }));
  };

  const removeRecommendation = (index) => {
    const newRecommendations = alert.recommendations.filter((_, i) => i !== index);
    setAlert(prev => ({
      ...prev,
      recommendations: newRecommendations
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/admin/disease-alert/${id}`, alert, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/admin/disease-alert', alert, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      navigate('/admin/disease-alerts');
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving alert');
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen" style={{ backgroundColor: colors.background }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen font-laila" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#325747] to-[#233c31] text-white p-6 rounded-3xl shadow-lg mt-10 mx-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isEditMode ? 'Edit Disease Alert' : 'Create New Disease Alert'}
              </h1>
              <p className="text-gray-300 mt-2">
                {isEditMode ? 'Update the alert details' : 'Report a new disease outbreak in your region'}
              </p>
            </div>
            <button 
              onClick={() => navigate('/admin/disease-alerts')}
              className="mt-4 md:mt-0 bg-[#E59560] hover:bg-[#F6B17A] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Alerts
            </button>
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 mx-6 my-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Disease Name */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-gray-700 font-medium mb-2">
                  Disease Name *
                </label>
                <input
                  type="text"
                  name="disease"
                  value={alert.disease}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325747]"
                  required
                  placeholder="e.g., Canine Influenza"
                />
              </motion.div>

              {/* Species */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-gray-700 font-medium mb-2">
                  Species *
                </label>
                <div className="relative">
                  <select
                    name="species"
                    value={alert.species}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#325747]"
                    required
                  >
                    <option value="">Select species</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="cow">Cow</option>
                    <option value="sheep">Sheep</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
                  </div>
                </div>
              </motion.div>

              {/* Severity */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-gray-700 font-medium mb-2">
                  Severity *
                </label>
                <div className="relative">
                  <select
                    name="severity"
                    value={alert.severity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#325747]"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
                  </div>
                </div>
              </motion.div>

              {/* Status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-end"
              >
                <div className="flex items-center mt-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={alert.isActive}
                      onChange={(e) => setAlert(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className={`relative w-11 h-6 rounded-full peer ${alert.isActive ? 'bg-[#325747]' : 'bg-gray-200'} peer-focus:ring-4 peer-focus:ring-[#BACEC1] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                    <span className="ms-3 text-gray-700 font-medium">
                      {alert.isActive ? 'Active Alert' : 'Inactive Alert'}
                    </span>
                  </label>
                </div>
              </motion.div>
            </div>

            {/* Alert Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <label className="block text-gray-700 font-medium mb-2">
                Alert Message *
              </label>
              <textarea
                name="message"
                value={alert.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325747]"
                required
                placeholder="Provide details about the disease outbreak..."
              />
            </motion.div>

            {/* Affected Regions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-6"
            >
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 font-medium">
                  Affected Regions *
                </label>
                <motion.button
                  type="button"
                  onClick={addRegion}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm bg-[#325747] text-white px-3 py-1 rounded-lg hover:bg-[#4a7c64] transition-colors flex items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1" />
                  Add Region
                </motion.button>
              </div>
              
              {alert.regions.map((region, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3"
                >
                  <div>
                    <input
                      type="text"
                      placeholder="City *"
                      value={region.city}
                      onChange={(e) => handleRegionChange(index, 'city', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325747]"
                      required
                    />
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Village (optional)"
                      value={region.village}
                      onChange={(e) => handleRegionChange(index, 'village', e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325747]"
                    />
                    {alert.regions.length > 1 && (
                      <motion.button
                        type="button"
                        onClick={() => removeRegion(index)}
                        whileHover={{ scale: 1.1 }}
                        className="ml-2 px-3 text-red-500 hover:text-red-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-6"
            >
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 font-medium">
                  Recommendations *
                </label>
                <motion.button
                  type="button"
                  onClick={addRecommendation}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm bg-[#325747] text-white px-3 py-1 rounded-lg hover:bg-[#4a7c64] transition-colors flex items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1" />
                  Add Recommendation
                </motion.button>
              </div>
              
              {alert.recommendations.map((rec, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex mb-2"
                >
                  <input
                    type="text"
                    value={rec}
                    onChange={(e) => handleRecommendationChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#325747]"
                    required
                    placeholder="e.g., Avoid dog parks and crowded areas"
                  />
                  {alert.recommendations.length > 1 && (
                    <motion.button
                      type="button"
                      onClick={() => removeRecommendation(index)}
                      whileHover={{ scale: 1.1 }}
                      className="ml-2 px-3 text-red-500 hover:text-red-700 flex items-center"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex justify-end"
            >
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#325747] text-white px-6 py-3 rounded-lg hover:bg-[#4a7c64] transition-colors flex items-center text-lg"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {loading ? 'Saving...' : 'Save Alert'}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default DiseaseAlertForm;
