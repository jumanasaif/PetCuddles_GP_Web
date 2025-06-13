import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore, faUser, faEnvelope, faPhone, faMapMarkerAlt,
  faClock, faTruck, faEdit, faSave, faTimes, faSpinner, faCamera
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShopLayout from './ShopLayout';

const ShopSettings = () => {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  // Fetch shop data on component mount
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const token = localStorage.getItem('token');
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/shop/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShopData(response.data);
        initializeFormData(response.data);
        if (response.data.profileImage) {
          setImagePreview(`http://localhost:5000${response.data.profileImage}`);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch shop data');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [navigate]);

  // Initialize form data when shopData changes
  const initializeFormData = (data) => {
    setFormData({
      shopName: data?.shopName || '',
      fullName: data?.fullName || '',
      email: data?.email || '',
      phone: data?.phone || '',
      city: data?.city || '',
      village: data?.village || '',
      DeliveryProvide: data?.DeliveryProvide || false,
      workingHours: data?.workingHours || {
        sunday: { open: '09:00', close: '17:00', closed: false },
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '', close: '', closed: true },
        saturday: { open: '09:00', close: '17:00', closed: false }
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'workingHours') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append image if changed
      if (imageFile) {
        formDataToSend.append('profileImage', imageFile);
      }

      const response = await axios.put('http://localhost:5000/api/shop/profile', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh shop data after successful update
      const updatedShop = await axios.get('http://localhost:5000/api/shop/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShopData(updatedShop.data);
      setEditMode(false);
      setImageFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setUpdating(false);
    }
  };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#F6F4E8' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <FontAwesomeIcon icon={faSpinner} size="3x" className="text-[#E59560]" />
        </motion.div>
      </div>
    );
  }

  if (!shopData) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#F6F4E8' }}>
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full mx-4"
        >
          <h2 className="text-2xl font-bold text-[#325747] mb-4">Shop Not Found</h2>
          <p className="text-[#325747] mb-6">We couldn't find your shop information.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()} 
            className="bg-[#E59560] text-white px-6 py-3 rounded-lg hover:bg-[#325747] transition font-medium"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <ShopLayout>
    <div className="min-h-screen font-laila py-8 px-4" style={{ backgroundColor: '#F6F4E8' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="md:flex">
          {/* Left Column - Profile Image */}
          <div className="md:w-1/3 p-8 bg-[#BACEC1] flex flex-col items-center justify-center">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6"
            >
              <img 
                src={imagePreview || '/default-shop.jpg'} 
                alt="Shop Profile" 
                className="w-full h-full object-cover"
              />
              {editMode && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                  <label className="cursor-pointer">
                    <div className="bg-[#E59560] text-white p-3 rounded-full mb-2">
                      <FontAwesomeIcon icon={faCamera} size="lg" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-white font-medium">Change Photo</span>
                </div>
              )}
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`px-6 py-2 rounded-full text-white font-bold text-center ${formData.DeliveryProvide ? 'bg-[#325747]' : 'bg-gray-500'}`}
            >
              <FontAwesomeIcon icon={faTruck} className="mr-2" />
              {formData.DeliveryProvide ? 'Delivery Available' : 'No Delivery'}
            </motion.div>
          </div>

          {/* Right Column - Profile Info */}
          <div className="md:w-2/3 p-8">
            <div className="flex justify-between items-center mb-8">
              <motion.h1 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className="text-3xl font-bold text-[#325747]"
              >
                {formData.shopName}
              </motion.h1>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg font-medium ${editMode ? 'bg-gray-200 text-gray-700' : 'bg-[#E59560] text-white'}`}
                disabled={updating}
              >
                <FontAwesomeIcon icon={editMode ? faTimes : faEdit} className="mr-2" />
                {editMode ? 'Cancel' : 'Edit Profile'}
              </motion.button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
              >
                <p>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Owner Name */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <div className="w-full md:w-1/4 text-[#325747] font-semibold mb-2 md:mb-0 flex items-center">
                    <FontAwesomeIcon icon={faUser} className="mr-3 text-[#E59560]" />
                    <span>Owner Name:</span>
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full md:w-3/4 px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                    />
                  ) : (
                    <div className="w-full md:w-3/4 text-[#325747] px-4 py-2">{formData.fullName}</div>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <div className="w-full md:w-1/4 text-[#325747] font-semibold mb-2 md:mb-0 flex items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-3 text-[#E59560]" />
                    <span>Email:</span>
                  </div>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full md:w-3/4 px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                    />
                  ) : (
                    <div className="w-full md:w-3/4 text-[#325747] px-4 py-2">{formData.email}</div>
                  )}
                </div>

                {/* Phone */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <div className="w-full md:w-1/4 text-[#325747] font-semibold mb-2 md:mb-0 flex items-center">
                    <FontAwesomeIcon icon={faPhone} className="mr-3 text-[#E59560]" />
                    <span>Phone:</span>
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full md:w-3/4 px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                    />
                  ) : (
                    <div className="w-full md:w-3/4 text-[#325747] px-4 py-2">{formData.phone}</div>
                  )}
                </div>

                {/* Address */}
                <div className="flex flex-col md:flex-row items-start">
                  <div className="w-full md:w-1/4 text-[#325747] font-semibold mb-2 md:mb-0 flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-[#E59560]" />
                    <span>Address:</span>
                  </div>
                  {editMode ? (
                    <div className="w-full md:w-3/4 space-y-3">
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                      />
                      <input
                        type="text"
                        name="village"
                        value={formData.village || ''}
                        onChange={handleInputChange}
                        placeholder="Village (Optional)"
                        className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                      />
                    </div>
                  ) : (
                    <div className="w-full md:w-3/4 text-[#325747] px-4 py-2">
                      {formData.city}{formData.village && `, ${formData.village}`}
                    </div>
                  )}
                </div>

                {/* Delivery */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <div className="w-full md:w-1/4 text-[#325747] font-semibold mb-2 md:mb-0 flex items-center">
                    <FontAwesomeIcon icon={faTruck} className="mr-3 text-[#E59560]" />
                    <span>Delivery Service:</span>
                  </div>
                  {editMode ? (
                    <div className="w-full md:w-3/4 flex items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="DeliveryProvide"
                          name="DeliveryProvide"
                          checked={formData.DeliveryProvide}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#E59560] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#325747]"></div>
                        <span className="ms-3 text-[#325747] font-medium">
                          {formData.DeliveryProvide ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="w-full md:w-3/4 text-[#325747] px-4 py-2">
                      {formData.DeliveryProvide ? 'Yes, we provide delivery' : 'No delivery service'}
                    </div>
                  )}
                </div>

                {/* Working Hours */}
                <div className="mt-8">
                  <div className="flex items-center text-[#325747] font-semibold mb-4 text-lg">
                    <FontAwesomeIcon icon={faClock} className="mr-3 text-[#E59560]" />
                    <span>Working Hours</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {days.map(day => (
                      <motion.div 
                        key={day}
                        whileHover={{ scale: 1.01 }}
                        className="p-4 border border-[#BACEC1] rounded-lg bg-[#F6F4E8]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[#325747] font-medium capitalize">{day}</span>
                          {editMode && (
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id={`${day}-closed`}
                                checked={formData.workingHours[day]?.closed || false}
                                onChange={(e) => handleWorkingHoursChange(day, 'closed', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#E59560] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#325747]"></div>
                              <span className="ms-3 text-sm text-[#325747]">Closed</span>
                            </label>
                          )}
                        </div>
                        
                        {(!formData.workingHours[day]?.closed || editMode) && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-[#325747] mb-1">Open</label>
                              {editMode ? (
                                <input
                                  type="time"
                                  value={formData.workingHours[day]?.open || ''}
                                  onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                                  className="w-full px-3 py-2 border border-[#BACEC1] rounded-lg bg-white"
                                  disabled={formData.workingHours[day]?.closed}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-white rounded-lg">
                                  {formData.workingHours[day]?.open || '--:--'}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm text-[#325747] mb-1">Close</label>
                              {editMode ? (
                                <input
                                  type="time"
                                  value={formData.workingHours[day]?.close || ''}
                                  onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                                  className="w-full px-3 py-2 border border-[#BACEC1] rounded-lg bg-white"
                                  disabled={formData.workingHours[day]?.closed}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-white rounded-lg">
                                  {formData.workingHours[day]?.close || '--:--'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {editMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 mt-8 border-t border-[#BACEC1]"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={updating}
                      className="w-full bg-[#E59560] text-white py-3 rounded-lg font-bold shadow-lg hover:bg-[#325747] transition duration-200 flex items-center justify-center"
                    >
                      {updating ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="mr-3" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="mr-3" />
                          Save All Changes
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
   </ShopLayout> 
  );
};

export default ShopSettings;
