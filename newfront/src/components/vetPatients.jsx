import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faPaw, faUser, faCalendarAlt,
  faFilter, faDog, faCat, faQuestionCircle, faEdit,
  faPlus, faHeart, faBullhorn, faNotesMedical,faHome,faUsers
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import FoundPetModal from './FoundPetModal'; // You'll need to create this modal component

const PatientsManagement = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [foundPets, setFoundPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    species: 'all',
    petType: 'all'
  });
  const [showFoundPetModal, setShowFoundPetModal] = useState(false);
  const clinicData = JSON.parse(localStorage.getItem('clinic'));
  const clinicId = clinicData?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch regular patients (with health records)
        const patientsResponse = await axios.get(
          `http://localhost:5000/api/health-records/grouped/by-pet?clinic=${clinicId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setPatients(patientsResponse.data);
        
        // Fetch found pets (both with and without health records)
        const foundPetsResponse = await axios.get(
          `http://localhost:5000/api/vet/found-pets?clinic=${clinicId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
   
        setFoundPets(foundPetsResponse.data || []);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || 'Error fetching data');
        setLoading(false);
      }
    };

    fetchData();
  }, [clinicId]);

  const filteredPatients = patients.filter(patient => {
    if (!patient) return false;
    
    const matchesSearch = 
      (patient.petName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (patient.ownerName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesSpecies = 
      filters.species === 'all' || 
      patient.species === filters.species;
    
    const matchesPetType = 
      filters.petType === 'all' || 
      patient.petType === filters.petType;
    
    return matchesSearch && matchesSpecies && matchesPetType;
  });
  

  const filteredFoundPets = [...foundPets].filter(pet => {
    if (!pet) return false;
    
    const matchesSearch = 
      (pet.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (pet.distinguishingFeatures?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesSpecies = 
      filters.species === 'all' || 
      pet.species === filters.species;
    
    return matchesSearch && matchesSpecies;
  });



  const getSpeciesIcon = (species) => {
    switch (species) {
      case 'dog': return faDog;
      case 'cat': return faCat;
      default: return faPaw;
    }
  };

  const getSpeciesColor = (species) => {
    switch (species) {
      case 'dog': return 'bg-blue-100 text-blue-600';
      case 'cat': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPetTypeBadge = (petType) => {
    let color, text;
    switch (petType) {
      case 'registered':
        color = 'bg-blue-100 text-blue-800';
        text = 'Registered';
        break;
      case 'external':
        color = 'bg-green-100 text-green-800';
        text = 'External';
        break;
      case 'found':
        color = 'bg-orange-100 text-orange-800';
        text = 'Found Pet';
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
        text = 'Unknown';
    }
    return (
      <motion.span 
        whileHover={{ scale: 1.05 }}
        className={`px-2 py-1 rounded-full text-xs ${color}`}
      >
        {text}
      </motion.span>
    );
  };

  const getFoundPetStatusBadge = (status, hasRecords) => {
    let color, text;
    switch (status) {
      case 'in_clinic':
        color = 'bg-yellow-100 text-yellow-800';
        text = 'In Clinic';
        break;
      case 'fostered':
        color = 'bg-indigo-100 text-indigo-800';
        text = 'Fostered';
        break;
      case 'adopted':
        color = 'bg-green-100 text-green-800';
        text = 'Adopted';
        break;
      case 'released':
        color = 'bg-gray-100 text-gray-800';
        text = 'Released';
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
        text = 'Unknown';
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
          {text}
        </span>
        {hasRecords && (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 flex items-center">
            <FontAwesomeIcon icon={faNotesMedical} className="mr-1" />
            Has Records
          </span>
        )}
      </div>
    );
  };

  const viewPatientRecords = (patientId) => {
    navigate(`/health-records`);
  };

  const handleAddFoundPet = async (foundPetData) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/vet/found-pet`,
        { ...foundPetData, clinic: clinicId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setFoundPets([...foundPets, response.data]);
      setShowFoundPetModal(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding found pet');
    }
  };

  const handleCreateAdoptionPost = (petId) => {
    navigate(`/clinic/found-pets/${petId}/create-post`);
  };

  const handleMarkAsAdopted = async (petId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/vet/found-pets/${petId}/status`,
        { status: 'adopted' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setFoundPets(foundPets.map(pet => 
        pet._id === petId ? { ...pet, status: 'adopted' } : pet
      ));
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating pet status');
    }
  };

  const handleViewAdoptionRequests = () => {
    navigate("/clinic/found-pets/adoption/requests");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };


  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
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
            <h1 className="text-2xl md:text-3xl font-bold text-[#325747] flex items-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mr-3"
              >
                <FontAwesomeIcon icon={faPaw} className="text-[#325747]" />
              </motion.div>
              Patient Management
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative mt-7">
              <div className="absolute mt-4 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by pet name, owner, or features..."
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Species Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                value={filters.species}
                onChange={(e) => setFilters({...filters, species: e.target.value})}
              >
                <option value="all">All Species</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
                <option value="bird">Birds</option>
                <option value="rabbit">Rabbits</option>
              </select>
            </div>

            {/* Pet Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient Type</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                value={filters.petType}
                onChange={(e) => setFilters({...filters, petType: e.target.value})}
              >
                <option value="all">All Types</option>
                <option value="registered">Registered Pets</option>
                <option value="external">External Pets</option>
                <option value="found">Found Pets</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Patients List */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#325747] flex items-center">
              <FontAwesomeIcon icon={faPaw} className="mr-2" />
              Patients with Health Records
            </h2>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
              No patients found matching your criteria
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden divide-y divide-gray-200">
              {filteredPatients.map((patient, index) => (
                <motion.div 
                  key={patient._id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.005, backgroundColor: "rgba(249, 250, 251, 1)" }}
                  className="p-6 cursor-pointer transition-all"
                  onClick={() => viewPatientRecords(patient._id)}
                >
                  <div className="flex items-start">
                    {/* Pet Icon */}
                    <motion.div 
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className={`mr-4 p-4 rounded-full ${getSpeciesColor(patient.species)} flex items-center justify-center`}
                    >
                      <FontAwesomeIcon icon={getSpeciesIcon(patient.species)} size="lg" />
                    </motion.div>

                    {/* Pet Info */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-center mb-2 md:mb-0">
                          <h3 className="text-lg md:text-xl font-medium text-[#325747]">
                            {patient.petName}
                          </h3>
                          <span className="ml-3">{getPetTypeBadge(patient.petType)}</span>
                        </div>
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className="text-sm bg-[#E59560] text-white px-3 py-1 rounded-full"
                        >
                          {patient.count} {patient.count === 1 ? 'record' : 'records'}
                        </motion.span>
                      </div>

                      <div className="mt-2 text-sm text-gray-700">
                        {patient.breed} • {patient.species.charAt(0).toUpperCase() + patient.species.slice(1)}
                      </div>

                      {/* Owner Info (for registered and external pets) */}
                      {patient.petType !== 'found' && (
                        <div className="mt-3 flex items-center text-sm text-gray-700">
                          <FontAwesomeIcon icon={faUser} className="mr-2 text-[#325747]" />
                          <span>{patient.ownerName}</span>
                        </div>
                      )}

                      {/* First and Last Visit */}
                      {patient.records.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#325747]" />
                            <span className="text-gray-700">
                              First visit: {formatDate(patient.records[patient.records.length - 1]?.date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#325747]" />
                            <span className="text-gray-700">
                                Last visit: {formatDate(patient.records[0]?.date)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Found Pets Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#325747] flex items-center">
              <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
              Found Pets
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#325747] text-white px-4 py-2 rounded-lg flex items-center"
              onClick={() => setShowFoundPetModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Found Pet
            </motion.button>
          </div>

          {filteredFoundPets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
              No found pets currently in care
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden divide-y divide-gray-200">
              {filteredFoundPets.map((pet, index) => (
                <motion.div 
                  key={pet._id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.005, backgroundColor: "rgba(249, 250, 251, 1)" }}
                  className="p-6 transition-all"
                >
                  <div className="flex items-start">
                    {/* Pet Icon */}
                    <motion.div 
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className={`mr-4 p-4 rounded-full ${getSpeciesColor(pet.species)} flex items-center justify-center`}
                    >
                      <FontAwesomeIcon icon={getSpeciesIcon(pet.species)} size="lg" />
                    </motion.div>

                    {/* Pet Info */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-center mb-2 md:mb-0">
                          <h3 className="text-lg md:text-xl font-medium text-[#325747]">
                            {pet.name || 'Unknown'}
                          </h3>
                          <div className="ml-3">
                            {getFoundPetStatusBadge(pet.status, pet.hasRecords)}
                          </div>
                        </div>
                        {pet.hasRecords && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-sm bg-[#325747] text-white px-3 py-1 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewPatientRecords(pet._id);
                            }}
                          >
                            View Records
                          </motion.button>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-700">
                        {pet.breed || 'Unknown breed'} • {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
                        {pet.estimatedAge && ` • ${pet.estimatedAge}`}
                      </div>

                      {/* Distinguishing Features */}
                      {pet.distinguishingFeatures && (
                        <div className="mt-3 text-sm text-gray-700">
                          <span className="font-medium">Features:</span> {pet.distinguishingFeatures}
                        </div>
                      )}

                      {/* Found Info */}
                      <div className="mt-3 text-sm text-gray-700">
                        <span className="font-medium">Found on:</span> {formatDate(pet.foundDate)}
                        {pet.foundLocation && ` • Found at: ${pet.foundLocation}`}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex flex-wrap gap-2">
  {pet.status !== 'adopted' && (
    <>
      {pet.adoptionStatus === 'available' ? (
        <>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              handleViewAdoptionRequests();
            }}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            View Requests
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkAsAdopted(pet._id);
            }}
          >
            <FontAwesomeIcon icon={faHeart} className="mr-2" />
            Mark as Adopted
          </motion.button>
        </>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/clinic/found-pets/${pet._id}/create-adoption`);
          }}
        >
          <FontAwesomeIcon icon={faHome} className="mr-2" />
          Put Up for Adoption
        </motion.button>
      )}
    </>
 
  )}
                        {!pet.hasRecords && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/health-records/found-pet`);
                            }}
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-2" />
                            Create Health Record
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Found Pet Modal */}
      {showFoundPetModal && (
         <FoundPetModal 
        onClose={() => setShowFoundPetModal(false)}
         onSubmit={handleAddFoundPet}
        initialAdoptionStatus="not_available" // Add this
  />
)}
    </div>
  );
};

export default PatientsManagement;
