import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDog, faCat, faCalendarAlt, faHome,
  faSort, faSortUp, faSortDown, faSearch,
  faUser, faPhone, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const VetActiveTemporaryPets = () => {
  const [activePets, setActivePets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'startDate',
    direction: 'asc'
  });

  const navigate = useNavigate();

  useEffect(() => {
  const fetchActivePets = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/vet/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // The pets are now in response.data.currentTemporaryPets
    const active = response.data.currentTemporaryPets.filter(
      pet => pet.status === 'active'
    );
    
    setActivePets(active);
    setLoading(false);
  } catch (err) {
    setError(err.response?.data?.message || 'Error loading active pets');
    setLoading(false);
  }
};

    fetchActivePets();

    // Set up polling to check for status changes every 30 seconds
    const interval = setInterval(fetchActivePets, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, activePets, sortConfig]);

  const applyFiltersAndSort = () => {
    let results = [...activePets];

    // Apply search filter
    if (searchTerm) {
      results = results.filter(pet => 
        pet.petId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.ownerNotes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      // Handle nested fields
      let aValue, bValue;
      
      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredPets(results);
    console.log([...filteredPets]);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return faSort;
    return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
  };

  const handleCompleteCare = async (petId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/vet-temporary-care/requests/${petId}/status`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove the pet from local state
      setActivePets(prev => prev.filter(pet => pet.petId._id !== petId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating pet status');
    }
  };

  const getPetIcon = (species) => {
    switch(species?.toLowerCase()) {
      case 'dog': return faDog;
      case 'cat': return faCat;
      default: return faDog;
    }
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        {error}
      </div>
    );
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
            <h1 className="text-2xl md:text-3xl font-bold text-[#325747]">
              Active Temporary Care Pets
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "180px" }}></div>
            <p className="text-gray-600 mt-2">
              Currently caring for {activePets.length} pet{activePets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search pets..."
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
                ×
              </button>
            )}
          </div>
        </motion.div>

        {/* Pets Grid */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPets.length === 0 ? (
            <motion.div 
              className="col-span-full text-center py-10"
              variants={fadeIn}
            >
              <p className="text-gray-500 text-lg">
                {activePets.length === 0 
                  ? "You currently have no pets in temporary care." 
                  : "No pets match your search."}
              </p>
            </motion.div>
          ) : (
            filteredPets.map(pet => (
              <motion.div
                key={pet._id}
                variants={fadeIn}
                whileHover={{ y: -5 }}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-[#BACEC1] hover:border-[#E59560] transition-all cursor-pointer"
                onClick={() => navigate(`/pets/${pet.petId._id}`)}
              >
                <div className="relative">
                  <img 
                    src={pet.petId?.img_url || '/default-pet.png'} 
                    alt={pet.petId?.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-[#325747] text-white px-2 py-1 rounded-md text-xs font-semibold">
                    {pet.petId?.species}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-[#325747] flex items-center">
                      <FontAwesomeIcon 
                         icon={getPetIcon(pet.petId?.species)}  
                        className="mr-2"
                      />
                      {pet.petId?.name}
                    </h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-[#E59560]" />
                      <span>Owner: {pet.petId.owner_id?.fullName || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <FontAwesomeIcon icon={faPhone} className="mr-2 text-[#E59560]" />
                      <span>Contact: {pet.petId.owner_id?.phone || 'Not provided'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#E59560]" />
                      <span>
                        {new Date(pet.startDate).toLocaleDateString()} - {new Date(pet.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <FontAwesomeIcon icon={faHome} className="mr-2 text-[#E59560]" />
                      <span>
                        {getDaysRemaining(pet.endDate)} day{getDaysRemaining(pet.endDate) !== 1 ? 's' : ''} remaining
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-[#E59560]" />
                      <span>Rate: ${pet.dailyRate}/day (Total: ${pet.totalCost})</span>
                    </div>
                  </div>
                  
                  {pet.ownerNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Owner Notes:</span> {pet.ownerNotes}
                      </p>
                    </div>
                  )}
                  
                  {pet.specialRequirements?.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-[#325747]">Special Requirements:</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pet.specialRequirements.map((req, idx) => (
                          <span key={idx} className="bg-[#F6F4E8] text-[#325747] text-xs px-2 py-1 rounded">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => handleCompleteCare(pet.requestId, e)}
                      className="bg-[#E59560] hover:bg-[#d4834d] text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Mark as Completed
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default VetActiveTemporaryPets;
