import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faClinicMedical, faSearch, faFilter, 
  faChevronUp, faChevronDown, faEye,
  faBan, faCheck, faTrash, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';
import { motion } from 'framer-motion';

const AdminVetsManagement = () => {
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    filterAndSortClinics();
  }, [clinics, searchTerm, sortConfig]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/clinics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch doctor counts for each clinic
      const clinicsWithDoctorCounts = await Promise.all(
        response.data.map(async clinic => {
          const doctorsResponse = await axios.get(`http://localhost:5000/api/admin/doctors`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { clinicId: clinic._id }
          });
          return {
            ...clinic,
            doctorCount: doctorsResponse.data.length || 0
          };
        })
      );
      
      setClinics(clinicsWithDoctorCounts);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      alert('Failed to fetch clinics');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortClinics = () => {
    let result = [...clinics];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(clinic => 
        clinic.clinicName.toLowerCase().includes(term) ||
        clinic.fullName.toLowerCase().includes(term) ||
        clinic.email.toLowerCase().includes(term) ||
        clinic.phone.toLowerCase().includes(term) ||
        clinic.city?.toLowerCase().includes(term) ||
        clinic.village?.toLowerCase().includes(term)
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

    setFilteredClinics(result);
  };

  const getSortValue = (clinic, key) => {
    switch(key) {
      case 'name': return clinic.clinicName.toLowerCase();
      case 'owner': return clinic.fullName.toLowerCase();
      case 'email': return clinic.email.toLowerCase();
      case 'doctors': return clinic.doctorCount;
      case 'status': return clinic.isActive ? 1 : 0;
      case 'createdAt': return new Date(clinic.createdAt);
      default: return clinic[key] || '';
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSuspend = async (clinicId) => {
    if (!window.confirm('Are you sure you want to suspend this veterinary clinic?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/suspend-clinic/${clinicId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Clinic suspended successfully');
      fetchClinics();
    } catch (error) {
      console.error('Error suspending clinic:', error);
      alert('Failed to suspend clinic');
    }
  };

  const handleDelete = async (clinicId) => {
    if (!window.confirm('Are you sure you want to delete this veterinary clinic account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/delete-clinic/${clinicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Clinic deleted successfully');
      fetchClinics();
    } catch (error) {
      console.error('Error deleting clinic:', error);
      alert('Failed to delete clinic');
    }
  };

  const showClinicDetails = async (clinic) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/clinics/${clinic._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedClinic(response.data);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error fetching clinic details:', error);
      alert('Failed to fetch clinic details');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Clinic Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profileImage ? (
            <img 
              src={row.profileImage} 
              alt={row.clinicName} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#325747] flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faClinicMedical} />
            </div>
          )}
          <span>{row.clinicName}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'owner',
      header: 'Owner/Manager',
      render: (row) => row.fullName,
      sortable: true
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email,
      sortable: true
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <div className="text-sm">
          {row.city && <div>{row.city}</div>}
          {row.village && <div className="text-gray-500">{row.village}</div>}
        </div>
      ),
      sortable: false
    },
    {
      key: 'doctors',
      header: 'Doctors',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
          <span>{row.doctorCount || 0}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.isActive ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Active</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Suspended</span>
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
            onClick={() => showClinicDetails(row)}
          >
            <FontAwesomeIcon icon={faEye} />
            View
          </motion.button>
          {row.isActive ? (
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1a2e25] to-[#0f1a15] text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Veterinary Clinics Management</h1>
              <p className="text-gray-300 mt-2">
                {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''} registered
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
                placeholder="Search clinics..."
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
                    setFilteredClinics(clinics.filter(c => c.isActive));
                  } else if (e.target.value === 'inactive') {
                    setFilteredClinics(clinics.filter(c => !c.isActive));
                  } else {
                    setFilteredClinics(clinics);
                  }
                }}
              >
                <option value="all">All Clinics</option>
                <option value="active">Active Only</option>
                <option value="inactive">Suspended Only</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setSortConfig({ key: 'createdAt', direction: 'desc' });
                setFilteredClinics(clinics);
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
          ) : filteredClinics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No matching clinics found' : 'No clinics registered'}
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
                  {filteredClinics.map((clinic) => (
                    <motion.tr 
                      key={clinic._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render(clinic)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Clinic Details Modal */}
        {isModalVisible && selectedClinic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Clinic Details</h2>
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Clinic Info */}
                  <div className="col-span-1">
                    <div className="flex flex-col items-center">
                      {selectedClinic.profileImage ? (
                        <img 
                          src={selectedClinic.profileImage} 
                          alt={selectedClinic.clinicName} 
                          className="w-32 h-32 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-[#E59560] flex items-center justify-center text-white text-4xl mb-4">
                          <FontAwesomeIcon icon={faClinicMedical} />
                        </div>
                      )}
                      <h3 className="text-xl font-bold">{selectedClinic.clinicName}</h3>
                      <p className="text-gray-500">Joined: {new Date(selectedClinic.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>{selectedClinic.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEnvelope} className="text-[#325747]" />
                        <span>{selectedClinic.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>{selectedClinic.phone}</span>
                      </div>
                      {selectedClinic.city && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                          <span>{selectedClinic.city}</span>
                        </div>
                      )}
                      {selectedClinic.village && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                          <span>{selectedClinic.village}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>Status: {selectedClinic.isActive ? 'Active' : 'Suspended'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>Verified: {selectedClinic.isVerified ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Doctors Summary */}
                  <div className="col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#F6F4E8] p-4 rounded-lg">
                        <h4 className="font-bold text-[#325747] mb-2">Doctors</h4>
                        <div className="text-3xl font-bold text-[#E59560]">
                          {selectedClinic.doctors.length || 0}
                        </div>
                        <div className="mt-2">
                          {selectedClinic.doctors && selectedClinic.doctors.length > 0 ? (
                            <div className="space-y-2">
                              {selectedClinic.doctors.slice(0, 3).map(doctor => (
                                <div key={doctor._id} className="flex items-center gap-2">
                                  <span className="font-medium">{doctor.name}</span>
                                  <span className="text-sm text-gray-500">({doctor.specialty})</span>
                                </div>
                              ))}
                              {selectedClinic.doctors.length > 3 && (
                                <div className="text-sm text-gray-500">
                                  +{selectedClinic.doctors.length - 3} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No doctors registered</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-[#BACEC1] p-4 rounded-lg">
                        <h4 className="font-bold text-[#325747] mb-2">Payments</h4>
                        <div className="text-3xl font-bold text-[#325747]">
                          ${selectedClinic.payments ? 
                            (selectedClinic.payments.reduce((sum, payment) => sum + payment.amount, 0) / 100).toFixed(2) 
                            : '0.00'}
                        </div>
                        <div className="mt-2">
                          {selectedClinic.payments && selectedClinic.payments.length > 0 ? (
                            <div className="space-y-1">
                              <div className="text-sm">
                                Last payment: {new Date(selectedClinic.payments[0].createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-sm">
                                Total payments: {selectedClinic.payments.length}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No payment history</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-bold text-[#325747] mb-2">Clinic Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedClinic.temporaryCareSettings ? (
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Temporary Care: </span>
                              {selectedClinic.temporaryCareSettings.providesTemporaryCare ? 'Yes' : 'No'}
                            </div>
                            {selectedClinic.temporaryCareSettings.providesTemporaryCare && (
                              <>
                                <div>
                                  <span className="font-medium">Capacity: </span>
                                  {selectedClinic.temporaryCareSettings.maxPetsCapacity} pets
                                </div>
                                <div>
                                  <span className="font-medium">Daily Rate: </span>
                                  ${selectedClinic.temporaryCareSettings.dailyRatePerPet}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No additional clinic information available</p>
                        )}
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
                      console.log("Message clinic:", selectedClinic.email);
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

export default AdminVetsManagement;