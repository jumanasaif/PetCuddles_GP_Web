import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaPlus, FaPaw, FaHeart, FaTrash, FaInfoCircle, FaArrowLeft, FaArrowRight, FaHandHoldingHeart } from "react-icons/fa";
import PetForm from "./PetForm";
import BgImage from "../assets/bg.png";
import { useNavigate } from "react-router-dom";

const OwnerPets = () => {
  const [ownedPets, setOwnedPets] = useState([]);
  const [petsInCare, setPetsInCare] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [careIndex, setCareIndex] = useState(0);
  const petsPerPage = 4;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user"));

    const fetchPets = async () => {
      try {
        // Fetch all pets where user is owner
        const ownedResponse = await axios.get("http://localhost:5000/api/pets/user-pets", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch pets where user is temporary caretaker
        const careResponse = await axios.get("http://localhost:5000/api/pets/temporary-care", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter to get only pets where user is the owner (excluding those in care)
        const owned = ownedResponse.data.pets.filter(pet => 
          pet.owner_id._id === currentUser._id &&
          !careResponse.data.some(carePet => carePet._id === pet._id)
          
        );

        setOwnedPets(owned);
        setPetsInCare(careResponse.data);
      } catch (error) {
        console.error("Error fetching pets:", error);
      }
    };

    fetchPets();
  }, []);

  const handleNext = (type) => {
    if (type === 'owned') {
      if ((currentIndex + 1) * petsPerPage < ownedPets.length) {
        setCurrentIndex(currentIndex + 1);
      }
    } else {
      if ((careIndex + 1) * petsPerPage < petsInCare.length) {
        setCareIndex(careIndex + 1);
      }
    }
  };

  const handlePrev = (type) => {
    if (type === 'owned') {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } else {
      if (careIndex > 0) {
        setCareIndex(careIndex - 1);
      }
    }
  };

  const handleDeletePet = (petId) => {
    const token = localStorage.getItem("token");
    axios.delete(`http://localhost:5000/api/pets/${petId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setOwnedPets(ownedPets.filter(pet => pet._id !== petId));
    })
    .catch(error => {
      console.error("Error deleting pet:", error);
    });
  };

  const handlePetInfo = (petId) => {
    navigate(`/pet-profile/${petId}`);
  };

  const displayedOwnedPets = ownedPets.slice(currentIndex * petsPerPage, (currentIndex + 1) * petsPerPage);
  const displayedPetsInCare = petsInCare.slice(careIndex * petsPerPage, (careIndex + 1) * petsPerPage);

  return (
    <div className="min-h-screen bg-[#F6F4E8] flex flex-col items-center p-8" style={{ backgroundImage: `url(${BgImage})`, backgroundSize: "cover" }}>
      {/* Owned Pets Section */}
      <div className="w-full">
        {(ownedPets.length > 0 || petsInCare.length > 0) && (
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl font-extrabold text-[#325747] flex items-center gap-3 p-2 rounded-lg font-laila" style={{ marginTop: "85px",marginLeft:"550px" }}>
              <FaPaw className="text-[#E59560]" /> Your Pets <FaHeart className="text-red-500" />
            </h1>
            <p className="text-lg text-gray-700 mt-2 font-laila font-semibold">Manage, explore, and cherish every moment with your furry friends.</p>
          </motion.div>
        )}

        {ownedPets.length === 0 && petsInCare.length === 0 ? (
          <div className="flex flex-col items-center" style={{marginTop:"70px"}}>
            <p className="text-3xl text-gray-700">You don't have any pets yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 bg-[#E59560] text-white px-6 py-2 rounded-lg flex items-center">
              <FaPlus className="mr-2" /> Add a Pet
            </button>
          </div>
        ) : (
          ownedPets.length > 0 && (
            <div className="relative w-full max-w-4xl drop-shadow-[10px_13px_7px_#BACEC1] rounded-3xl mx-auto">
              {/* Prev Button */}
              {currentIndex > 0 && (
                <button className="absolute top-1/2 transform -translate-y-1/2 bg-[#BACEC1] p-2 rounded-full z-10" onClick={() => handlePrev('owned')} style={{marginLeft:"-45px"}}>
                  <FaArrowLeft size={20} />
                </button>
              )}

              {/* Displaying owned pets */}
              <div className="flex gap-6 mt-6 transition-transform ease-in-out duration-300">
                {displayedOwnedPets.map((pet) => (
                  <motion.div key={pet._id} className="w-full sm:w-1/4 bg-white p-4 flex flex-col items-center drop-shadow-lg rounded-3xl"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                    <img src={pet.img_url || "default-pet.png"} alt={pet.name} className="w-32 h-32 rounded-full object-cover" />
                    <h2 className="text-xl font-bold font-laila text-[#325747] mt-2">{pet.name}</h2>
                    <p className="text-gray-600">{pet.species} - {pet.age} years</p>
                    {pet.adoption_status === 'temporarilyAdopted' && (
                      <div className="bg-yellow-100 text-yellow-800 text-xs p-1 rounded mt-1 flex items-center">
                        <span>Temporarily adopted out</span>
                        {pet.temporaryCaretaker?.endDate && (
                          <span className="ml-2">
                            (Until {new Date(pet.temporaryCaretaker.endDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-3 mt-3">
                      <button onClick={() => handlePetInfo(pet._id)} className="text-blue-500 hover:text-blue-700">
                        <FaInfoCircle size={20} />
                      </button>
                      <button onClick={() => handleDeletePet(pet._id)} className="text-red-500 hover:text-red-700">
                        <FaTrash size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Next Button */}
              {(currentIndex + 1) * petsPerPage < ownedPets.length && (
                <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#BACEC1] p-2 rounded-full" onClick={() => handleNext('owned')} style={{marginRight:"-45px"}}>
                  <FaArrowRight size={20} />
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* Pets in Care Section */}
      {petsInCare.length > 0 && (
        <div className="w-full mt-12">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl font-extrabold text-[#325747] flex items-center gap-3 p-2 rounded-lg font-laila"style={{marginLeft:"550px"}}>
              <FaHandHoldingHeart className="text-[#E59560]" /> Pets in Your Care
            </h1>
            <p className="text-lg text-gray-700 mt-2 font-laila font-semibold">These pets have been temporarily assigned to your care</p>
          </motion.div>

          <div className="relative w-full max-w-4xl drop-shadow-[10px_13px_7px_#BACEC1] rounded-3xl mx-auto">
            {/* Prev Button */}
            {careIndex > 0 && (
              <button className="absolute top-1/2 transform -translate-y-1/2 bg-[#BACEC1] p-2 rounded-full z-10" onClick={() => handlePrev('care')} style={{marginLeft:"-45px"}}>
                <FaArrowLeft size={20} />
              </button>
            )}

            {/* Displaying pets in care */}
            <div className="flex gap-6 mt-6 transition-transform ease-in-out duration-300">
              {displayedPetsInCare.map((pet) => (
                <motion.div key={pet._id} className="w-full sm:w-1/4 bg-white p-4 flex flex-col items-center drop-shadow-lg rounded-3xl"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                  <img src={pet.img_url || "default-pet.png"} alt={pet.name} className="w-32 h-32 rounded-full object-cover" />
                  <h2 className="text-xl font-bold font-laila text-[#325747] mt-2">{pet.name}</h2>
                  <p className="text-gray-600">{pet.species} - {pet.age} years</p>
                  <p className="text-sm text-gray-500">Owner: {pet.owner_id?.fullName || 'Unknown'}</p>
                  {pet.adoption_status === 'temporarilyAdopted' && (
                    <div className="bg-blue-100 text-blue-800 text-xs p-1 rounded mt-1 flex items-center">
                      <span>Temporarily in your care</span>
                      {pet.temporaryCaretaker?.endDate && (
                        <span className="ml-2">
                          (Until {new Date(pet.temporaryCaretaker.endDate).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => handlePetInfo(pet._id)} className="text-blue-500 hover:text-blue-700">
                      <FaInfoCircle size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Next Button */}
            {(careIndex + 1) * petsPerPage < petsInCare.length && (
              <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#BACEC1] p-2 rounded-full" onClick={() => handleNext('care')} style={{marginRight:"-45px"}}>
                <FaArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {showForm && <PetForm onClose={() => setShowForm(false)} setPets={setOwnedPets} pets={ownedPets} />}
      {ownedPets.length > 0 && (
        <button onClick={() => setShowForm(true)} className="mt-4 bg-[#E59560] text-white px-6 py-2 rounded-lg flex items-center">
          <FaPlus className="mr-2" /> Add new Pet
        </button>
      )}
    </div>
  );
};

export default OwnerPets;
