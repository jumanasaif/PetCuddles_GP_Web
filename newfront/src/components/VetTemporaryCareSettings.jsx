import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHandHoldingHeart, FaTimes } from 'react-icons/fa';

const VetTemporaryCareSettings = () => {
  const [settings, setSettings] = useState({
    providesTemporaryCare: false,
    maxPetsCapacity: 0,
    dailyRatePerPet: 0,
    description: '',
    facilities: []
  });
 
  const [newFacility, setNewFacility] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/vet/temporary-care/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const receivedSettings = response.data.settings || response.data;
        
        if (receivedSettings) {
          setSettings({
            providesTemporaryCare: receivedSettings.providesTemporaryCare || false,
            maxPetsCapacity: receivedSettings.maxPetsCapacity || 0,
            dailyRatePerPet: receivedSettings.dailyRatePerPet || 0,
            description: receivedSettings.description || '',
            facilities: receivedSettings.facilities || []
          });
          // If settings already exist, show the form immediately
          if (receivedSettings.providesTemporaryCare) {
            setShowForm(true);
          }
        }
      } catch (err) {
        console.error('Fetch settings error:', err);
        setError(err.response?.data?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newSettings = {
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    };
    setSettings(newSettings);
    
    // If unchecking the service, hide the form
    if (name === 'providesTemporaryCare' && !checked) {
      setShowForm(false);
    }
  };

  const addFacility = () => {
    if (newFacility.trim() && !settings.facilities.includes(newFacility.trim())) {
      setSettings(prev => ({
        ...prev,
        facilities: [...prev.facilities, newFacility.trim()]
      }));
      setNewFacility('');
    }
  };

  const removeFacility = (facility) => {
    setSettings(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/vet-temporary-care/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate('/clinic', { state: { message: 'Temporary care settings updated successfully' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    }
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        Loading settings...
      </div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-red-500">
        {error}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 font-laila">
      <AnimatePresence>
        {!showForm ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#325747] flex items-center">
                <FaHandHoldingHeart className="mr-2 text-[#E59560]" />
                Temporary Care Services
              </h2>
              <button 
                onClick={() => navigate('/clinic')}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Would you like to offer temporary care services for pets? This allows pet owners to board their pets at your clinic for short periods.
              </p>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="providesTemporaryCare"
                      checked={settings.providesTemporaryCare}
                      onChange={(e) => {
                        handleChange(e);
                        if (e.target.checked) setShowForm(true);
                      }}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full ${settings.providesTemporaryCare ? 'bg-[#325747]' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${settings.providesTemporaryCare ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="font-medium text-gray-700">
                    {settings.providesTemporaryCare ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
                
                <button
                  onClick={() => {
                    if (settings.providesTemporaryCare) {
                      setShowForm(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${settings.providesTemporaryCare ? 'bg-[#325747] text-white' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`}
                  disabled={!settings.providesTemporaryCare}
                >
                  Configure
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#325747] flex items-center">
                  <FaHandHoldingHeart className="mr-3" />
                  Temporary Care Settings
                </h2>
                <div className="h-1 rounded-full bg-[#E59560] w-32 mt-1"></div>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-800">Temporary Care Services</h3>
                    <p className="text-sm text-gray-500">Enable to offer boarding services</p>
                  </div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="providesTemporaryCare"
                        checked={settings.providesTemporaryCare}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`block w-14 h-8 rounded-full ${settings.providesTemporaryCare ? 'bg-[#325747]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${settings.providesTemporaryCare ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>

                {settings.providesTemporaryCare && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Maximum pets capacity</label>
                        <input
                          type="number"
                          name="maxPetsCapacity"
                          value={settings.maxPetsCapacity}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Daily rate per pet ($)</label>
                        <input
                          type="number"
                          name="dailyRatePerPet"
                          value={settings.dailyRatePerPet}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Service description</label>
                      <textarea
                        name="description"
                        value={settings.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                        placeholder="Describe your temporary care services..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Facilities & Features</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFacility}
                          onChange={(e) => setNewFacility(e.target.value)}
                          placeholder="Add facility (e.g., 'Outdoor space')"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                          onKeyPress={(e) => e.key === 'Enter' && addFacility()}
                        />
                        <button
                          type="button"
                          onClick={addFacility}
                          className="px-4 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#2a4a3a] transition"
                        >
                          Add
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {settings.facilities.map(facility => (
                          <div key={facility} className="flex items-center bg-[#F6F4E8] px-3 py-1 rounded-full text-[#325747]">
                            {facility}
                            <button
                              type="button"
                              onClick={() => removeFacility(facility)}
                              className="ml-2 text-[#E59560] hover:text-[#d87f4a]"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#2a4a3a] transition"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VetTemporaryCareSettings;