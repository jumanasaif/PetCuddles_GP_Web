import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaw, faSearch, faFilter, faCalendarAlt,
  faChevronUp, faChevronDown, faEye, faEdit,
  faTrash, faQrcode, faWeight, faBone,
  faSyringe, faNotesMedical, faUser, faHome
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';
import { motion } from 'framer-motion';

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchAllPets();
  }, []);

  useEffect(() => {
    filterAndSortPets();
  }, [pets, searchTerm, sortConfig]);

  const fetchAllPets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/all-pets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPets(response.data);
    } catch (error) {
      console.error('Error fetching pets:', error);
      alert('Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPets = () => {
    let result = [...pets];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(pet => 
        pet.name.toLowerCase().includes(term) ||
        pet.species.toLowerCase().includes(term) ||
        (pet.breed && pet.breed.toLowerCase().includes(term)) ||
        (pet.owner_id?.fullName && pet.owner_id.fullName.toLowerCase().includes(term))
    )}

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredPets(result);
  };

  const getSortValue = (pet, key) => {
    switch(key) {
      case 'name': return pet.name.toLowerCase();
      case 'species': return pet.species.toLowerCase();
      case 'breed': return pet.breed?.toLowerCase() || '';
      case 'age': return pet.age || 0;
      case 'weight': return pet.weight || 0;
      case 'owner': return pet.owner_id?.fullName?.toLowerCase() || '';
      case 'created_at': 
        const date = new Date(pet.created_at);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      case 'adoption_status': return pet.adoption_status;
      default: return pet[key] || '';
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const showPetDetails = (pet) => {
    setSelectedPet(pet);
    setIsModalVisible(true);
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/pets/${petId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pet deleted successfully');
      fetchAllPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Failed to delete pet');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const columns = [
    {
      key: 'name',
      header: 'Pet Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.img_url ? (
            <img 
              src={row.img_url} 
              alt={row.name} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faPaw} />
            </div>
          )}
          <span>{row.name}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'species',
      header: 'Species',
      render: (row) => row.species.charAt(0).toUpperCase() + row.species.slice(1),
      sortable: true
    },
    {
      key: 'breed',
      header: 'Breed',
      render: (row) => row.breed || 'N/A',
      sortable: true
    },
    {
      key: 'age',
      header: 'Age',
      render: (row) => row.age ? `${row.age} years` : 'N/A',
      sortable: true
    },
    {
      key: 'weight',
      header: 'Weight',
      render: (row) => row.weight ? `${row.weight} kg` : 'N/A',
      sortable: true
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => row.owner_id?.fullName || 'N/A',
      sortable: true
    },
    {
      key: 'adoption_status',
      header: 'Status',
      render: (row) => {
        const statusMap = {
          available: { text: 'Available', color: 'bg-green-100 text-green-800' },
          notAvailable: { text: 'Not Available', color: 'bg-gray-100 text-gray-800' },
          adopted: { text: 'Adopted', color: 'bg-blue-100 text-blue-800' },
          temporarilyAdopted: { text: 'Temp. Adopted', color: 'bg-yellow-100 text-yellow-800' }
        };
        const status = statusMap[row.adoption_status] || { text: row.adoption_status, color: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
            {status.text}
          </span>
        );
      },
      sortable: true
    },
    {
      key: 'created_at',
      header: 'Registered',
      render: (row) => formatDate(row.created_at),
      sortable: true
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#325747] text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => showPetDetails(row)}
          >
            <FontAwesomeIcon icon={faEye} />
            View
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => handleDeletePet(row._id)}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </motion.button>
        </div>
      ),
      sortable: false
    },
  ];

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
              <h1 className="text-2xl md:text-3xl font-bold">Pets Management</h1>
              <p className="text-gray-300 mt-2">
                {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} registered
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search pets..."
                className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                className="rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent w-full"
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setFilteredPets(pets);
                  } else {
                    setFilteredPets(pets.filter(pet => pet.adoption_status === e.target.value));
                  }
                }}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="notAvailable">Not Available</option>
                <option value="adopted">Adopted</option>
                <option value="temporarilyAdopted">Temporarily Adopted</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500" />
              <select
                className="rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent w-full"
                onChange={(e) => {
                  const now = new Date();
                  let filtered = [...pets];
                  
                  if (e.target.value !== 'all') {
                    filtered = filtered.filter(pet => {
                      const petDate = new Date(pet.created_at);
                      switch(e.target.value) {
                        case 'today': 
                          return petDate.toDateString() === now.toDateString();
                        case 'week':
                          const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
                          return petDate > oneWeekAgo;
                        case 'month':
                          const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
                          return petDate > oneMonthAgo;
                        default:
                          return true;
                      }
                    });
                  }
                  
                  setFilteredPets(filtered);
                }}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No matching pets found' : 'No pets registered'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#325747]">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-[#2a473b]' : ''}`}
                        onClick={() => column.sortable && requestSort(column.key)}
                      >
                        <div className="flex items-center">
                          {column.header}
                          {column.sortable && (
                            <span className="ml-1">
                              {sortConfig.key === column.key ? (
                                sortConfig.direction === 'asc' ? (
                                  <FontAwesomeIcon icon={faChevronUp} />
                                ) : (
                                  <FontAwesomeIcon icon={faChevronDown} />
                                )
                              ) : (
                                <FontAwesomeIcon icon={faChevronUp} className="opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPets.map((pet) => (
                    <motion.tr 
                      key={pet._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render(pet)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pet Details Modal */}
        {isModalVisible && selectedPet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">{selectedPet.name}'s Details</h2>
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-6">
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-[#E59560] text-[#325747]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      <FontAwesomeIcon icon={faPaw} className="mr-2" />
                      Basic Details
                    </button>
                    <button
                      onClick={() => setActiveTab('health')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'health' ? 'border-[#E59560] text-[#325747]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      <FontAwesomeIcon icon={faNotesMedical} className="mr-2" />
                      Health Records
                    </button>
                    <button
                      onClick={() => setActiveTab('nutrition')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'nutrition' ? 'border-[#E59560] text-[#325747]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      <FontAwesomeIcon icon={faBone} className="mr-2" />
                      Nutrition
                    </button>
                    <button
                      onClick={() => setActiveTab('vaccination')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vaccination' ? 'border-[#E59560] text-[#325747]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      <FontAwesomeIcon icon={faSyringe} className="mr-2" />
                      Vaccinations
                    </button>
                    <button
                      onClick={() => setActiveTab('weight')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'weight' ? 'border-[#E59560] text-[#325747]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      <FontAwesomeIcon icon={faWeight} className="mr-2" />
                      Weight History
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                  {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Pet Image and Basic Info */}
                      <div className="col-span-1">
                        <div className="flex flex-col items-center">
                          {selectedPet.img_url ? (
                            <img 
                              src={selectedPet.img_url} 
                              alt={selectedPet.name} 
                              className="w-48 h-48 rounded-lg object-cover mb-4"
                            />
                          ) : (
                            <div className="w-48 h-48 rounded-lg bg-[#E59560] flex items-center justify-center text-white text-6xl">
                              <FontAwesomeIcon icon={faPaw} />
                            </div>
                          )}
                          
                          <div className="mt-4 w-full space-y-4">
                            <div>
                              <h3 className="font-bold text-[#325747]">QR Code</h3>
                              {selectedPet.qrCodeUrl ? (
                                <img 
                                  src={selectedPet.qrCodeUrl} 
                                  alt="Pet QR Code" 
                                  className="w-32 h-32 mx-auto mt-2"
                                />
                              ) : (
                                <p className="text-gray-500 text-sm mt-1">No QR code generated</p>
                              )}
                            </div>
                            
                            <div>
                              <h3 className="font-bold text-[#325747]">Adoption Status</h3>
                              <div className="mt-1">
                                {selectedPet.adoption_status === 'available' && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    Available for Adoption
                                  </span>
                                )}
                                {selectedPet.adoption_status === 'notAvailable' && (
                                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                                    Not Available
                                  </span>
                                )}
                                {selectedPet.adoption_status === 'adopted' && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    Permanently Adopted
                                  </span>
                                )}
                                {selectedPet.adoption_status === 'temporarilyAdopted' && (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                    Temporarily Adopted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pet Details */}
                      <div className="col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-bold text-[#325747] mb-2">Basic Information</h3>
                            <div className="space-y-2">
                              <p><span className="font-medium">Name:</span> {selectedPet.name}</p>
                              <p><span className="font-medium">Species:</span> {selectedPet.species.charAt(0).toUpperCase() + selectedPet.species.slice(1)}</p>
                              <p><span className="font-medium">Breed:</span> {selectedPet.breed || 'N/A'}</p>
                              <p><span className="font-medium">Gender:</span> {selectedPet.gender.charAt(0).toUpperCase() + selectedPet.gender.slice(1)}</p>
                              <p><span className="font-medium">Age:</span> {selectedPet.age ? `${selectedPet.age} years` : 'N/A'}</p>
                              <p><span className="font-medium">Weight:</span> {selectedPet.weight ? `${selectedPet.weight} kg` : 'N/A'}</p>
                              <p><span className="font-medium">Birth Date:</span> {formatDate(selectedPet.birth_date)}</p>
                              <p><span className="font-medium">Registered:</span> {formatDate(selectedPet.created_at)}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-bold text-[#325747] mb-2">Ownership</h3>
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium">Primary Owner</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                                  <span>{selectedPet.owner_id?.fullName || 'N/A'}</span>
                                </div>
                                {selectedPet.owner_id?.email && (
                                  <p className="text-sm text-gray-600 mt-1">{selectedPet.owner_id.email}</p>
                                )}
                              </div>
                              
                              {selectedPet.adoption_status === 'temporarilyAdopted' && selectedPet.temporaryCaretaker && (
                                <div>
                                  <p className="font-medium">Temporary Caretaker</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <FontAwesomeIcon icon={faUser} className="text-[#E59560]" />
                                    <span>{selectedPet.temporaryCaretaker.userId?.fullName || 'N/A'}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {formatDate(selectedPet.temporaryCaretaker.startDate)} - {formatDate(selectedPet.temporaryCaretaker.endDate)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="font-bold text-[#325747] mb-2">Health Status</h3>
                          <p>{selectedPet.health_status || 'No health status recorded'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'health' && (
                    <div>
                      <h3 className="font-bold text-[#325747] mb-4">Health Records</h3>
                      {selectedPet.healthRecords?.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPet.healthRecords.map((record, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{record.title}</h4>
                                  <p className="text-sm text-gray-600">{formatDate(record.date)}</p>
                                  <p className="mt-2">{record.description}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  record.type === 'vet_visit' ? 'bg-blue-100 text-blue-800' :
                                  record.type === 'vaccination' ? 'bg-green-100 text-green-800' :
                                  record.type === 'medication' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {record.type.replace('_', ' ').charAt(0).toUpperCase() + record.type.replace('_', ' ').slice(1)}
                                </span>
                              </div>
                              {record.images?.length > 0 && (
                                <div className="mt-3 flex gap-2">
                                  {record.images.map((img, i) => (
                                    <img key={i} src={img} alt={`Health record ${index}`} className="h-20 w-20 object-cover rounded" />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No health records available</p>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'nutrition' && (
                    <div>
                      <h3 className="font-bold text-[#325747] mb-4">Nutrition Information</h3>
                      {selectedPet.nutritionAnalysis?.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPet.nutritionAnalysis.map((analysis, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">Nutrition Analysis</h4>
                                  <p className="text-sm text-gray-600">{formatDate(analysis.date)}</p>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Calories</p>
                                  <p>{analysis.calories || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Ideal Weight</p>
                                  <p>{analysis.idealWeightRange || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Food Recommendation</p>
                                  <p>{analysis.foodRecommendation || 'N/A'}</p>
                                </div>
                              </div>
                              {analysis.warning && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <p className="font-medium text-yellow-800">{analysis.warning.title}</p>
                                  <p className="text-yellow-700">{analysis.warning.message}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No nutrition analysis available</p>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'vaccination' && (
                    <div>
                      <h3 className="font-bold text-[#325747] mb-4">Vaccination Records</h3>
                      {selectedPet.vaccinations?.length > 0 ? (
                        <div className="space-y-4">
                          {selectedPet.vaccinations.map((vaccine, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{vaccine.name}</h4>
                                  <p className="text-sm text-gray-600">{vaccine.type}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm">{formatDate(vaccine.date)}</p>
                                  <p className="text-xs text-gray-500">Dose {vaccine.doseNumber} of {vaccine.totalDoses}</p>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Next Due</p>
                                  <p>{formatDate(vaccine.nextDue) || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Administered By</p>
                                  <p>{vaccine.vet?.name || vaccine.clinic?.name || 'N/A'}</p>
                                </div>
                              </div>
                              {vaccine.notes && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium">Notes</p>
                                  <p className="text-gray-700">{vaccine.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No vaccination records available</p>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'weight' && (
                    <div>
                      <h3 className="font-bold text-[#325747] mb-4">Weight History</h3>
                      {selectedPet.weight_history?.length > 0 ? (
                        <div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {selectedPet.weight_history.map((record, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(record.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {record.weight}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      {record.notes || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No weight history available</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => setIsModalVisible(false)}
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E59560] text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => {
                      // Implement edit functionality
                      console.log("Edit pet:", selectedPet._id);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit Pet
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#325747] text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => {
                      // Implement QR code generation
                      console.log("Generate QR for:", selectedPet._id);
                    }}
                  >
                    <FontAwesomeIcon icon={faQrcode} />
                    Generate QR Code
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPets;
