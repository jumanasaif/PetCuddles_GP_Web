import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';

const CaretakerPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/pets/temporary-care", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Update this line - use response.data directly
        setPets(response.data || []);
      } catch (err) {
        console.error("Error fetching temporary pets:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  if (loading) return <div className="text-center py-8">Loading pets...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-8">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-[#E59560] hover:underline"
      >
        <FaArrowLeft className="mr-2" />
        Back to My Pets
      </button>

      <h1 className="text-3xl font-bold text-[#325747] mb-6">Pets in Your Temporary Care</h1>
      
      {pets.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p>No pets currently in your care.</p>
          <p className="text-sm mt-2">
            If you expected to see pets here, please verify:
            <ul className="list-disc pl-5 mt-1">
              <li>The adoption was approved</li>
              <li>The care period hasn't ended</li>
              <li>You're logged into the correct account</li>
            </ul>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map(pet => (
            <div key={pet._id} className="bg-white p-4 rounded-lg shadow">
              <img 
                src={pet.img_url || "/default-pet.png"} 
                alt={pet.name} 
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <h2 className="text-xl font-bold mt-2">{pet.name}</h2>
              <p className="text-gray-600">Owner: {pet.owner_id?.name || 'Unknown'}</p>
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="font-semibold">Care Period:</p>
                <p>{new Date(pet.temporaryCaretaker.startDate).toLocaleDateString()} to</p>
                <p>{new Date(pet.temporaryCaretaker.endDate).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => navigate(`/pet-profile/${pet._id}`)}
                className="mt-3 w-full bg-[#E59560] hover:bg-[#d87d45] text-white py-2 rounded transition-colors"
              >
                View Care Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaretakerPets;
