import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import BgImage from "../assets/bg.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faClock, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const FoundPetsAdoptionRequestsList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState(null);
    
    const fetchRequests = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('User not authenticated');
          }
      
          const response = await axios.get(
            'http://localhost:5000/api/vet/found-pets/requests',
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          setRequests(response.data);
        } catch (err) {
          console.error('Error fetching requests:', err);
          setError(err.response?.data?.message || 'Failed to fetch requests');
        } finally {
          setLoading(false);
        }
      };
  
    useEffect(() => {
      fetchRequests();
    }, []);

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return faClock;
      case 'approved': return faCheck;
      case 'rejected': return faTimes;
      default: return faPaw;
    }
  };

  const handleQuickAction = async (requestId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/vet/found-pets/requests/${requestId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the UI by filtering out the processed request
      setRequests(prev => prev.filter(req => req._id !== requestId));
      
      alert(`Request ${action}d successfully!`);
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
    </div>
  );

  if (requests.length === 0) return (
    <div className="text-center py-8 text-lg text-gray-600">
      No adoption requests found for your clinic's found pets
    </div>
  );

  return (
    <div className="min-h-screen pt-20 p-4 md:p-8 bg-[#F6F4E8]" 
      style={{ 
        backgroundImage: `url(${BgImage})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        backgroundRepeat: "no-repeat",
        fontFamily: "'Laila', sans-serif"
      }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#325747] mb-6 flex items-center">
          <FontAwesomeIcon icon={faPaw} className="mr-3 text-[#E59560]" />
          Found Pets Adoption Requests
        </h1>
        
        {/* Filter controls */}
        <div className="flex space-x-2 mb-6">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-[#325747] text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Approved
          </button>
          <button 
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          >
            Rejected
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(request => (
            <div key={request._id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-[#E59560]">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-[#325747]">
                    {request.pet_id?.name || 'Unknown Pet'}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(request.status)}`}>
                    <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-2" />
                    {request.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600">
                    <span className="font-medium">Requester:</span> {request.requester_id?.fullName || 'Unknown'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Submitted:</span> {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-[#E59560]">Questions:</h3>
                  {request.questionsAndAnswers.slice(0, 2).map((qa, index) => (
                    <div key={index} className="mt-1">
                      <p className="text-sm text-gray-700 truncate">{qa.question}</p>
                    </div>
                  ))}
                  {request.questionsAndAnswers.length > 2 && (
                    <p className="text-sm text-gray-500 mt-1">+{request.questionsAndAnswers.length - 2} more</p>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <Link 
                    to={`/clinic/found-pets/requests/${request._id}`}
                    className="text-[#E59560] hover:underline font-medium"
                  >
                    View Details
                  </Link>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button 
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                        onClick={() => handleQuickAction(request._id, 'approve')}
                      >
                        Approve
                      </button>
                      <button 
                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                        onClick={() => handleQuickAction(request._id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FoundPetsAdoptionRequestsList;
