import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPaw, FaCalendarAlt, FaUserCheck, FaPaperPlane } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import BgImage from "../assets/bg.png";

const AdoptionExtensionPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEndDate, setNewEndDate] = useState(null);
  const [keepCaretaker, setKeepCaretaker] = useState(true);
  const [currentEndDate, setCurrentEndDate] = useState(null);

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/pets/id/${petId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPet(response.data);
        
        // Set dates
        if (response.data.temporaryCaretaker?.endDate) {
          const endDate = new Date(response.data.temporaryCaretaker.endDate);
          setCurrentEndDate(endDate);
          
          // Default extension: current end date + 7 days
          const extendedDate = new Date(endDate);
          extendedDate.setDate(extendedDate.getDate() + 7);
          setNewEndDate(extendedDate);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load pet data');
        console.error('Error fetching pet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPetData();
  }, [petId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to perform this action');
        return;
      }
    
      // Ensure the date is in the correct format
      const formattedDate = new Date(newEndDate);
      formattedDate.setHours(23, 59, 59, 999); // Set to end of day
  
      const response = await axios.post(
        `http://localhost:5000/api/pets/${petId}/extend-adoption`,
        { 
          newEndDate: formattedDate.toISOString(),
          keepCaretaker: keepCaretaker ? 'yes' : 'no'
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      alert(response.data.message);
      
      if (response.data.status === 'available') {
        navigate('/pets');
        toast.success(response.data.message); // 🔔 Shows toast in browser

      } else {
        navigate('/my-pets');
      }
      if (window.updateNotifications) {
        window.updateNotifications();
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Failed to extend adoption');
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
  
  if (!pet) return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
      <p className="font-bold">Not Found</p>
      <p>Pet not found</p>
    </div>
  );

  

  return (
 <div className="min-h-screen bg-[#F6F4E8] py-8 px-4"  style={{ backgroundImage: `url(${BgImage})`, backgroundSize: "cover" }}>
       <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden" style={{marginTop:"150px"}}>
        <div className="bg-gradient-to-r from-[#E59560] to-green-800 p-6 text-white flex flex-col items-center">
          <div className="flex items-center space-x-3">
            <FaPaw className="text-2xl" />
            <h1 className="text-2xl font-bold font-laila">Extend Adoption for {pet.name}</h1>
            <FaPaw className="text-2xl" />
          </div>
          {currentEndDate && (
            <p className="mt-2 opacity-90 text-xl">
              Current period ends: {currentEndDate.toLocaleDateString()}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2 flex items-center">
              <FaCalendarAlt className="mr-2" />
              New End Date
            </label>
            <DatePicker
              selected={newEndDate}
              onChange={date => setNewEndDate(date)}
              minDate={currentEndDate ? new Date(currentEndDate.getTime() + 86400000) : new Date()} // +1 day
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              dateFormat="MMMM d, yyyy"
              popperPlacement="bottom-start"
            />
            <p className="mt-1 text-sm text-gray-500">
              Must be after current end date
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2 flex items-center">
              <FaUserCheck className="mr-2" />
              Caretaker Options
            </label>
            <div className="flex flex-col space-y-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600"
                  name="caretakerOption"
                  checked={keepCaretaker}
                  onChange={() => setKeepCaretaker(true)}
                />
                <span className="ml-2">Keep current caretaker (request extension)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600"
                  name="caretakerOption"
                  checked={!keepCaretaker}
                  onChange={() => setKeepCaretaker(false)}
                />
                <span className="ml-2">Find new caretaker (end current adoption)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#E59560] to-[#F4856E] p-6  flex flex-col items-center text-white font-medium rounded-lg "
          >
            <FaPaperPlane className="mr-2" />
            {keepCaretaker ? 'Request Extension' : 'End Current Adoption'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdoptionExtensionPage;
