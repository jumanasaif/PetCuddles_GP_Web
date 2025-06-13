import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostAdoptionOptions = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/post-adoption/${petId}/options`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPet(response.data.pet);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load pet options');
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [petId]);

  const handleOptionSelect = (optionId) => {
    setSelectedOption(optionId);
    
    switch(optionId) {
      case 'readopt':
        navigate(`/pet-profile/${petId}`);
        break;
      case 'vet':
        navigate(`/vet-temporary-care/request?petId=${petId}`);
        break;
      case 'keep':
        navigate('/home');
        break;
      default:
        break;
    }
  };

  if (loading) return <div>Loading options...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!pet) return <div>Pet not found</div>;

  return (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 font-laila">
    {/* Modal content container */}
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-6 text-[#E59560] text-center">
        What would you like to do with {pet.name} now?
      </h2>

      <div className="space-y-4">
        {[
          {
            id: 'readopt',
            title: 'Put up for adoption again',
            description: 'List your pet for adoption (temporary or permanent)'
          },
          {
            id: 'vet',
            title: 'Find a vet for temporary care',
            description: 'Locate veterinary clinics that provide boarding services'
          },
          {
            id: 'keep',
            title: 'Keep pet with you',
            description: 'End the adoption process and keep your pet'
          }
        ].map(option => (
          <div 
            key={option.id}
            onClick={() => handleOptionSelect(option.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedOption === option.id ? 'border-[#325747] bg-[#e6f0ed]' : 'hover:bg-gray-100'
            }`}
          >
            <h3 className="font-bold text-lg text-[#325747]">{option.title}</h3>
            <p className="text-gray-600">{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

};

export default PostAdoptionOptions;
