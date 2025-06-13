import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faFilter, faPaw,
  faChevronDown, faChevronRight,
  faEdit, faTrash,faPlus, faFileMedical, faSync,
  faArrowUp, faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HealthRecordsPage = () => {
  const navigate = useNavigate();
  const [groupedRecords, setGroupedRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPets, setExpandedPets] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [groupStates, setGroupStates] = useState({});

  const [filters, setFilters] = useState({
    species: 'all',
    dateRange: 'all',
    petType: 'all'
  });

  // Initialize group states when records are loaded
  useEffect(() => {
    if (groupedRecords.length > 0) {
      const initialGroupStates = {};
      groupedRecords.forEach(group => {
        initialGroupStates[group._id] = {
          sortOrder: 'desc', // default: newest first
          doctorFilter: 'all'
        };
      });
      setGroupStates(initialGroupStates);
    }
  }, [groupedRecords]);

  // Fetch grouped health records and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clinicData = JSON.parse(localStorage.getItem('clinic'));
        const clinicId = clinicData?.id;
        
        // Fetch grouped records
        const recordsResponse = await axios.get(
          `http://localhost:5000/api/health-records/grouped/by-pet?clinic=${clinicId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
        
        // Fetch doctors list
        const doctorsResponse = await axios.get(
          `http://localhost:5000/api/vet/doctors?clinic=${clinicId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
        
        setGroupedRecords(recordsResponse.data || []);
        const doctorsList = doctorsResponse.data.map(doctor => ({
          _id: doctor._id,
          name: doctor.name
        }));

        setDoctors(doctorsList);       
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error loading data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...groupedRecords];

    if (filters.petType !== 'all') {
      result = result.filter(group => 
        group.petType === filters.petType
      );
    }

    // Apply species filter
    if (filters.species !== 'all') {
      result = result.filter(group => 
        group.species.toLowerCase() === filters.species.toLowerCase()
      );
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.dateRange === 'today') {
        result = result.map(group => ({
          ...group,
          records: group.records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.toDateString() === today.toDateString();
          })
        })).filter(group => group.records.length > 0);
      } else if (filters.dateRange === 'this_week') {
        const start = startOfWeek(today);
        const end = endOfWeek(today);
        
        result = result.map(group => ({
          ...group,
          records: group.records.filter(record => {
            const recordDate = new Date(record.date);
            return isWithinInterval(recordDate, { start, end });
          })
        })).filter(group => group.records.length > 0);
      } else if (filters.dateRange === 'this_month') {
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        
        result = result.map(group => ({
          ...group,
          records: group.records.filter(record => {
            const recordDate = new Date(record.date);
            return isWithinInterval(recordDate, { start, end });
          })
        })).filter(group => group.records.length > 0);
      } else if (filters.dateRange === 'custom' && dateRange.startDate && dateRange.endDate) {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        
        result = result.map(group => ({
          ...group,
          records: group.records.filter(record => {
            const recordDate = new Date(record.date);
            return isWithinInterval(recordDate, { start, end });
          })
        })).filter(group => group.records.length > 0);
      }
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(group => 
        group.petName.toLowerCase().includes(term) ||
        group.ownerName?.toLowerCase().includes(term) ||
        group.records.some(record => 
          record.diagnosis?.toLowerCase().includes(term) ||
          record.doctor?.toLowerCase().includes(term)
        )
      );
    }

    setFilteredRecords(result);
  }, [groupedRecords, filters, searchTerm, dateRange]);

  // Handle group-specific doctor filter change
  const handleGroupDoctorFilter = (groupId, doctorId) => {
    setGroupStates(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        doctorFilter: doctorId
      }
    }));
  };

  // Handle group sorting toggle
  const toggleGroupSortOrder = (groupId) => {
    setGroupStates(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        sortOrder: prev[groupId].sortOrder === 'asc' ? 'desc' : 'asc'
      }
    }));
  };

  // Get filtered and sorted records for a specific group
  const getProcessedRecords = (groupId, originalRecords) => {
    if (!groupStates[groupId]) return originalRecords;
    
    const { doctorFilter, sortOrder } = groupStates[groupId];
    let records = [...originalRecords];
  
    // Apply doctor filter - ensure we're comparing strings
    if (doctorFilter !== 'all') {
      records = records.filter(record => {
        // Ensure both values are strings for comparison
        const recordDoctorId = record.doctorId?.toString();
        const filterDoctorId = doctorFilter.toString();
        return recordDoctorId === filterDoctorId;
      });
    }
  
    // Apply sorting
    records.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  
    return records;
  };

  // Toggle expanded state for a pet
  const toggleExpandPet = (petId) => {
    setExpandedPets(prev => ({
      ...prev,
      [petId]: !prev[petId]
    }));
  };

  // Delete health record
  const deleteHealthRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/health-records/${recordId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );

      // Refresh the records
      const clinicData = JSON.parse(localStorage.getItem('clinic'));
      const clinicId = clinicData?.id;
      const response = await axios.get(
        `http://localhost:5000/api/health-records/grouped/by-pet?clinic=${clinicId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      setGroupedRecords(response.data || []);
      toast.success('Health record deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting health record');
    }
  };

  // Reset all filters
const resetFilters = () => {
  setFilters({
    species: 'all',
    dateRange: 'all',
    petType: 'all' 
  });
  setDateRange({
    startDate: '',
    endDate: ''
  });
  setSearchTerm('');
};
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
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
    <div 
    className="container mx-auto px-8 py-8 min-h-screen"
    style={{ backgroundColor: "#F6F4E8 ", fontFamily: "'Laila', sans-serif" ,marginTop:"80px"}}
  >
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#325747]">
           <FontAwesomeIcon icon={faFileMedical} className="mr-3 text-[#325747]" />
            Pet Health Records
          </h1>
          <div className="h-1 rounded-full bg-[#E59560]"style={{width:"130px",marginLeft:"40px"}} ></div>
        </div>
        
        <button
          onClick={() => navigate("/health-records/found-pet")} 
          className="text-[#325747] hover:text-[#E59560] flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} size="lg" />
          Add record for found pet 
        </button>
      </motion.div>
    
      {/* Search and Filter Bar */}
      <div className="bg-[#e9eee7] rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by pet name, owner name, diagnosis, or doctor..."
              className="pl-10 pr-4 py-2 w-full bg-[#e7eee9] border border-gray-400 rounded-lg focus:ring-[#E59560] focus:border-[#E59560]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-[#E59560] focus:border-[#E59560]"
                value={filters.petType}
                onChange={(e) => setFilters({ ...filters, petType: e.target.value })}
             >
                <option value="all">All Pet Types</option>
                <option value="registered">Registered Pets</option>
                <option value="external">External Pets</option>
                <option value="found">Found Pets</option>
           </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-[#E59560] focus:border-[#E59560]"
              value={filters.species}
              onChange={(e) => setFilters({ ...filters, species: e.target.value })}
            >
              <option value="all">All Species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="other">Other</option>
            </select>

            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-[#E59560] focus:border-[#E59560]"
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {filters.dateRange === 'custom' && (
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="border border-gray-300 rounded-lg px-2 py-1"
                />
                <span className="flex items-center">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="border border-gray-300 rounded-lg px-2 py-1"
                />
              </div>
            )}
            
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
            >
             <FontAwesomeIcon icon={faSync} className="mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Grouped Records List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No health records found matching your criteria
          </div>
        ) : (
          <div className="divide-y divide-gray-400">
            {filteredRecords.map(group => (
              <div key={group._id} className="p-4 hover:bg-gray-50 transition-colors  ">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpandPet(group._id)}
                >
                  <div className="flex items-center space-x-4">
                    <FontAwesomeIcon 
                      icon={faFileMedical} 
                      className="h-8 w-8 rounded-full p-2 text-[#9cb8a7] bg-[#e7eee9]" 
                    />
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {group.petName}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {group.species} • {group.breed} • Owner: {group.ownerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {group.count} record{group.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <FontAwesomeIcon 
                    icon={expandedPets[group._id] ? faChevronDown : faChevronRight} 
                    className="text-gray-400" 
                  />
                </div>
                
                {/* Expanded content */}
                {expandedPets[group._id] && (
                  <div className="mt-4 pl-12">
                    {/* Group-specific filters */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Filter by doctor:</span>
                        <select
                          className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          value={groupStates[group._id]?.doctorFilter || 'all'}
                          onChange={(e) => handleGroupDoctorFilter(group._id, e.target.value)}
                        >
                          <option value="all">All Doctors</option>
                          {doctors.map(doctor => (
                            <option key={doctor._id} value={doctor._id.toString()}>
                              Dr. {doctor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Sort by date:</span>
                        <button
                          onClick={() => toggleGroupSortOrder(group._id)}
                          className="p-1 text-[#E59560] hover:text-[#325747]"
                          title={groupStates[group._id]?.sortOrder === 'asc' ? 'Newest first' : 'Oldest first'}
                        >
                          {groupStates[group._id]?.sortOrder === 'asc' ? (
                            <FontAwesomeIcon icon={faArrowUp} />
                          ) : (
                            <FontAwesomeIcon icon={faArrowDown} />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#f7f9f7]">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Diagnosis
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Veterinarian
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getProcessedRecords(group._id, group.records).map(record => (
                            <tr key={record.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(parseISO(record.date), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {record.diagnosis || 'No diagnosis recorded'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                Dr. {record.doctor}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => navigate(`/health-records/${record.id}`)}
                                  className="text-[#E59560] hover:text-[#325747] " 
                                >
                                  <FontAwesomeIcon icon={faFileMedical} className='px-2'/>
                                    View Full Record
                                </button>
                            
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default HealthRecordsPage;