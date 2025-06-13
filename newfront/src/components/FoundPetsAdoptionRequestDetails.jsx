import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BgImage from "../assets/bg.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPaw, faClock, faCheck, faTimes, 
  faPhone, faEnvelope, faMapMarkerAlt,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";

const FoundPetsAdoptionRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/vet/found-pets/requests/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setRequest(response.data);
      } catch (error) {
        console.error('Error fetching request:', error);
        navigate('/vet/found-pets/requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, navigate]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/vet/found-pets/requests/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh the request data
      const response = await axios.get(
        `http://localhost:5000/api/vet/found-pets/requests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequest(response.data);
      
      alert(`Request ${action}d successfully!`);
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
    </div>
  );

  if (!request) return (
    <div className="text-center py-8 text-lg text-gray-600">
      Request not found
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
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/vet/found-pets/requests')}
          className="flex items-center text-[#325747] hover:text-[#E59560] mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to all requests
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-[#E59560]">
          {/* Header with status */}
          <div className={`p-4 ${request.status === 'pending' ? 'bg-yellow-100' : 
                          request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#325747]">
                Adoption Request for {request.pet_id?.name || 'Unknown Pet'}
              </h1>
              <span className={`px-3 py-1 rounded-full font-medium flex items-center ${
                request.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                request.status === 'approved' ? 'bg-green-200 text-green-800' :
                'bg-red-200 text-red-800'
              }`}>
                <FontAwesomeIcon 
                  icon={request.status === 'pending' ? faClock : 
                       request.status === 'approved' ? faCheck : faTimes} 
                  className="mr-2" 
                />
                {request.status}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Pet Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#E59560] mb-3 border-b pb-2">
                Pet Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-700"><span className="font-medium">Name:</span> {request.pet_id?.name}</p>
                  <p className="text-gray-700"><span className="font-medium">Breed:</span> {request.pet_id?.breed}</p>
                  <p className="text-gray-700"><span className="font-medium">Age:</span> {request.pet_id?.estimatedAge}</p>
                </div>
                <div>
                  <p className="text-gray-700"><span className="font-medium">Status:</span> {request.pet_id?.adoptionStatus}</p>
                  <p className="text-gray-700"><span className="font-medium">Found Date:</span> {new Date(request.pet_id?.foundDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Requester Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#E59560] mb-3 border-b pb-2">
                Requester Details
              </h2>
              <div className="flex items-start space-x-6">
                <img
                  src={request.requester_id?.profileImage || "/assets/default-profile.png"}
                  alt={request.requester_id?.fullName}
                  className="rounded-full border-2 border-[#E59560]"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-gray-700"><span className="font-medium">Name:</span> {request.requester_id?.fullName}</p>
                    <p className="text-gray-700"><span className="font-medium">Email:</span> {request.requester_id?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-700"><span className="font-medium">Phone:</span> {request.requester_id?.phone}</p>
                    <p className="text-gray-700">
                      <span className="font-medium">Location:</span> {request.requester_id?.city}, {request.requester_id?.village}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4 mt-4">
                <a 
                  href={`tel:${request.requester_id?.phone}`}
                  className="flex items-center text-[#325747] hover:text-[#E59560]"
                >
                  <FontAwesomeIcon icon={faPhone} className="mr-2" />
                  Call Requester
                </a>
                <a 
                  href={`mailto:${request.requester_id?.email}`}
                  className="flex items-center text-[#325747] hover:text-[#E59560]"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  Email Requester
                </a>
              </div>
            </div>

            {/* Questions & Answers */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#E59560] mb-3 border-b pb-2">
                Adoption Questions
              </h2>
              <div className="space-y-4">
                {request.questionsAndAnswers.map((qa, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-[#325747]">{qa.question}</p>
                    <p className="text-gray-700 mt-2 pl-4 border-l-2 border-[#E59560]">{qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {request.status === 'pending' && (
              <div className="flex justify-end space-x-4 mt-6">
                <button 
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded-lg flex items-center ${
                    actionLoading ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  {actionLoading ? 'Processing...' : (
                    <>
                      <FontAwesomeIcon icon={faTimes} className="mr-2" />
                      Reject Request
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded-lg flex items-center ${
                    actionLoading ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  {actionLoading ? 'Processing...' : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Approve Request
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundPetsAdoptionRequestDetails;