import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, faPlus, faTimes, faTrash, faEdit, 
  faPowerOff, faSpinner, faCheck, faBan,
  faStethoscope, faSyringe, faAmbulance, faCut,
  faBroom, faTooth, faCalendarCheck, faHome,faFlaskVial,
  faMicroscope
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const VetServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedService, setExpandedService] = useState(null);

  const [newService, setNewService] = useState({
    type: '',
    subServices: [{
      name: '',
      baseCost: 0,
      duration:30,
      requirements: '',
      extraServices: []
    }]
  });

  const serviceTypes = [
    'checkup', 'vaccination', 'emergency', 'surgery', 
    'grooming', 'dental', 'follow_up', 'laboratory_test', 'diagnostic'
  ];

  const serviceIcons = {
    checkup: faStethoscope,
    vaccination: faSyringe,
    emergency: faAmbulance,
    surgery: faCut,
    grooming: faBroom,
    dental: faTooth,
    follow_up: faCalendarCheck,
    laboratory_test: faFlaskVial,
    diagnostic: faMicroscope
  };

  const serviceColors = {
    checkup: 'bg-blue-100 text-blue-800',
    vaccination: 'bg-purple-100 text-purple-800',
    emergency: 'bg-red-100 text-red-800',
    surgery: 'bg-orange-100 text-orange-800',
    grooming: 'bg-pink-100 text-pink-800',
    dental: 'bg-teal-100 text-teal-800',
    follow_up: 'bg-indigo-100 text-indigo-800',
    laboratory_test: 'bg-amber-100 text-amber-800',
    diagnostic: 'bg-cyan-100 text-cyan-800'
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/vet/services', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };


  const handleAddSubService = () => {
    setNewService(prev => ({
      ...prev,
      subServices: [
        ...prev.subServices,
        { name: '', baseCost: 0, duration: 30,requirements: '', extraServices: [] }
      ]
    }));
  };

  const handleRemoveSubService = (index) => {
    setNewService(prev => ({
      ...prev,
      subServices: prev.subServices.filter((_, i) => i !== index)
    }));
  };

  const handleAddExtraService = (subServiceIndex) => {
    setNewService(prev => {
      const updatedSubServices = [...prev.subServices];
      updatedSubServices[subServiceIndex].extraServices.push({
        name: '',
        cost: 0,
        duration:0
      });
      return { ...prev, subServices: updatedSubServices };
    });
  };

  const handleRemoveExtraService = (subServiceIndex, extraIndex) => {
    setNewService(prev => {
      const updatedSubServices = [...prev.subServices];
      updatedSubServices[subServiceIndex].extraServices = 
        updatedSubServices[subServiceIndex].extraServices.filter((_, i) => i !== extraIndex);
      return { ...prev, subServices: updatedSubServices };
    });
  };

  const handleInputChange = (e, subServiceIndex, extraIndex = null) => {
    const { name, value } = e.target;
    
    if (extraIndex !== null) {
      // Updating extra service field
      setNewService(prev => {
        const updatedSubServices = [...prev.subServices];
        updatedSubServices[subServiceIndex].extraServices[extraIndex][name] = 
  name === 'cost' ? parseFloat(value) || 0 : 
  name === 'duration' ? parseInt(value) || 0 : 
  value;
        return { ...prev, subServices: updatedSubServices };
      });
    } else if (subServiceIndex !== null) {
      // Updating sub-service field
      setNewService(prev => {
        const updatedSubServices = [...prev.subServices];
        updatedSubServices[subServiceIndex][name] = 
  name === 'baseCost' ? parseFloat(value) || 0 : 
  name === 'duration' ? parseInt(value) || 0 : 
  value;
        return { ...prev, subServices: updatedSubServices };
      });
    } else {
      // Updating main service field
      setNewService(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const serviceData = {
        type: newService.type,
        subServices: newService.subServices.map(sub => ({
          name: sub.name,
          baseCost: parseFloat(sub.baseCost),
          duration:sub.duration,
          requirements: sub.requirements,
          extraServices: sub.extraServices.map(extra => ({
            name: extra.name,
            cost: parseFloat(extra.cost),
            duration:extra.duration
          }))
        }))
      };
  
      let response;
      if (editingService) {
        // Make PUT request to update existing service
        response = await axios.put(
          `http://localhost:5000/api/vet/services/${editingService}`,
          serviceData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Make POST request to create new service
        response = await axios.post(
          'http://localhost:5000/api/vet/services', 
          serviceData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
  
      // Update state based on response
      if (editingService) {
        setServices(services.map(service => 
          service._id === editingService ? response.data : service
        ));
      } else {
        setServices([...services, response.data]);
      }
  
      // Reset form
      setShowForm(false);
      setEditingService(null);
      setNewService({
        type: '',
        subServices: [{
          name: '',
          baseCost: 0,
          duration:0,
          requirements: '',
          extraServices: []
        }]
      });
  
    } catch (err) {
      console.error("Error saving service:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.join(', ') || 
        err.message || 
        'Failed to save service'
      );
    }
  };

    const handleEditService = (service) => {
        setEditingService(service._id); // Store the ID of the service being edited
        setNewService({
          type: service.type,
          subServices: service.subServices.map(sub => ({
            name: sub.name,
            baseCost: parseFloat(sub.baseCost),
            duration:sub.duration,
            requirements: sub.requirements,
            extraServices: sub.extraServices.map(extra => ({
              name: extra.name,
              cost: parseFloat(extra.cost),
             duration:extra.duration
            }))
          }))
        });
        setShowForm(true);

      };

  const handleToggleActive = async (serviceId) => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.patch(
            `http://localhost:5000/api/vet/services/${serviceId}/toggle-active`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setServices(services.map(s => 
            s._id === serviceId ? { ...s, isActive : response.data.isActive } : s
          ));
        } catch (err) {
          setError(err.response?.data?.message || err.message || 'Failed to toggle service status');
        }
    };
        
    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('Are you sure you want to permanently delete this service?')) return;
        
        try {
          const token = localStorage.getItem('token');
          await axios.delete(
            `http://localhost:5000/api/vet/services/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setServices(services.filter(s => s._id !== serviceId));
        } catch (err) {
          setError(err.response?.data?.message || err.message || 'Failed to delete service');
        }
      };


      const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.3 }
        },
        exit: { opacity: 0, x: -50 }
      };
    
      const statusVariants = {
        active: { 
          backgroundColor: "#dcfce7",
          color: "#166534",
          scale: [1, 1.05, 1]
        },
        inactive: { 
          backgroundColor: "#f3f4f6",
          color: "#4b5563",
          scale: [1, 1.05, 1]
        }
      };

      if (loading) return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#325747] mb-4" />
            <p className="text-lg text-[#325747]">Loading services...</p>
          </div>
        </div>
      );

      if (error) return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
            <FontAwesomeIcon icon={faBan} className="text-4xl text-red-500 mb-4" />
            <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Services</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchServices}
              className="mt-4 px-4 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#1e3a2b]"
            >
              Retry
            </button>
          </div>
        </div>
      );


  return (
    <div className=" min-h-screen pt-20 p-4 md:p-8 bg-[#F6F4E8] "
      style={{  fontFamily: "'Laila', sans-serif" ,marginTop:"80px"}}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#325747] flex items-center">
              <FontAwesomeIcon icon={faClipboardList} className="mr-3 text-[#325747]" />
              Clinic Services Management
            </h1>
            <div className="h-1  rounded-full bg-[#E59560]" style={{width:"130px",marginLeft:"40px"}}></div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setEditingService(null);
              setShowForm(true);
            }}
            className="flex items-center bg-[#325747] text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow hover:shadow-md transition-all"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            <span className="whitespace-nowrap">Add New Service</span>
          </motion.button>
        </motion.div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setEditingService(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Service Type</label>
                <select
                  name="type"
                  value={newService.type}
                  onChange={(e) => handleInputChange(e, null)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                  required
                >
                  <option value="">Select a service type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Sub-Services</label>
                {newService.subServices.map((subService, subIndex) => (
                  <div key={subIndex} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-800">Sub-Service #{subIndex + 1}</h3>
                      {newService.subServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubService(subIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={subService.name}
                          onChange={(e) => handleInputChange(e, subIndex)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">Base Cost ($)</label>
                        <input
                          type="number"
                          name="baseCost"
                          value={subService.baseCost}
                          onChange={(e) => handleInputChange(e, subIndex)}
                          min="0"
                          step="0.01"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
                          required
                        />
                      </div>
                      <div>
                          <label className="block text-gray-600 text-sm mb-1">Duration (min)</label>
                             <input
                                type="number"
                                name="duration"
                                value={subService.duration || 30}
                                onChange={(e) => handleInputChange(e, subIndex)}
                                min="5"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
                                required
                              />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">Requirements</label>
                        <input
                          type="text"
                          name="requirements"
                          value={subService.requirements}
                          onChange={(e) => handleInputChange(e, subIndex)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-gray-600 text-sm mb-2">Extra Services</label>
                      {subService.extraServices.map((extra, extraIndex) => (
                        <div key={extraIndex} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            name="name"
                            value={extra.name}
                            onChange={(e) => handleInputChange(e, subIndex, extraIndex)}
                            placeholder="Service name"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747] text-sm"
                          />
                          <input
                            type="number"
                            name="cost"
                            value={extra.cost}
                            onChange={(e) => handleInputChange(e, subIndex, extraIndex)}
                            placeholder="Cost"
                            min="0"
                            step="0.01"
                            className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747] text-sm"
                          />
                           <input
                             type="number"
                             name="duration"
                             value={extra.duration || 0}
                             onChange={(e) => handleInputChange(e, subIndex, extraIndex)}
                             placeholder="Mins"
                             min="0"
                             className="w-16 p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747] text-sm"
                           />
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraService(subIndex, extraIndex)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddExtraService(subIndex)}
                        className="text-[#325747] text-sm hover:underline mt-1 flex items-center"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-1 text-xs" />
                        Add Extra Service
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSubService}
                  className="text-[#325747] text-sm hover:underline flex items-center mt-2"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1 text-xs" />
                  Add Another Sub-Service
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#1e3a2b] flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  )}
                  {editingService ? 'Update Service' : 'Save Service'}
                </button>
              </div>
             
{newService.type === 'vaccination' && (
  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h3 className="font-medium text-blue-800 mb-3">Vaccination Details</h3>
    
    {newService.subServices.map((subService, subIndex) => (
      <div key={subIndex} className="mb-3 p-3 bg-white rounded border border-blue-100">
        <h4 className="font-medium text-gray-700 mb-2">{subService.name}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1">Pet Types</label>
            <select
              multiple
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setNewService(prev => {
                  const updatedSubServices = [...prev.subServices];
                  updatedSubServices[subIndex].petTypes = options;
                  return { ...prev, subServices: updatedSubServices };
                });
              }}
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="rabbit">Rabbit</option>
              <option value="bird">Bird</option>
              <option value="sheep">Sheep</option>
              <option value="cow">Cow</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-600 text-sm mb-1">First Dose Age</label>
            <input
              type="text"
              value={subService.firstDoseAge || ''}
              onChange={(e) => handleInputChange(e, subIndex, null, 'firstDoseAge')}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
              placeholder="e.g., 6-8 weeks"
            />
          </div>
          
          <div className="col-span-2">
            <label className="block text-gray-600 text-sm mb-1">Protects Against</label>
            <input
              type="text"
              value={subService.protectsAgainst || ''}
              onChange={(e) => handleInputChange(e, subIndex, null, 'protectsAgainst')}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
              placeholder="e.g., Distemper, Parvovirus"
            />
          </div>
          
          <div>
            <label className="block text-gray-600 text-sm mb-1">Dose Count</label>
            <input
              type="number"
              value={subService.doseCount || 1}
              onChange={(e) => handleInputChange(e, subIndex, null, 'doseCount')}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
            />
          </div>
          
          <div>
            <label className="block text-gray-600 text-sm mb-1">Dose Interval</label>
            <input
              type="text"
              value={subService.doseInterval || ''}
              onChange={(e) => handleInputChange(e, subIndex, null, 'doseInterval')}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#325747]"
              placeholder="e.g., 3 weeks, 1 year"
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={subService.isRequired !== false}
                onChange={(e) => handleInputChange({
                  target: {
                    name: 'isRequired',
                    value: e.target.checked
                  }
                }, subIndex, null, 'isRequired')}
                className="mr-2"
              />
              <span className="text-gray-600 text-sm">Required Vaccination</span>
            </label>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Available Services</h2>
            <div className="text-sm text-gray-500">
              {services.length} {services.length === 1 ? 'service' : 'services'}
            </div>
          </div>

          <AnimatePresence>
            {services.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-8 text-center"
              >
                <FontAwesomeIcon 
                  icon={faClipboardList} 
                  className="text-4xl text-gray-300 mb-4" 
                />
                <h3 className="text-lg text-gray-500">No services available</h3>
                <p className="text-gray-400 mt-2">Add your first service to get started</p>
              </motion.div>
            ) : (
              <div className="divide-y divide-gray-200">
                {services.map(service => (
                  <motion.div
                    key={service._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="px-4 py-3 cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedService(expandedService === service._id ? null : service._id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${serviceColors[service.type]}`}>
                          <FontAwesomeIcon icon={serviceIcons[service.type]} className="text-lg" />
                        </div>
                        <div>
                          
                          <h3 className="font-medium text-gray-800 capitalize">
                            {service.type.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {service.subServices.length} {service.subServices.length === 1 ? 'sub-service' : 'sub-services'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium mr-3 ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <FontAwesomeIcon 
                          icon={faTimes} 
                          className={`text-gray-400 transition-transform ${expandedService === service._id ? 'transform rotate-90' : ''}`}
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedService === service._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-3"
                        >
                           {/* Vertical bar */}
                          <div className="pl-13 pr-2 pt-2">
                            {service.subServices.map((sub, subIndex) => (
                              <div key={subIndex} className="mb-4 last:mb-0">
                               <div className="flex justify-between items-start mb-1">
  <div className="flex items-center space-x-2">
    <div className="left-0 h-6 w-1 bg-[#325747] rounded"></div>
    <h4 className="font-medium">{sub.name}</h4>
  </div>
  <div className="text-right">
    <span className="block font-medium text-[#325747]">${sub.baseCost.toFixed(2)}</span>
    <span className="text-xs text-gray-500">{sub.duration || 30} mins</span>
  </div>
</div>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Requirements:</span> {sub.requirements}
                                </p>
                                
                                {sub.extraServices.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Extra Services</p>
                                    <div className="space-y-2">
                                      {sub.extraServices.map((extra, extraIndex) => (
                                        <div className="flex justify-between text-sm">
  <div className="flex items-center space-x-2">
    <div className="h-2 w-2 bg-[#E59560] rounded-full"></div>
    <span className="text-gray-700">{extra.name}</span>
  </div>
  <div className="text-right">
    <span className="text-gray-600">+${extra.cost.toFixed(2)}</span>
    <span className="block text-xs text-gray-500">{extra.duration || 0} mins</span>
  </div>
</div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 mt-3">
                              <button
                                onClick={() => handleEditService(service)}
                                className="p-2 text-gray-600 hover:text-[#325747] hover:bg-gray-100 rounded-full"
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              
                              <button
                                onClick={() => handleToggleActive(service._id)}
                                className={`p-2 rounded-full hover:bg-gray-100 ${
                                  service.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'
                                }`}
                                title={service.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <FontAwesomeIcon icon={faPowerOff} />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteService(service._id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded-full"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VetServices;
