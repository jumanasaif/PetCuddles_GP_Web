import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import BgImage from "../assets/bg.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocketchat } from "@fortawesome/free-brands-svg-icons";
import { faPhone } from "@fortawesome/free-solid-svg-icons";

const AdoptionRequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/pets/adoption/requests/${requestId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Ensure questionsAndAnswers exists and is an array
        setRequest(response.data);
        
      } catch (error) {
        console.error('Error fetching request:', error);
        navigate('/adoption/requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, navigate]);

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to be logged in');
        return;
      }
  
      const endpoint = request.adoption_type === 'temporary' 
        ? 'approve-temporary' 
        : 'approve';
  
      const response = await axios.patch(
        `http://localhost:5000/api/adoption/requests/${requestId}/${endpoint}`,
        { requesterID: request?.requester_id?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      alert(response.data.message || 'Adoption approved successfully!');
      navigate('/adoption/requests');
      
      if (window.updateNotifications) {
        window.updateNotifications();
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert(error.response?.data?.message || 'Failed to approve adoption');
    }
  };
  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to be logged in');
        return;
      }
  
      const response = await axios.patch(
        `http://localhost:5000/api/adoption/requests/${requestId}/reject`,
        { requesterID: request?.requester_id?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      alert('Adoption request rejected successfully!');
      navigate('/adoption/requests');
      
      // Force refresh notifications (optional)
      if (window.updateNotifications) {
        window.updateNotifications();
      }
  
    } catch (error) {
      console.error('Rejection error:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'Failed to reject adoption request');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!request) return <div className="text-center py-8">Request not found</div>;

  return (
    <div className="container flex flex-col min-h-screen w-full p-9" style={{ 
      backgroundColor: "#F6F4E8", 
      backgroundImage: `url(${BgImage})`, 
      backgroundSize: "cover", 
      backgroundPosition: "center", 
      backgroundRepeat: "no-repeat" 
    }}>
      <button 
        onClick={() => navigate('/adoption/requests')}
        className="mb-4 flex items-center text-[#E59560] hover:underline font-bold font-laila"
        style={{marginTop:"80px"}}
      >
        ← Back to all requests
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-[#E59560] p-6 font-laila">
        <h1 className="text-2xl font-bold text-[#325747] mb-4">
          Adoption Request for {request.pet_id?.name || 'Unknown Pet'}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#E59560] mb-2">Requester Information</h2>
                <div className="flex items-start space-x-4">
                  <img
                    src={request.requester_id?.profileImage || "/assets/default-profile.png"}
                    alt={request.requester_id?.fullName}
                    className="rounded-full border-2 border-[#E59560]"
                    style={{ width: "80px", height: "80px", objectFit: "cover" }}
                  />
                  <div className="space-y-2">
                    <p className="text-lg text-[#325747]">
                      <span className="font-semibold">Name:</span> {request.requester_id?.fullName || 'Unknown User'}
                    </p>
                    <p className="text-lg text-[#325747]">
                      <span className="font-semibold">Phone:</span> {request.requester_id?.phone || 'Not provided'}
                    </p>
                    <p className="text-lg text-[#325747]">
                      <span className="font-semibold">Location:</span> {`${request.requester_id?.city || ''}${request.requester_id?.city && request.requester_id?.village ? ', ' : ''}${request.requester_id?.village || ''}`}
                    </p>
                    <div className="flex space-x-3">
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Call requester">
                        <FontAwesomeIcon icon={faPhone} className="text-[#325747] text-xl" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Chat with requester">
                        <FontAwesomeIcon icon={faRocketchat} className="text-[#325747] text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-[#E59560] mb-2">Questions & Answers</h2>
          {request.questionsAndAnswers && request.questionsAndAnswers.length > 0 ? (
            request.questionsAndAnswers.map((qa, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-[#325747]">{qa.question}</p>
                <p className="text-gray-700 mt-1">{qa.answer}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No questions and answers provided</p>
          )}
        </div>

        
        
        <div className="mt-6 flex justify-end space-x-4">
          <button 
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors" 
            onClick={handleReject}
          >
            Reject
          </button>
          <button 
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors" 
            onClick={handleApprove}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdoptionRequestDetails;