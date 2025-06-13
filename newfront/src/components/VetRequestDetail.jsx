import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, faCheckCircle, faTimesCircle, 
  faArrowLeft, faTrashAlt, faPaperPlane,
  faCalendarAlt, faMoneyBillWave, faNotesMedical
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const VetRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [action, setAction] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/vet-temporary-care/requests/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequest(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading request');
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handleResponse = async (status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/vet-temporary-care/vet/requests/${requestId}/respond`,
        { 
          status,
          responseMessage: responseMessage || `Request ${status} without comment`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRequest(response.data.request);
      setAction(null);
      setResponseMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error responding to request');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/vet-temporary-care/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate('/vet/temporary-care/requests', { 
        state: { message: 'Request deleted successfully' } 
      });
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
      default: return null;
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

  if (!request) {
    return (
      <div className="text-center py-8 text-gray-500">
        Request not found
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 p-4 md:p-8 bg-[#F6F4E8]" style={{ fontFamily: "'Laila', sans-serif", marginTop: "80px" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-[#325747] hover:text-[#E59560]"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Requests
          </button>
          
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
              <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-1" />
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
            
            {request.status === 'pending' && (
              <button
                onClick={() => handleDelete()}
                className="text-red-600 hover:text-red-800"
                title="Delete request"
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Pet and Owner Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <img 
                  className="h-32 w-32 rounded-full object-cover border-4 border-[#F6F4E8]" 
                  src={request.petId.img_url || '/default-pet.png'} 
                  alt={request.petId.name}
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#325747] mb-2">
                  {request.petId.name}
                  <span className="ml-2 text-lg font-normal text-gray-600">
                    ({request.petId.species}, {request.petId.breed})
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Owner Information</h3>
                    <p className="text-lg font-medium">{request.ownerId.fullName}</p>
                    <p className="text-gray-600">{request.ownerId.phone}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Care Period</h3>
                    <p className="text-lg font-medium">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#E59560]" />
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      {Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-[#325747] mb-3 flex items-center">
                  <FontAwesomeIcon icon={faNotesMedical} className="mr-2 text-[#E59560]" />
                  Care Details
                </h3>
                
                <div className="space-y-2">
                  <p><span className="font-medium">Reason:</span> {request.reason}</p>
                  
                  {request.specialRequirements.length > 0 && (
                    <div>
                      <p className="font-medium">Special Requirements:</p>
                      <ul className="list-disc pl-5">
                        {request.specialRequirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {request.ownerNotes && (
                    <div>
                      <p className="font-medium">Owner Notes:</p>
                      <p className="bg-gray-50 p-3 rounded">{request.ownerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#325747] mb-3 flex items-center">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-[#E59560]" />
                  Financial Details
                </h3>
                
                <div className="space-y-2">
                  <p><span className="font-medium">Daily Rate:</span> ${request.dailyRate}</p>
                  <p><span className="font-medium">Total Cost:</span> ${request.totalCost}</p>
                  <p><span className="font-medium">Request Date:</span> {new Date(request.createdAt).toLocaleString()}</p>
                  
                  {request.vetResponse && (
                    <div className="mt-4">
                      <p className="font-medium">Your Response:</p>
                      <p className="bg-gray-50 p-3 rounded">{request.vetResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Response Section (for pending requests) */}
            {request.status === 'pending' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 p-6 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-[#325747] mb-4">
                  Respond to Request
                </h3>
                
                {action ? (
                  <div className="space-y-4">
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md focus:border-[#E59560]"
                      rows="4"
                      placeholder={`Enter your ${action} message (optional)`}
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                    />
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setAction(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleResponse(action)}
                        className={`px-4 py-2 rounded-md text-white ${
                          action === 'approved' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                        Confirm {action}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => setAction('approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => setAction('rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                    >
                      <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                      Reject Request
                    </button>
                  </div>
                )}
              </motion.div>
            )}
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

export default VetRequestDetail;
