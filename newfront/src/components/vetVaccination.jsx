import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSyringe, faInfoCircle, faEdit, faShieldAlt,
  faDog, faCat, faDove, faCow, faPaw, faSearch,
  faTimes, faSave, faFilter, faPlus
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const VaccinationInfoPage = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [filteredVaccinations, setFilteredVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    petType: '',
    firstDoseAge: ''
  });
  const [editingVaccine, setEditingVaccine] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    petTypes: [],
    firstDoseAge: '',
    protectsAgainst: '',
    doseCount: 1,
    doseInterval: '',
    isRequired: true,
    baseCost: 0,
    extraServices: []
  });

  const generalInfo = {
    description: "Our clinic provides comprehensive vaccination services to protect your pets from various diseases. Vaccinations are scheduled based on your pet's age, health status, and lifestyle.",
    benefits: [
      "Prevents deadly diseases",
      "Protects other pets and humans",
      "Required for boarding and travel",
      "Cost-effective compared to treatment"
    ],
    faqs: [
      {
        question: "Are there side effects?",
        answer: "Mild fever or lethargy may occur for 24-48 hours. Severe reactions are rare."
      },
      {
        question: "Can my pet be vaccinated if sick?",
        answer: "No, we recommend waiting until your pet has fully recovered."
      }
    ]
  };

  const petTypes = [
    { value: 'dog', label: 'Dog', emoji:"🐶"  },
    { value: 'cat', label: 'Cat', emoji: "🐱" },
    { value: 'rabbit', label: 'Rabbit', emoji: '🐇'},
    { value: 'bird', label: 'Bird', emoji: "🐦‍⬛"},
    { value: 'cow', label: 'Cow', emoji: "🐄" },
    { value: 'sheep', label: 'Sheep', emoji: "🐏" },
    { value: 'other', label: 'Other', emoji: "🐾" }
  ];

  useEffect(() => {
    const fetchVaccinations = async () => {
      try {
        const clinicData = JSON.parse(localStorage.getItem('clinic'));
        const response = await axios.get(`http://localhost:5000/api/clinic/vaccinations?clinic=${clinicData.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setVaccinations(response.data);
        setFilteredVaccinations(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading vaccination data');
        setLoading(false);
      }
    };

    fetchVaccinations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, vaccinations]);

  const applyFilters = () => {
    let results = [...vaccinations];

    // Apply search filter
    if (searchTerm) {
      results = results.filter(vaccine => 
        vaccine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vaccine.protectsAgainst.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply pet type filter
    if (filters.petType) {
      results = results.filter(vaccine => 
        vaccine.petTypes.includes(filters.petType)
      );
    }

    // Apply first dose age filter
    if (filters.firstDoseAge) {
      results = results.filter(vaccine => 
        vaccine.firstDoseAge.includes(filters.firstDoseAge)
      );
    }

    setFilteredVaccinations(results);
  };

  const handleEditClick = (vaccine) => {
    setEditingVaccine(vaccine._id);
    setEditForm({
      name: vaccine.name,
      petTypes: [...vaccine.petTypes],
      firstDoseAge: vaccine.firstDoseAge,
      protectsAgainst: vaccine.protectsAgainst,
      doseCount: vaccine.doseCount,
      doseInterval: vaccine.doseInterval,
      isRequired: vaccine.isRequired,
      baseCost: vaccine.baseCost,
      extraServices: [...vaccine.extraServices]
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePetTypeChange = (petType) => {
    setEditForm(prev => {
      const newPetTypes = prev.petTypes.includes(petType)
        ? prev.petTypes.filter(type => type !== petType)
        : [...prev.petTypes, petType];
      return { ...prev, petTypes: newPetTypes };
    });
  };

  const handleExtraServiceChange = (index, field, value) => {
    const newExtraServices = [...editForm.extraServices];
    newExtraServices[index][field] = value;
    setEditForm(prev => ({ ...prev, extraServices: newExtraServices }));
  };

  const addExtraService = () => {
    setEditForm(prev => ({
      ...prev,
      extraServices: [...prev.extraServices, { name: '', cost: 0 }]
    }));
  };

  const removeExtraService = (index) => {
    setEditForm(prev => ({
      ...prev,
      extraServices: prev.extraServices.filter((_, i) => i !== index)
    }));
  };

  const saveVaccination = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/clinic/vaccinations/${editingVaccine}`,
        editForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setVaccinations(prev => 
        prev.map(v => v._id === editingVaccine ? response.data : v)
      );
      setEditingVaccine(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating vaccination');
    }
  };

  const getPetTypeIcon = (type) => {
    const petType = petTypes.find(pt => pt.value === type);
    return petType ? petType.emoji : "🐾"; 
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">{error}</div>;
  }

  return (
    <div className="min-h-screen pt-20 p-4 md:p-8 bg-[#F6F4E8]" style={{ fontFamily: "'Laila', sans-serif", marginTop: "80px" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#325747] flex items-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mr-3"
              >
                <FontAwesomeIcon icon={faSyringe} className="text-[#325747]" />
              </motion.div>
              Vaccination Information
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white rounded-lg shadow-lg p-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or disease..."
                className="w-full p-2 pl-10 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1] hover:text-[#E59560]"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                className="w-full p-2 pl-10 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                value={filters.petType}
                onChange={(e) => setFilters({...filters, petType: e.target.value})}
              >
                <option value="">All Pet Types</option>
                {petTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon 
                icon={faFilter} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Filter by first dose age..."
                className="w-full p-2 pl-10 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                value={filters.firstDoseAge}
                onChange={(e) => setFilters({...filters, firstDoseAge: e.target.value})}
              />
              <FontAwesomeIcon 
                icon={faFilter} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
              />
              {filters.firstDoseAge && (
                <button
                  onClick={() => setFilters({...filters, firstDoseAge: ''})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1] hover:text-[#E59560]"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Description Section */}
          <motion.section 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center mb-4">
              <motion.div
                whileHover={{ rotate: 20 }}
                className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-3"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="text-purple-600 text-xl" />
              </motion.div>
              <h2 className="text-xl font-bold text-[#325747]">About Vaccinations</h2>
            </div>
            <p className="text-gray-700">{generalInfo.description}</p>
          </motion.section>

          {/* Benefits Section */}
          <motion.section 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center mb-4">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3"
              >
                <FontAwesomeIcon icon={faShieldAlt} className="text-green-600 text-xl" />
              </motion.div>
              <h2 className="text-xl font-bold text-[#325747]">Vaccination Benefits</h2>
            </div>
            <ul className="space-y-2">
              {generalInfo.benefits.map((benefit, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-start"
                >
                  <div className="w-5 h-5 rounded-full bg-[#E59560] flex items-center justify-center mt-1 mr-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.section>

          {/* Vaccine Details Section */}
          <motion.section 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#325747]">Available Vaccines</h2>
              <div className="text-sm text-gray-500">
                Showing {filteredVaccinations.length} of {vaccinations.length} vaccines
              </div>
            </div>
            
            {filteredVaccinations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No vaccines match your search criteria
              </div>
            ) : (
              <div className="space-y-6">
                {filteredVaccinations.map((vaccine) => (
                  <div key={vaccine._id} className="border border-gray-200 rounded-lg p-4 relative">
                    {editingVaccine === vaccine._id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name</label>
                            <input
                              type="text"
                              name="name"
                              value={editForm.name}
                              onChange={handleEditChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Protects Against</label>
                            <input
                              type="text"
                              name="protectsAgainst"
                              value={editForm.protectsAgainst}
                              onChange={handleEditChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Pet Types</label>
                          <div className="flex flex-wrap gap-2">
                            {petTypes.map((type) => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => handlePetTypeChange(type.value)}
                                className={`px-3 py-1 rounded-full text-sm flex items-center ${editForm.petTypes.includes(type.value) ? 'bg-[#325747] text-white' : 'bg-gray-200 text-gray-700'}`}
                              >   {type.emoji}
                               
                                {type.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Dose Age</label>
                            <input
                              type="text"
                              name="firstDoseAge"
                              value={editForm.firstDoseAge}
                              onChange={handleEditChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dose Count</label>
                            <input
                              type="number"
                              name="doseCount"
                              value={editForm.doseCount}
                              onChange={handleEditChange}
                              min="1"
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dose Interval</label>
                            <input
                              type="text"
                              name="doseInterval"
                              value={editForm.doseInterval}
                              onChange={handleEditChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Cost</label>
                            <input
                              type="number"
                              name="baseCost"
                              value={editForm.baseCost}
                              onChange={handleEditChange}
                              min="0"
                              step="0.01"
                              className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                name="isRequired"
                                id="isRequired"
                                checked={editForm.isRequired}
                                onChange={handleEditChange}
                                className="mr-2"
                              />
                              <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
                                Required Vaccination
                              </label>
                            </div>
                          </div>
  
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Extra Services
                              <button
                                type="button"
                                onClick={addExtraService}
                                className="ml-2 p-1 text-xs bg-[#325747] text-white rounded"
                              >
                                <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                Add Service
                              </button>
                            </label>
                            {editForm.extraServices.map((extra, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-end">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Service Name</label>
                                  <input
                                    type="text"
                                    value={extra.name}
                                    onChange={(e) => handleExtraServiceChange(index, 'name', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Cost</label>
                                  <input
                                    type="number"
                                    value={extra.cost}
                                    onChange={(e) => handleExtraServiceChange(index, 'cost', parseFloat(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                  />
                                </div>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => removeExtraService(index)}
                                    className="p-2 text-red-500 hover:text-red-700"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
  
                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              onClick={() => setEditingVaccine(null)}
                              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveVaccination}
                              className="px-4 py-2 bg-[#325747] text-white rounded-md hover:bg-[#1e3a2b] flex items-center"
                            >
                              <FontAwesomeIcon icon={faSave} className="mr-2" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-[#325747]">{vaccine.name}</h3>
                            <div className="flex space-x-2">
  {vaccine.petTypes.map((type, idx) => {
    const emoji = getPetTypeIcon(type);
    return (
      <span 
        key={idx}
        title={type.charAt(0).toUpperCase() + type.slice(1)}
        className="text-xl"
      >
        {emoji}
      </span>
    );
  })}
</div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">Protects Against</p>
                              <p className="text-gray-700">{vaccine.protectsAgainst}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">First Dose Age</p>
                              <p className="text-gray-700">{vaccine.firstDoseAge}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Dose Schedule</p>
                              <p className="text-gray-700">
                                {vaccine.doseCount} dose{vaccine.doseCount > 1 ? 's' : ''}{' '}
                                {vaccine.doseCount > 1 ? `(${vaccine.doseInterval} between doses)` : ''}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Requirement</p>
                              <p className="text-gray-700">
                                {vaccine.isRequired ? 'Required' : 'Optional'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-1">Cost Information</p>
                            <div className="flex justify-between">
                              <span>Base Cost: ${vaccine.baseCost}</span>
                              {vaccine.extraServices.length > 0 && (
                                <div className="text-right">
                                  <p className="text-sm font-medium">Optional Extras:</p>
                                  {vaccine.extraServices.map((extra, idx) => (
                                    <div key={idx} className="text-sm">
                                      {extra.name}: +${extra.cost}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
  
                          <div className="absolute top-4 right-4">
                            <button
                              onClick={() => handleEditClick(vaccine)}
                              className="p-2 text-[#325747] hover:text-[#E59560]"
                              title="Edit vaccine"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
  
            {/* FAQs Section */}
            <motion.section 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-[#325747] mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {generalInfo.faqs.map((faq, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-800 mb-2">{faq.question}</h3>
                    <p className="text-gray-700">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    );
  };
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  export default VaccinationInfoPage;
