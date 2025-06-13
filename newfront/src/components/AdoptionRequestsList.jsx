// components/AdoptionRequestsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiCalendar, FiChevronUp, FiChevronDown, FiInbox, FiUser, FiHeart } from 'react-icons/fi';
import BgImage from "../assets/bg.png";

const AdoptionRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateSort, setDateSort] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/pets/adoption/requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(response.data);
        setFilteredRequests(response.data);
      } catch (error) {
        console.error('Error fetching adoption requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    let result = [...requests];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(req => req.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(req => 
        (req.pet_id?.name?.toLowerCase().includes(term)) || 
        (req.requester_id?.fullName?.toLowerCase().includes(term))
      );
    }
    
    // Apply date sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredRequests(result);
  }, [statusFilter, dateSort, searchTerm, requests]);

  const toggleDateSort = () => {
    setDateSort(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-pulse text-xl text-[#325747]">Loading requests...</div>
    </div>
  );

  return (
    <div 
      className="min-h-screen w-full p-4 md:p-8 font-laila" 
      style={{ 
        backgroundColor: "#F6F4E8", 
        backgroundImage: `url(${BgImage})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        backgroundRepeat: "no-repeat",
        backgroundAttachment: 'fixed'
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto pt-24"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                   <div>
                     <h1 className="text-2xl md:text-3xl font-bold text-[#325747] flex items-center">
                       <motion.div
                         animate={{ y: [0, -5, 0] }}
                         transition={{ repeat: Infinity, duration: 2 }}
                         className="mr-3"
                       >
                         <FiInbox  className="text-[#325747] " />
                       </motion.div>
                       Your Adoption Requests
                     </h1>
                     <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
                   </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search pets or requesters..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E59560] focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiUser className="absolute left-3 top-3 text-[#E59560]" />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <select
                  className="appearance-none pl-10 pr-8 py-2 rounded-lg border border-[#E59560] bg-white focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <FiFilter className="absolute left-3 top-3 text-[#E59560]" />
              </div>
              
              <button 
                onClick={toggleDateSort}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#E59560] bg-white hover:bg-[#F6F4E8] transition-colors"
              >
                <FiCalendar className="text-[#E59560]" />
                {dateSort === 'desc' ? <FiChevronDown /> : <FiChevronUp />}
              </button>
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm border border-[#E59560]/30"
          >
            <FiInbox size={48} className="mx-auto text-[#E59560]/50 mb-4" />
            <p className="text-xl text-[#325747]/70">No adoption requests found</p>
            {statusFilter !== 'all' || searchTerm ? (
              <button 
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="mt-4 text-[#E59560] hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRequests.map(request => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E59560]/30 hover:shadow-md transition-all"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-semibold text-[#325747] line-clamp-1">
                        {request.pet_id?.name || 'Unknown Pet'}
                      </h2>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FiCalendar size={12} />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <FiUser className="text-[#E59560]" />
                      <p className="text-gray-600 line-clamp-1">
                        {request.requester_id?.fullName || 'Unknown User'}
                      </p>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-medium text-[#E59560] flex items-center gap-2 mb-2">
                        <FiHeart /> Questions:
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {request.questionsAndAnswers.map((qa, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium text-[#325747]">{qa.question}</p>
                            <p className="text-gray-700">{qa.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-[#E59560]/20">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                      <Link 
                        to={`/adoption/requests/${request._id}`}
                        className="text-sm text-[#E59560] hover:text-[#325747] font-medium transition-colors flex items-center gap-1"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdoptionRequestsList;