import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";



const speciesOptions = [
  { name: "Dog", value: "dog", icon: "🐶" },
  { name: "Cat", value: "cat", icon: "🐱" },
  { name: "Bird", value: "bird", icon: "🐦" },
  { name: "Sheep", value: "sheep", icon: "🐑" },
  { name: "Cow", value: "cow", icon: "🐄" },
  { name: "Rabbit", value: "rabbit", icon: "🐰" },
];

const PetForm = ({ onClose, onPetAdded }) => {
  const [petData, setPetData] = useState({
    name: "",
    species: "dog",
    breed: "",
    birth_date: "",
    age: "",
    weight: "",
    gender: "male",
    health_status: "",
    img_url: "",
  });

  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Reset breeds when species changes
    setBreeds([]);
    setSearchTerm("");

    if (petData.species === "dog") {
      fetchDogBreeds();
    } else if (petData.species === "cat") {
      fetchCatBreeds();
    } else if (petData.species === "rabbit") {
      fetchRabbitBreeds();
    }
    else if (petData.species === "sheep") {
      fetchSheepBreeds();
    }
    else if (petData.species === "cow") {
      fetchCowBreeds();
    }
  }, [petData.species]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (petData.birth_date) {
      setPetData((prevData) => ({
        ...prevData,
        age: calculateAge(petData.birth_date),
      }));
    }
  }, [petData.birth_date]);

  const fetchRabbitBreeds = async () => {
    try {
      setLoadingBreeds(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/pets/rabbit-breeds", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const breeds = response.data.map((breed) => ({
        breed: breed.breed,
        image: `/assets/${breed.image}`, // Directly reference from public folder
      }));
  
      setBreeds(breeds);
    } catch (error) {                                                    
      console.error("Error fetching rabbit breeds:", error);
    } finally {
      setLoadingBreeds(false);
    }
  };
  
  const fetchSheepBreeds = async () => {
    try {
      setLoadingBreeds(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/pets/sheep-breeds", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const breeds = response.data.map((breed) => ({
        breed: breed.breed,
        image: `/assets/${breed.image}`, 
      }));
  
      setBreeds(breeds);
    } catch (error) {                                                    
      console.error("Error fetching sheep breeds:", error);
    } finally {
      setLoadingBreeds(false);
    }
  };

  const fetchCowBreeds = async () => {
    try {
      setLoadingBreeds(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/pets/cow-breeds", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const breeds = response.data.map((breed) => ({
        breed: breed.breed,
        image: `/assets/${breed.image}`, 
      }));
  
      setBreeds(breeds);
    } catch (error) {                                                    
      console.error("Error fetching cow breeds:", error);
    } finally {
      setLoadingBreeds(false);
    }
  };

  const fetchCatBreeds = async () => {
    try {
      setLoadingBreeds(true);
      const response = await fetch("https://api.thecatapi.com/v1/breeds");
      const data = await response.json();
      console.log(data); // Log the data to verify the structure

      const breedsWithImages = await Promise.all(
        data.map(async (breed) => {
          try {
            const imageResponse = await fetch(`https://api.thecatapi.com/v1/images/search?breed_id=${breed.id}`);
            const imageData = await imageResponse.json();
            const imageUrl = imageData.length > 0 ? imageData[0].url : "../assets/cat1.jpg";
            return { breed: breed.name, image: imageUrl };
          } catch {
            return { breed: breed.name, image: "../assets/cat1.jpg" };
          }
        })
      );

      setBreeds(breedsWithImages);
    } catch (error) {
      console.error("Error fetching cat breeds:", error);
    } finally {
      setLoadingBreeds(false);
    }
  };

  const fetchDogBreeds = async () => {
    try {
      setLoadingBreeds(true);
      const response = await fetch("https://dog.ceo/api/breeds/list/all");
      const data = await response.json();
      const breedsList = Object.keys(data.message);

      const breedsWithImages = await Promise.all(
        breedsList.map(async (breed) => {
          try {
            const imageResponse = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
            const imageData = await imageResponse.json();
            return { breed, image: imageData.message };
          } catch {
            return { breed, image: "" };
          }
        })
      );

      setBreeds(breedsWithImages);
    } catch (error) {
      console.error("Error fetching dog breeds:", error);
    } finally {
      setLoadingBreeds(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPetData({ ...petData, [name]: value });
  };

  const handleSpeciesSelect = (e) => {
    setPetData({ ...petData, species: e.target.value, breed: "" });
  };

  const handleBreedSelect = (breed) => {
    setPetData({ ...petData, breed });
    setSearchTerm(breed);
    setShowDropdown(false);
  };

  const filteredBreeds = breeds.filter(({ breed }) =>
    breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setPetData((prev) => ({ ...prev, img_url: reader.result }));
    };
  };

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (petData.birth_date) {
      petData.age = calculateAge(petData.birth_date);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/pets", petData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (response.data.success) {
        alert("Pet added successfully!");
        onPetAdded();
        onClose();
      }
    } catch (error) {
      console.error("Error adding pet:", error);
    }
  };

  const calculateAge = (birthDate) => {
    const birth = new Date(birthDate);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-3 rounded-xl shadow-lg drop-shadow-[0px_3px_5px_#E59560] overflow-y-auto" style={{ width: "480px",height:"600px" }} >
       
        <h2 className="text-2xl font-bold font-laila text-[#325747] mb-2 pb-3" style={{ marginLeft: "130px" }}>Add a New Pet !</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Pet Image:</label>
          <input type="file" onChange={handleImageUpload} className="pb-4" />
          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Pet Name:</label>
          <input
            type="text"
            name="name"
            value={petData.name}
            onChange={handleChange}
            required
            className="border p-2 rounded w-full mb-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
          />

          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Species:</label>
          <select
            name="species"
            value={petData.species}
            onChange={handleSpeciesSelect}
            className="border p-2 rounded w-full mb-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
          >
            {speciesOptions.map(({ name, value, icon }) => (
              <option key={value} value={value}>
                {icon} {name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-[#325747]">Breed:</label>
          {(petData.species === "dog" || petData.species === "cat" || petData.species === "rabbit" || petData.species === "sheep" || petData.species === "cow") && (
            <div className="relative mb-3 " ref={dropdownRef}>
              <input
                type="text"
                placeholder="Search breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                className=" border p-2 rounded w-full mb-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
              />

              {showDropdown && (
                <div className="absolute mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto w-full z-10">
                  {loadingBreeds ? (
                    <p className="p-2 text-gray-500">Loading breeds...</p>
                  ) : (
                    filteredBreeds.map(({ breed, image }) => (
                      <div key={breed} onClick={() => handleBreedSelect(breed)} className="flex items-center p-2 hover:bg-gray-200 cursor-pointer">
                        {image && <img src={image} alt={breed} className="mr-2 rounded-full w-12 h-12" />}
                        <span>{breed}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Birth Date:</label>
          <input
            type="date"
            name="birth_date"
            value={petData.birth_date}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
          />

          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Age (if birth date unknown):</label>
          <input
            type="number"
            name="age"
            value={petData.age}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
            placeholder="Enter estimated age"
          />

          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Weight (kg):</label>
          <input
            type="number"
            name="weight"
            value={petData.weight}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
          />

          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Gender:</label>
          <select
            name="gender"
            value={petData.gender}
            onChange={handleChange}
            className="w-full px-2 py-2 mb-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label className="block text-sm font-medium text-[#325747] font-laila font-semibold">Health Status:</label>
          <input
            type="text"
            name="health_status"
            value={petData.health_status}
            onChange={handleChange}
            className="border p-2 rounded w-full border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
          />

          <div className="flex justify-center mt-4 space-x-4">
            <button type="submit" className="bg-[#E59560] text-white px-6 py-2 rounded-lg font-laila">
              Submit
            </button>
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-laila">
              Cancel
            </button>
          </div>
        
        </form>
      </div>
    </motion.div>
  );
};

export default PetForm;