import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faPaw, faSearch, faFilter, 
  faChevronUp, faChevronDown, faEye,
  faBan, faCheck, faTrash, faEnvelope,faComment
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';
import { motion } from 'framer-motion';
import { useChat } from './ChatProvider';
import { toast } from "react-toastify";
import { useNavigate, NavLink, useLocation } from 'react-router-dom';

const AdminPetOwners = () => {
  const [owners, setOwners] = useState([]);
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { startChat } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPetOwners();
  }, []);

  useEffect(() => {
    filterAndSortOwners();
  }, [owners, searchTerm, sortConfig]);

  const fetchPetOwners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/pet-owners', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch pet counts for each owner
      const ownersWithPetCounts = await Promise.all(
        response.data.map(async owner => {
          const petsResponse = await axios.get(`http://localhost:5000/api/admin/owner-pets/${owner._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            ...owner,
            petCount: petsResponse.data.ownedPets,
            temporaryPetCount: petsResponse.data.temporaryPets
          };
        })
      );
      
      setOwners(ownersWithPetCounts);
    } catch (error) {
      console.error('Error fetching pet owners:', error);
      alert('Failed to fetch pet owners');
    } finally {
      setLoading(false);
    }
  };

   const handleStartChat = async (ownerId) => {
    try {
      await startChat(ownerId, 'User');
      navigate('/chat');
      toast.success('Chat started with owner');
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const filterAndSortOwners = () => {
    let result = [...owners];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(owner => 
        owner.fullName.toLowerCase().includes(term) ||
        owner.email.toLowerCase().includes(term) ||
        owner.phone.toLowerCase().includes(term) ||
        owner.city?.toLowerCase().includes(term) ||
        owner.village?.toLowerCase().includes(term)
   ) }

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

    setFilteredOwners(result);
  };

  const getSortValue = (owner, key) => {
    switch(key) {
      case 'name': return owner.fullName.toLowerCase();
      case 'email': return owner.email.toLowerCase();
      case 'pets': return owner.petCount;
      case 'temporaryPets': return owner.temporaryPetCount;
       case 'createdAt': 
      const date = new Date(owner.createdAt);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    default: return owner[key] || '';
  }
};

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSuspend = async (ownerId) => {
    if (!window.confirm('Are you sure you want to suspend this pet owner?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/suspend-owner/${ownerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pet owner suspended successfully');
      fetchPetOwners();
    } catch (error) {
      console.error('Error suspending owner:', error);
      alert('Failed to suspend pet owner');
    }
  };

  const handleDelete = async (ownerId) => {
    if (!window.confirm('Are you sure you want to delete this pet owner account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/delete-owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pet owner deleted successfully');
      fetchPetOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
      alert('Failed to delete pet owner');
    }
  };

  const showOwnerDetails = (owner) => {
    setSelectedOwner(owner);
    setIsModalVisible(true);
  };

  const columns = [
    {
      key: 'name',
      header: 'Owner Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profileImage ? (
            <img 
              src={row.profileImage} 
              alt={row.fullName} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center text-white">
              <FontAwesomeIcon icon={faUser} />
            </div>
          )}
          <span>{row.fullName}</span>
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
      key: 'pets',
      header: 'Owned Pets',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faPaw} className="text-[#325747]" />
          <span>{row.petCount || 0}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'temporaryPets',
      header: 'Temporary Pets',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faPaw} className="text-[#E59560]" />
          <span>{row.temporaryPetCount || 0}</span>
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
            onClick={() => showOwnerDetails(row)}
          >
            <FontAwesomeIcon icon={faEye} />
            View
          </motion.button>
           <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#E59560] text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => handleStartChat(row._id)}
          >
            <FontAwesomeIcon icon={faComment} />
            Chat
          </motion.button>
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
              <h1 className="text-2xl md:text-3xl font-bold">Pet Owners Management</h1>
              <p className="text-gray-300 mt-2">
                {filteredOwners.length} pet owner{filteredOwners.length !== 1 ? 's' : ''} registered
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
                placeholder="Search owners..."
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
                  if (e.target.value === 'withPets') {
                    setFilteredOwners(owners.filter(o => o.petCount > 0));
                  } else if (e.target.value === 'withTemporaryPets') {
                    setFilteredOwners(owners.filter(o => o.temporaryPetCount > 0));
                  } else {
                    setFilteredOwners(owners);
                  }
                }}
              >
                <option value="all">All Owners</option>
                <option value="withPets">With Owned Pets</option>
                <option value="withTemporaryPets">With Temporary Pets</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setSortConfig({ key: 'createdAt', direction: 'desc' });
                setFilteredOwners(owners);
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
          ) : filteredOwners.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No matching pet owners found' : 'No pet owners registered'}
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
                  {filteredOwners.map((owner) => (
                    <motion.tr 
                      key={owner._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render(owner)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Owner Details Modal */}
        {isModalVisible && selectedOwner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Owner Details</h2>
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Owner Info */}
                  <div className="col-span-1">
                    <div className="flex flex-col items-center">
                      {selectedOwner.profileImage ? (
                        <img 
                          src={selectedOwner.profileImage} 
                          alt={selectedOwner.fullName} 
                          className="w-32 h-32 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-[#E59560] flex items-center justify-center text-white text-4xl mb-4">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                      )}
                      <h3 className="text-xl font-bold">{selectedOwner.fullName}</h3>
                      <p className="text-gray-500">Joined: {new Date(selectedOwner.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEnvelope} className="text-[#325747]" />
                        <span>{selectedOwner.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>{selectedOwner.phone}</span>
                      </div>
                      {selectedOwner.city && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                          <span>{selectedOwner.city}</span>
                        </div>
                      )}
                      {selectedOwner.village && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                          <span>{selectedOwner.village}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pets Summary */}
                  <div className="col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#F6F4E8] p-4 rounded-lg">
                        <h4 className="font-bold text-[#325747] mb-2">Owned Pets</h4>
                        <div className="text-3xl font-bold text-[#E59560]">
                          {selectedOwner.petCount || 0}
                        </div>
                        <div className="mt-2">
                          {selectedOwner.petCount > 0 ? (
                            <button 
                              className="text-sm text-[#325747] hover:underline"
                              onClick={() => {
                                // Navigate to pets list filtered by this owner
                                console.log("View owned pets for:", selectedOwner._id);
                              }}
                            >
                              View all owned pets →
                            </button>
                          ) : (
                            <p className="text-sm text-gray-500">No owned pets</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-[#BACEC1] p-4 rounded-lg">
                        <h4 className="font-bold text-[#325747] mb-2">Temporary Pets</h4>
                        <div className="text-3xl font-bold text-[#325747]">
                          {selectedOwner.temporaryPetCount || 0}
                        </div>
                        <div className="mt-2">
                          {selectedOwner.temporaryPetCount > 0 ? (
                            <button 
                              className="text-sm text-[#325747] hover:underline"
                              onClick={() => {
                                // Navigate to temporary pets list for this owner
                                console.log("View temporary pets for:", selectedOwner._id);
                              }}
                            >
                              View temporary pets →
                            </button>
                          ) : (
                            <p className="text-sm text-gray-500">No temporary pets</p>
                          )}
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
                    onClick={() => handleStartChat(selectedOwner._id)}
                 >
                <FontAwesomeIcon icon={faComment} />
                  Start Chat
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

export default AdminPetOwners;