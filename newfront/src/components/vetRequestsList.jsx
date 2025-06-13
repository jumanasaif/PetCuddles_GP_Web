import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, faCheckCircle, faTimesCircle, 
  faSort, faSortUp, faSortDown, faTrashAlt,
  faSearch, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const VetRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  const navigate = useNavigate();

  const statusFilters = [
    { id: 'all', label: 'All Requests', icon: faFilter },
    { id: 'pending', label: 'Pending', icon: faClock },
    { id: 'approved', label: 'Approved', icon: faCheckCircle },
    { id: 'rejected', label: 'Rejected', icon: faTimesCircle }
  ];

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/vet-temporary-care/vet/requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading requests');
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, activeFilter, requests, sortConfig]);

  const applyFiltersAndSort = () => {
    let results = [...requests];

    // Apply status filter
    if (activeFilter !== 'all') {
      results = results.filter(req => req.status === activeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      results = results.filter(req => 
        req.petId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.ownerId.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredRequests(results);
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

  const handleDelete = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/vet-temporary-care/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting request');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return faCheckCircle;
      case 'rejected': return faTimesCircle;
      case 'pending': return faClock;
      default: return faFilter;
    }
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
              Temporary Care Requests
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "180px" }}></div>
          </div>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by pet or owner..."
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
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Status Filter Tabs */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-6"
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
        >
          {statusFilters.map(filter => (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                activeFilter === filter.id 
                  ? 'bg-[#325747] text-white' 
                  : 'bg-white text-[#325747] hover:bg-gray-100'
              }`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <FontAwesomeIcon icon={filter.icon} />
              <span>{filter.label}</span>
              {activeFilter === filter.id && (
                <motion.div 
                  layoutId="underline"
                  className="h-0.5 bg-[#E59560] absolute bottom-0 left-0 right-0"
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Requests Table */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F6F4E8]">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-[#325747] uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('petId.name')}
                  >
                    <div className="flex items-center">
                      Pet
                      <FontAwesomeIcon 
                        icon={getSortIcon('petId.name')} 
                        className="ml-1"
                      />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-[#325747] uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('ownerId.fullName')}
                  >
                    <div className="flex items-center">
                      Owner
                      <FontAwesomeIcon 
                        icon={getSortIcon('ownerId.fullName')} 
                        className="ml-1"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#325747] uppercase tracking-wider">
                    Care Period
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-[#325747] uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <FontAwesomeIcon 
                        icon={getSortIcon('status')} 
                        className="ml-1"
                      />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-[#325747] uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Request Date
                      <FontAwesomeIcon 
                        icon={getSortIcon('createdAt')} 
                        className="ml-1"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#325747] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(request => (
                    <motion.tr 
                      key={request._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="cursor-pointer"
                      onClick={() => navigate(`/clinic/temporary-care/requests/${request._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={request.petId.img_url || '/default-pet.png'} 
                              alt={request.petId.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.petId.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.petId.breed}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.ownerId.fullName}</div>
                        <div className="text-sm text-gray-500">{request.ownerId.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-1" />
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(request._id);
                          }}
                          className="text-red-600 hover:text-red-900 mr-3"
                          title="Delete request"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default VetRequestsList;