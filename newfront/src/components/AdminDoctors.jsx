import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserDoctor, faUser, faClinicMedical, faSearch, faFilter, 
  faChevronUp, faChevronDown, faEye,
  faBan, faCheck, faTrash, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';
import { motion } from 'framer-motion';

const AdminDoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterAndSortDoctors();
  }, [doctors, searchTerm, sortConfig]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      alert('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDoctors = () => {
    let result = [...doctors];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(doctor => 
        doctor.name.toLowerCase().includes(term) ||
        doctor.email.toLowerCase().includes(term) ||
        doctor.phone.toLowerCase().includes(term) ||
        (doctor.clinic && doctor.clinic.clinicName.toLowerCase().includes(term)) ||
        doctor.specialty.toLowerCase().includes(term)
      );
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

    setFilteredDoctors(result);
  };

  const getSortValue = (doctor, key) => {
    switch(key) {
      case 'name': return doctor.name.toLowerCase();
      case 'email': return doctor.email.toLowerCase();
      case 'clinic': return doctor.clinic?.clinicName.toLowerCase() || '';
      case 'specialty': return doctor.specialty.toLowerCase();
      case 'status': return doctor.status === 'active' ? 1 : 0;
      case 'createdAt': return new Date(doctor.createdAt);
      default: return doctor[key] || '';
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSuspend = async (doctorId) => {
    if (!window.confirm('Are you sure you want to suspend this doctor?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/suspend-doctor/${doctorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Doctor suspended successfully');
      fetchDoctors();
    } catch (error) {
      console.error('Error suspending doctor:', error);
      alert('Failed to suspend doctor');
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/delete-doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Doctor deleted successfully');
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  };

  const showDoctorDetails = async (doctor) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/doctors/${doctor._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedDoctor(response.data);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      alert('Failed to fetch doctor details');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Doctor Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profileImage ? (
            <img 
              src={`http://localhost:5000${row.profileImage}`} 
              alt={row.name} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#325747] flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faUserDoctor} />
            </div>
          )}
          <span>{row.name}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email,
      sortable: true
    },
    {
      key: 'clinic',
      header: 'Clinic',
      render: (row) => row.clinic?.clinicName || 'Not assigned',
      sortable: true
    },
    {
      key: 'specialty',
      header: 'Specialty',
      render: (row) => row.specialty,
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'active' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Active</span>
            </>
          ) : row.status === 'on leave' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>On Leave</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Inactive</span>
            </>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
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
            onClick={() => showDoctorDetails(row)}
          >
            <FontAwesomeIcon icon={faEye} />
            View
          </motion.button>
          {row.status === 'active' ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
              onClick={() => handleSuspend(row._id)}
            >
              <FontAwesomeIcon icon={faBan} />
              Suspend
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
              onClick={() => handleSuspend(row._id)}
            >
              <FontAwesomeIcon icon={faCheck} />
              Activate
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => handleDelete(row._id)}
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
      <div className="p-6 space-y-6 font-laila">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#325747] to-[#233c31] text-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Doctors Management</h1>
              <p className="text-gray-300 mt-2">
                {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} registered
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
                placeholder="Search doctors..."
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
                  if (e.target.value === 'active') {
                    setFilteredDoctors(doctors.filter(d => d.status === 'active'));
                  } else if (e.target.value === 'inactive') {
                    setFilteredDoctors(doctors.filter(d => d.status !== 'active'));
                  } else {
                    setFilteredDoctors(doctors);
                  }
                }}
              >
                <option value="all">All Doctors</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive/On Leave</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setSortConfig({ key: 'createdAt', direction: 'desc' });
                setFilteredDoctors(doctors);
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
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No matching doctors found' : 'No doctors registered'}
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
                  {filteredDoctors.map((doctor) => (
                    <motion.tr 
                      key={doctor._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render(doctor)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Doctor Details Modal */}
        {isModalVisible && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Doctor Details</h2>
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Doctor Info */}
                  <div className="col-span-1">
                    <div className="flex flex-col items-center">
                      {selectedDoctor.profileImage ? (
                        <img 
                          src={`http://localhost:5000${selectedDoctor.profileImage}`} 
                          alt={selectedDoctor.name} 
                          className="w-32 h-32 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-[#E59560] flex items-center justify-center text-white text-4xl mb-4">
                          <FontAwesomeIcon icon={faUserDoctor} />
                        </div>
                      )}
                      <h3 className="text-xl font-bold">{selectedDoctor.name}</h3>
                      <p className="text-gray-500">Joined: {new Date(selectedDoctor.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEnvelope} className="text-[#325747]" />
                        <span>{selectedDoctor.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>{selectedDoctor.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUserDoctor} className="text-[#325747]" />
                        <span>Specialty: {selectedDoctor.specialty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>Gender: {selectedDoctor.gender}</span>
                      </div>
                      {selectedDoctor.birthDate && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                          <span>Birth Date: {new Date(selectedDoctor.birthDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>Status: {selectedDoctor.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clinic Info */}
                  <div className="col-span-2">
                    <div className="bg-[#F6F4E8] p-4 rounded-lg">
                      <h4 className="font-bold text-[#325747] mb-2">Clinic Information</h4>
                      {selectedDoctor.clinic ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {selectedDoctor.clinic.profileImage ? (
                              <img 
                                src={selectedDoctor.clinic.profileImage} 
                                alt={selectedDoctor.clinic.clinicName} 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#325747] flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faClinicMedical} />
                              </div>
                            )}
                            <span className="font-medium">{selectedDoctor.clinic.clinicName}</span>
                          </div>
                          <div>
                            <span className="font-medium">Owner: </span>
                            {selectedDoctor.clinic.fullName}
                          </div>
                          <div>
                            <span className="font-medium">Email: </span>
                            {selectedDoctor.clinic.email}
                          </div>
                          <div>
                            <span className="font-medium">Phone: </span>
                            {selectedDoctor.clinic.phone}
                          </div>
                          <div>
                            <span className="font-medium">Location: </span>
                            {selectedDoctor.clinic.city}{selectedDoctor.clinic.village ? `, ${selectedDoctor.clinic.village}` : ''}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Not assigned to any clinic</p>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-bold text-[#325747] mb-2">Additional Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Temporary Password: </span>
                            {selectedDoctor.temporaryPassword || 'Not set'}
                          </div>
                          <div>
                            <span className="font-medium">Account Created: </span>
                            {new Date(selectedDoctor.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
                      // Implement message functionality
                      console.log("Message doctor:", selectedDoctor.email);
                    }}
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                    Send Message
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

export default AdminDoctorsManagement;