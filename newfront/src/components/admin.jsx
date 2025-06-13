import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, faTimes, faEye, 
  faChevronUp, faChevronDown, faSearch,
  faFilter, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';
import { motion } from 'framer-motion';

const AdminApprovals = () => {
  const [pendingVets, setPendingVets] = useState([]);
  const [filteredVets, setFilteredVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ 
    key: 'createdAt', 
    direction: 'desc' 
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchPendingVets();
  }, []);

  useEffect(() => {
    filterAndSortVets();
  }, [pendingVets, searchTerm, sortConfig, statusFilter, dateFilter]);

  const fetchPendingVets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/admin/pending-vets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingVets(response.data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVets = () => {
    let result = [...pendingVets];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(vet => 
        (vet.vetId?.clinicName?.toLowerCase().includes(term)) ||
        (vet.vetId?.fullName?.toLowerCase().includes(term)) ||
        (vet.vetId?.email?.toLowerCase().includes(term)) ||
        (vet.vetId?.city?.toLowerCase().includes(term))
     )}

    // Apply status filter (if you add status field later)
    if (statusFilter !== 'all') {
      result = result.filter(vet => vet.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(vet => {
        const vetDate = new Date(vet.createdAt);
        switch(dateFilter) {
          case 'today': 
            return vetDate.toDateString() === now.toDateString();
          case 'week':
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            return vetDate > oneWeekAgo;
          case 'month':
            const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return vetDate > oneMonthAgo;
          default:
            return true;
        }
      });
    }

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

    setFilteredVets(result);
  };

  const getSortValue = (vet, key) => {
    switch(key) {
      case 'clinicName': return vet.vetId?.clinicName?.toLowerCase() || '';
      case 'fullName': return vet.vetId?.fullName?.toLowerCase() || '';
      case 'createdAt': return new Date(vet.createdAt);
      default: return vet[key] || '';
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleApprove = async (vetId) => {
    if (!window.confirm('Are you sure you want to approve this veterinarian?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/approve-vet/${vetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Veterinarian approved successfully');
      fetchPendingVets();
    } catch (error) {
      handleApiError(error);
    }
  };
  
  const handleReject = async (vetId) => {
    if (!window.confirm('Are you sure you want to reject this veterinarian?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/reject-vet/${vetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Veterinarian rejected');
      fetchPendingVets();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleApiError = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      alert('Session expired. Please login again.');
      // Redirect to login here if needed
    } else {
      alert(error.response?.data?.message || 'An error occurred');
    }
  };

  const showLicenseModal = (vet) => {
    setSelectedVet(vet);
    setIsModalVisible(true);
  };

  const columns = [
    {
      key: 'clinicName',
      header: 'Clinic Name',
      render: (row) => row.vetId?.clinicName || 'N/A',
      sortable: true
    },
    {
      key: 'fullName',
      header: 'Vet Name',
      render: (row) => row.vetId?.fullName || 'N/A',
      sortable: true
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.vetId?.email || 'N/A',
      sortable: true
    },
    {
      key: 'city',
      header: 'City',
      render: (row) => row.vetId?.city || 'N/A',
      sortable: true
    },
    {
      key: 'createdAt',
      header: 'Submission Date',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A',
      sortable: true
    },
    {
      key: 'license',
      header: 'License',
      render: (row) => (
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#325747] text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
          onClick={() => showLicenseModal(row)}
        >
          <FontAwesomeIcon icon={faEye} />
          View
        </motion.button>
      ),
      sortable: false
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => handleApprove(row.vetId?._id)}
            disabled={!row.vetId}
          >
            <FontAwesomeIcon icon={faCheck} />
            Approve
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => handleReject(row.vetId?._id)}
            disabled={!row.vetId}
          >
            <FontAwesomeIcon icon={faTimes} />
            Reject
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
              <h1 className="text-2xl md:text-3xl font-bold">Veterinarian Approvals</h1>
              <p className="text-gray-300 mt-2">
                {filteredVets.length} pending approval{filteredVets.length !== 1 ? 's' : ''}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search vets..."
                className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                className="rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500" />
              <select
                className="rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent w-full"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
                setSortConfig({ key: 'createdAt', direction: 'desc' });
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200"
            >
              Clear Filters
            </button>
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
          ) : filteredVets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'No matching veterinarians found' 
                  : 'No pending veterinarian approvals'}
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
                  {filteredVets.map((vet) => (
                    <motion.tr 
                      key={vet._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {column.render(vet)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* License Modal */}
        {isModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Clinic License Verification</h2>
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-6">
                {selectedVet && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-700 mb-2">Clinic Information</h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {selectedVet.vetId?.clinicName || 'N/A'}</p>
                          <p><span className="font-medium">Veterinarian:</span> {selectedVet.vetId?.fullName || 'N/A'}</p>
                          <p><span className="font-medium">Email:</span> {selectedVet.vetId?.email || 'N/A'}</p>
                          <p><span className="font-medium">Location:</span> {selectedVet.vetId?.city || 'N/A'}</p>
                          <p><span className="font-medium">Submitted:</span> {selectedVet.createdAt ? new Date(selectedVet.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-700 mb-2">License Details</h3>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <img 
                            src={`http://localhost:5000${selectedVet.licenseImage || selectedVet.vetId?.clinicLicense?.imageUrl}`} 
                            alt="Clinic License" 
                            className="w-full h-auto max-h-60 object-contain mx-auto"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                        onClick={() => handleReject(selectedVet.vetId?._id)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        Reject Application
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                        onClick={() => handleApprove(selectedVet.vetId?._id)}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        Approve Application
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminApprovals;