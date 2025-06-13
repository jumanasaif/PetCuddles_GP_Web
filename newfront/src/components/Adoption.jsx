import React, { useEffect, useState, useRef } from "react";
import Header from "./header";
import DogImage from "../assets/doog2.png";
import AboutBg from "../assets/bg.png";
import { FaSearch, FaDog, FaCat, FaPaw, FaCrow,faQuestionCircle } from "react-icons/fa";
import axios from "axios";
import "@fontsource/laila";
import { useNavigate } from "react-router-dom";

const Adoption = () => {
  const [availablePets, setAvailablePets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [nearbyPets, setNearbyPets] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedAge, setSelectedAge] = useState("all");
  const [selectedBreed, setSelectedBreed] = useState("all");
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  // Fetch available pets from the backend
  useEffect(() => {
      const fetchAvailablePets = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/pets/adopt/available");
      setAvailablePets(response.data);
      setFilteredPets(response.data);
    } catch (error) {
      console.error("Error fetching available pets:", error);
    }
  };

    fetchAvailablePets();
  }, []);

  // Fetch nearby pets
  const fetchNearbyPets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/pets/adopt/nearby", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Nearby Pets:", response.data); // Debugging
      setNearbyPets(response.data);
      setFilteredPets(response.data); // Update the displayed pets
    } catch (error) {
      console.error("Error fetching nearby pets:", error);
    }
  };

  // Fetch breeds based on species
  useEffect(() => {
    const fetchBreeds = async () => {
      setBreeds([]);
      setSearchTerm("");

      if (selectedSpecies === "dog") {
        await fetchDogBreeds();
      } else if (selectedSpecies === "cat") {
        await fetchCatBreeds();
      } else if (selectedSpecies === "rabbit") {
        await fetchRabbitBreeds();
      }
    };

    fetchBreeds();
  }, [selectedSpecies]);

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

  const fetchCatBreeds = async () => {
    try {
      setLoadingBreeds(true);
      const response = await fetch("https://api.thecatapi.com/v1/breeds");
      const data = await response.json();

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

  const fetchRabbitBreeds = async () => {
    try {
      setLoadingBreeds(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/pets/rabbit-breeds", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const breeds = response.data.map((breed) => ({
        breed: breed.breed,
        image: `/assets/${breed.image}`,
      }));

      setBreeds(breeds);
    } catch (error) {
      console.error("Error fetching rabbit breeds:", error);
    } finally {
      setLoadingBreeds(false);
    }
  };

  // Filter pets based on species, gender, age, and breed
  const filterPets = () => {
    let filtered = nearbyPets.length > 0 ? nearbyPets : availablePets;
  
    if (selectedSpecies !== "all") {
      filtered = filtered.filter((pet) => pet.species?.toLowerCase() === selectedSpecies.toLowerCase());
    }
  
    if (selectedGender !== "all") {
      filtered = filtered.filter((pet) => pet.gender?.toLowerCase() === selectedGender.toLowerCase());
    }
  
    if (selectedAge !== "all") {
      filtered = filtered.filter((pet) => {
        const age = calculateAge(pet); // Use the updated calculateAge function
        if (!age) return false; // Skip if age cannot be determined
  
        if (selectedSpecies === "cat") {
          return filterCatAge(age);
        } else if (selectedSpecies === "dog") {
          return filterDogAge(age);
        } else if (selectedSpecies === "rabbit") {
          return filterRabbitAge(age);
        } else if (selectedSpecies === "bird") {
          return filterBirdAge(age);
        }
        return true;
      });
    }
  
    if (selectedBreed !== "all") {
      filtered = filtered.filter((pet) => pet.breed?.toLowerCase() === selectedBreed.toLowerCase());
    }
  
    setFilteredPets(filtered);
  };
  // Calculate age from birth date
  const calculateAge = (pet) => {
    if (pet.birth_date) {
      // Calculate age from birth_date
      const today = new Date();
      const birth = new Date(pet.birth_date);
      const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
      return ageInMonths;
    } else if (pet.age) {
      // If age is provided, assume it's in years and convert to months
      // Handle pets less than 1 year old (e.g., 0.5 for 6 months)
      return pet.age < 1 ? Math.floor(pet.age * 12) : pet.age * 12;
    }
    return null; // If neither birth_date nor age is available
  };

  // Age filters for each species
  const filterCatAge = (ageInMonths) => {
  if (selectedAge === "kitten") return ageInMonths <= 6;
  if (selectedAge === "junior") return ageInMonths > 6 && ageInMonths <= 24;
  if (selectedAge === "adult") return ageInMonths > 24 && ageInMonths <= 72;
  if (selectedAge === "mature") return ageInMonths > 72 && ageInMonths <= 120;
  if (selectedAge === "senior") return ageInMonths > 120 && ageInMonths <= 168;
  if (selectedAge === "geriatric") return ageInMonths > 168;
  return true;
};

const filterDogAge = (ageInMonths) => {
  if (selectedAge === "puppy") return ageInMonths <= 12;
  if (selectedAge === "junior") return ageInMonths > 12 && ageInMonths <= 24;
  if (selectedAge === "adult") return ageInMonths > 24 && ageInMonths <= 72;
  if (selectedAge === "mature") return ageInMonths > 72 && ageInMonths <= 108;
  if (selectedAge === "senior") return ageInMonths > 108 && ageInMonths <= 144;
  if (selectedAge === "geriatric") return ageInMonths > 144;
  return true;
};

const filterRabbitAge = (ageInMonths) => {
  if (selectedAge === "baby") return ageInMonths <= 3;
  if (selectedAge === "adolescent") return ageInMonths > 3 && ageInMonths <= 6;
  if (selectedAge === "young adult") return ageInMonths > 6 && ageInMonths <= 12;
  if (selectedAge === "adult") return ageInMonths > 12 && ageInMonths <= 60;
  if (selectedAge === "senior") return ageInMonths > 60;
  return true;
};

const filterBirdAge = (ageInMonths) => {
  if (selectedAge === "young") return ageInMonths <= 12;
  if (selectedAge === "adult") return ageInMonths > 12 && ageInMonths <= 120;
  if (selectedAge === "senior") return ageInMonths > 120;
  return true;
};

  // Handle species selection
  const handleSpeciesSelect = (species) => {
    setSelectedSpecies(species);
    setSelectedBreed("all");
    setSelectedGender("all");
    setSelectedAge("all");
  };

  // Handle breed selection
  const handleBreedSelect = (breed) => {
    setSelectedBreed(breed);
    setSearchTerm(breed);
    setShowDropdown(false);
  };

  // Handle gender selection
  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
  };

  // Handle age selection
  const handleAgeSelect = (age) => {
    setSelectedAge(age);
  };

  // Apply filters
  useEffect(() => {
    filterPets();
  }, [selectedSpecies, selectedGender, selectedAge, selectedBreed, nearbyPets, availablePets]);

  return (
    <div
      className="flex flex-col min-h-screen w-full items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#F6F4E8" }}
    >
      <Header />

      {/* Hero Section */}
      <section
        className="relative min-h-[80vh] w-full flex items-center justify-start"
        style={{ backgroundColor: "#BACEC1" }}
      >
        <div className="flex flex-col items-center" style={{ marginTop: "-120px", marginLeft: "450px" }}>
          <h1 className="font-bold font-laila text-7xl text-[#E59560]">
            Adopt. <span className="text-[#325747]">Don't Shop.</span>
          </h1>
          <p className="text-lg text-[#325747] mt-4">
            Every pet deserves a loving home. Start your journey today!
          </p>
          <button className="mt-6 bg-[#E59560] text-white px-6 py-3 rounded-full shadow-md font-laila">
            Find a friend
          </button>
        </div>
        <img
          src={DogImage}
          alt="Happy Dog"
          style={{ marginBottom: "-425px", marginLeft: "-480px", width: "600px" }}
        />
      </section>

      {/* How It Works Section */}
      <section className="w-full flex flex-col items-center py-12 bg-[#F6F4E8]" style={{ marginTop: "50px" }}>
        <h2 className="text-4xl font-bold font-laila text-[#325747]">How It Works</h2>
        <div className="flex items-center w-full max-w-4xl relative">
          <div className="absolute top-[18px] w-4/6 border-t-2 border-[#E59560] z-0" style={{ marginLeft: "150px" }}></div>
          <div className="flex flex-col items-center w-1/3 relative z-10">
            <div className="w-5 h-5 bg-[#E59560] rounded-full border-4 border-white shadow-md" style={{ marginTop: "-5px" }}></div>
            <h3 className="text-lg font-semibold font-laila mt-4 text-[#325747]">Find Your Pet</h3>
            <p className="text-sm text-center text-gray-600 mt-2">
              Select a pet from our adoption list.
            </p>
          </div>
          <div className="flex flex-col items-center w-1/3 relative z-10">
            <div className="w-5 h-5 bg-[#E59560] rounded-full border-4 border-white shadow-md" style={{ marginTop: "6px" }}></div>
            <h3 className="text-lg font-semibold font-laila mt-4 text-[#325747]">Send a Request</h3>
            <p className="text-sm text-center text-gray-600 mt-2">
              Reach out to the pet’s owner to start the process.
            </p>
          </div>
          <div className="flex flex-col items-center w-1/3 relative z-10">
            <div className="w-5 h-5 bg-[#E59560] rounded-full border-4 border-white shadow-md" style={{ marginTop: "-5px" }}></div>
            <h3 className="text-lg font-semibold font-laila mt-4 text-[#325747]">Take Your Pet Home</h3>
            <p className="text-sm text-center text-gray-600 mt-2">
              If accepted, complete the adoption process.
            </p>
          </div>
        </div>
      </section>

      {/* Search by City Section */}
      <section
        className="py-10 w-full flex flex-col items-center justify-center relative"
        style={{ backgroundImage: `url(${AboutBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-[#E59560] opacity-80"></div>
        <div className="flex items-center space-x-4 z-10">
          <p className="font-laila font-semibold text-[#325747] text-2xl">Find adoptable pets near you with a simple search:</p>
          <div className="relative flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search by city or zip"
              className="p-2 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] font-laila"
            />
            <FaSearch className="absolute top-3 right-3 text-[#E59560]" />
          </div>
          <button onClick={fetchNearbyPets} className="bg-[#E59560] text-white px-6 py-2 rounded-lg shadow-lg font-laila">
            Find Near Pets
          </button>
        </div>
      </section>

      {/* Display Pets Section */}
      <section className="w-full flex flex-col items-center justify-center relative" style={{ marginTop: "50px" }}>
        <p className="text-[#325747]">Meet your friend</p>
        <h1 className="font-laila text-[#325747] text-2xl">These pets are ready for adoption. Swipe to find The One.</h1>

        {/* Pet Filters */}
        <div className="flex space-x-6 mt-6">
          <div
            className="flex flex-col items-center justify-center bg-[#BACEC1] w-32 h-32 rounded-lg shadow-lg text-center cursor-pointer"
            onClick={() => handleSpeciesSelect("all")}
          >
            <FaPaw className="text-4xl text-[#E59560]" />
            <p className="text-[#E59560] mt-2">All</p>
          </div>
          <div
            className="flex flex-col items-center justify-center bg-[#BACEC1] w-32 h-32 rounded-lg shadow-lg text-center cursor-pointer"
            onClick={() => handleSpeciesSelect("dog")}
          >
            <FaDog className="text-4xl text-[#E59560]" />
            <p className="text-[#E59560] mt-2">Dog</p>
          </div>
          <div
            className="flex flex-col items-center justify-center bg-[#BACEC1] w-32 h-32 rounded-lg shadow-lg text-center cursor-pointer"
            onClick={() => handleSpeciesSelect("cat")}
          >
            <FaCat className="text-4xl text-[#E59560]" />
            <p className="text-[#E59560] mt-2">Cat</p>
          </div>
          <div
            className="flex flex-col items-center justify-center bg-[#BACEC1] w-32 h-32 rounded-lg shadow-lg text-center cursor-pointer"
            onClick={() => handleSpeciesSelect("rabbit")}
          >
            <FaCrow className="text-4xl text-[#E59560]" />
            <p className="text-[#E59560] mt-2">Rabbit</p>
          </div>
          <div
            className="flex flex-col items-center justify-center bg-[#BACEC1] w-32 h-32 rounded-lg shadow-lg text-center cursor-pointer"
            onClick={() => handleSpeciesSelect("bird")}
          >
            <FaCrow className="text-4xl text-[#E59560]" />
            <p className="text-[#E59560] mt-2">Bird</p>
          </div>
        </div>

        {/* Gender Filter */}
        <div className="flex space-x-6 mt-6">
          <button
            className={`px-4 py-2 rounded-lg font-laila ${
              selectedGender === "all" ? "bg-[#E59560] text-white" : "bg-[#BACEC1] text-[#325747]"
            }`}
            onClick={() => handleGenderSelect("all")}
          >
            All Genders
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-laila ${
              selectedGender === "male" ? "bg-[#E59560] text-white" : "bg-[#BACEC1] text-[#325747]"
            }`}
            onClick={() => handleGenderSelect("male")}
          >
            Male
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-laila ${
              selectedGender === "female" ? "bg-[#E59560] text-white" : "bg-[#BACEC1] text-[#325747]"
            }`}
            onClick={() => handleGenderSelect("female")}
          >
            Female
          </button>
        </div>

        {/* Age Filter */}
        <div className="flex space-x-6 mt-6">
        <select
  className="p-2 border border-[#E59560] rounded-lg text-white font-laila bg-[#325747]"
  value={selectedAge}
  onChange={(e) => handleAgeSelect(e.target.value)}
>
  <option value="all">All Ages</option>
  {selectedSpecies === "cat" && (
    <>
      <option value="kitten">Kitten (0–6 months)</option>
      <option value="junior">Junior (7–24 months)</option>
      <option value="adult">Adult (25–72 months)</option>
      <option value="mature">Mature (73–120 months)</option>
      <option value="senior">Senior (121–168 months)</option>
      <option value="geriatric">Geriatric (169+ months)</option>
    </>
  )}
  {selectedSpecies === "dog" && (
    <>
      <option value="puppy">Puppy (0–12 months)</option>
      <option value="junior">Junior (13–24 months)</option>
      <option value="adult">Adult (25–72 months)</option>
      <option value="mature">Mature (73–108 months)</option>
      <option value="senior">Senior (109–144 months)</option>
      <option value="geriatric">Geriatric (145+ months)</option>
    </>
  )}
  {selectedSpecies === "rabbit" && (
    <>
      <option value="baby">Baby (0–3 months)</option>
      <option value="adolescent">Adolescent (4–6 months)</option>
      <option value="young adult">Young Adult (7–12 months)</option>
      <option value="adult">Adult (13–60 months)</option>
      <option value="senior">Senior (61+ months)</option>
    </>
  )}
  {selectedSpecies === "bird" && (
    <>
      <option value="young">Young (0–12 months)</option>
      <option value="adult">Adult (13–120 months)</option>
      <option value="senior">Senior (121+ months)</option>
    </>
  )}
</select>
        </div>

        {/* Breed Filter */}
        <div className="flex space-x-6 mt-6">
          <select
            className="p-2 border border-[#E59560] rounded-lg text-white bg-[#325747] font-laila"
            value={selectedBreed}
            onChange={(e) => handleBreedSelect(e.target.value)}
          >
            <option value="all">All Breeds</option>
            {breeds.map((breed) => (
              <option key={breed.breed} value={breed.breed}>
                {breed.breed}
              </option>
            ))}
          </select>
        </div>

        {/* Display Available Pets */}
        {/* Display Available Pets */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10 w-full max-w-6xl px-4">
      {filteredPets.map((pet) => (
        <div key={pet._id} className="overflow-hidden">
        {pet.img_url ? (
          <img
            src={pet.img_url}
            alt={pet.name}
            className="w-full h-48 object-cover rounded-3xl"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-3xl">
            <FaPaw className="text-5xl text-[#E59560]" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-laila font-semibold text-[#325747] text-xl">
            {pet.name}
            {pet.type === 'foundPet' && (
              <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Found Pet
              </span>
            )}
          </h3>
          <div className="flex space-x-4">
            <p className="text-sm text-gray-600">
              {pet.delivery_place} - {pet.gender} {pet.distance ? ` • ${pet.distance.toFixed(1)} km away` : ""}
            </p>
            <button 
              className="text-[#E59560] font-laila" 
              style={{ textDecorationLine: "underline" }} 
              onClick={() => navigate(`/adoptdetailes/${pet._id}`, { state: { petType: pet.type || 'pet' }})}
            >
              Know more
            </button>
          </div>
        </div>
      </div>
      
      ))}
    </div>
      </section>
    </div>
  );
};

export default Adoption;
