import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPaw, FaCheck, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import BgImage from "../assets/bg.png";

const ExtensionResponsePage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/pets/extensions/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setRequest(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load extension request');
        console.error('Error fetching request:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, navigate]);

  const handleResponse = async (response) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `http://localhost:5000/api/pets/extensions/respond/${requestId}`,
        { response },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      navigate('/notifications', { state: { message: `Extension request ${response === 'approve' ? 'approved' : 'rejected'}` } });
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
      <p className="font-bold">Error</p>
      <p>{error}</p>
      <button 
        onClick={() => navigate(-1)} 
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Go Back
      </button>
    </div>
  );
  
  if (!request) return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
      <p className="font-bold">Not Found</p>
      <p>Extension request not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F4E8] py-8 px-4"  style={{ backgroundImage: `url(${BgImage})`, backgroundSize: "cover" }}>
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden"style={{marginTop:"150px"}}>
        <div className="bg-gradient-to-r from-[#E59560] to-green-800 p-6 text-white flex flex-col items-center">
          <div className="flex items-center space-x-3">
            <FaPaw className="text-2xl" />
            <h1 className="text-2xl font-bold font-laila" >Extension Request</h1>
            <FaPaw className="text-2xl" />
          </div>
          <p className="mt-2 opacity-90 text-xl font-laila" >For {request.pet_id.name}</p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <FaCalendarAlt className="mr-2 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-700">Current Care Period</h3>
            </div>
            <div className="pl-8">
              <p className="text-gray-600">
                {new Date(request.currentStartDate).toLocaleDateString()} - {new Date(request.currentEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-3">
              <FaCalendarAlt className="mr-2 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-700">Requested Extension</h3>
            </div>
            <div className="pl-8">
              <p className="text-gray-600">
                Until {new Date(request.requestedEndDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Requested on {new Date(request.requestedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Do you accept this extension?</h3>
            
            <div className="flex space-x-4">
              <button
                onClick={() => handleResponse('approve')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50"
              >
                <FaCheck className="mr-2" />
                {submitting ? 'Processing...' : 'Accept'}
              </button>
              
              <button
                onClick={() => handleResponse('reject')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50"
              >
                <FaTimes className="mr-2" />
                {submitting ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionResponsePage;
