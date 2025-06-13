import React, { useEffect, useState} from "react";
import axios from "axios";
import { useParams, useNavigate,useLocation } from "react-router-dom";
import Header from "./header";
import "@fontsource/laila";
import BgImage from "../assets/bg.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocketchat } from "@fortawesome/free-brands-svg-icons";
import { faPaw, faVenusMars, faCalendarAlt, faHeartbeat, faDog,faPhone,faCat,faDove,faOtter,faWeight} from "@fortawesome/free-solid-svg-icons";

const PetDetails = () => {
  const { petId } = useParams();
  const location = useLocation();
  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [adoptionDetails, setAdoptionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [adoptionType, setAdoptionType] = useState("lifetime");
  const [answers, setAnswers] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();

  // Determine if this is a found pet
  const isFoundPet = location.state?.petType === 'foundPet';

  useEffect(() => {
    const fetchPetDetails = async () => {
      try {
        let response;
        const token = localStorage.getItem("token");
        
        if (isFoundPet) {
          response = await axios.get(
            `http://localhost:5000/api/vet/found-pets/${petId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setPet(response.data);
          setOwner({
            _id: response.data.clinic._id,
            fullName: response.data.clinic.clinicName,
            city: response.data.clinic.city,
          });
          setAdoptionDetails({
            delivery_place: response.data.clinic.city,
            adoption_type: 'lifetime',
            aboutPet: response.data.adoptionDetails?.aboutPet,
            questions: response.data.adoptionDetails?.questions || []
          });
        } else {
          response = await axios.get(
            `http://localhost:5000/api/pets/adoptdetailes/${petId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPet(response.data.pet);
          setOwner(response.data.owner);
          setAdoptionDetails(response.data.adoption);
          setQuestions(response.data.adoption?.questions || []);
          // Set adoption type from the response, default to 'lifetime'
          setAdoptionType(response.data.adoption?.adoption_type || 'lifetime');
        }
      } catch (error) {
        console.error("Error fetching pet details:", error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPetDetails();
  }, [petId, isFoundPet, navigate]);


  const handleInputChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };
  const handleSubmit = async () => {
    if (!agree) {
      alert("You must agree to share your mobile number and location.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to be logged in to submit an adoption request.");
        return;
      }
  
      const userData = JSON.parse(localStorage.getItem("user"));
      const requester_id = userData?.id;
  
      if (!requester_id) {
        throw new Error("User ID not found");
      }
  
      // Ensure adoptionType has a valid value
      const validAdoptionType = adoptionType || 'lifetime'; // Default to 'lifetime' if empty
  
      const requestData = {
        pet_id: petId,
        pet_type: isFoundPet ? 'FoundPet' : 'Pet',
        owner_id: owner._id,
        adoption_type: validAdoptionType, // Use validated adoption type
        requester_id: requester_id,
        questionsAndAnswers: questions
          .map((q, i) => ({
            question: q,
            answer: answers[i] || ""
          }))
          .filter(item => item.question),
        clinic_id: isFoundPet ? owner._id : null
      };
  
      console.log("Request payload:", JSON.stringify(requestData, null, 2));
  
      const endpoint = isFoundPet 
        ? "http://localhost:5000/api/vet/found-pets/requests"
        : "http://localhost:5000/api/pets/adoption/submitRequest";
  
      const response = await axios.post(
        endpoint,
        requestData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      alert("Adoption request submitted successfully!");
      setShowForm(false);
      navigate('/home');
    } catch (error) {
      console.error("Submission error:", {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          "Failed to submit adoption request";
      
      alert(`Error: ${errorMessage}`);
    }
  };


  if (loading) {
    return <p>Loading...</p>;
  }

  if (!pet) {
    return <p>Pet not found.</p>;
  }

  // Function to dynamically select the icon
const getSpeciesIcon = (species) => {
  switch (species.toLowerCase()) {
    case "dog":
      return faDog;
    case "cat":
      return faCat;
    case "bird":
      return faDove;
    case "rabbit":
      return faOtter;
    default:
      return faPaw; // Default for unknown species
  }
};
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center relative" style={{ backgroundColor: "#F6F4E8", backgroundImage: `url(${BgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
      <Header />
      {/* Pet Image Container with Background Image */}
      
    <div className="flex w-full h-[500px] ">
      {/* Left Section */}
      <div className="w-1/2 flex flex-col justify-center p-8 relative">
        {/* Small Orange Rectangle */}
        <div className="bg-[#BACEC1] w-3/4 mb-6 rounded-lg shadow-lg "style={{height:"60px",marginLeft:"170px",marginTop:"60px"}}></div>

        {/* Pet Information */}
        <div className="bg-[#325747] text-white p-12 rounded-lg shadow-lg font-laila" style={{height:"300px"}}>
          <h1 className="text-3xl font-bold mb-4">Hello, I'm {pet.name}</h1>
          <p className="text-2xl"style={{lineHeight:"40px"}}>
            I'm a {pet.age}-year-old {pet.breed} from {owner.city}-{owner.village} and I'm ready to be your loyal companion.
            Please read my profile below to find
            out more.
          </p>
        </div>
      </div>

      {/* Right Section with Pet Image */}
      <div
  className={`w-1/2 flex items-center justify-center ${!pet.img_url ? 'bg-gray-100' : ''}`}
  style={{
    backgroundImage: pet.img_url ? `url(${pet.img_url})` : 'none',
    backgroundSize: "cover",
    backgroundPosition: "center",
    marginTop: "80px",
    borderRadius: "25px",
  }}
>
  {!pet.img_url && <FontAwesomeIcon icon={faPaw} className="text-6xl text-[#E59560]" /> }
</div>

    </div>
      
      {/* Pet Details Section */}
      <section className="w-full" style={{ marginTop: "50px" }}>

        {/* Pet and Owner Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-laila">
          {/* Pet Information */}
          <div className="p-8 " >
            <h2 className="text-4xl font-semibold font-laila text-[#E59560] mb-2 "> {pet.name}'s Information</h2>
            <div className="space-y-2 w-1/2 " >
               {/* Species - Dynamic Icon */}
               <p className="text-xl text-gray-600 border-b border-[#E59560] pb-2  flex items-center">
                 <FontAwesomeIcon icon={getSpeciesIcon(pet.species)} className="text-[#325747] mr-6" /> {pet.species}
               </p>

               {/* Breed */}
               <p className="text-xl text-gray-600 border-b border-[#E59560] pb-2 flex items-center">
                 <FontAwesomeIcon icon={faPaw} className="text-[#325747] mr-6" /> {pet.breed}
               </p>

               {/* Age */}
               <p className="text-xl text-gray-600 border-b  border-[#E59560] pb-2 flex items-center">
                 <FontAwesomeIcon icon={faCalendarAlt} className="text-[#325747] mr-7" /> {pet.age} years
               </p>

               {/* Wieght */}
               <p className="text-xl text-gray-600 border-b  border-[#E59560] pb-2 flex items-center">
                 <FontAwesomeIcon icon={faWeight } className="text-[#325747] mr-7" /> {pet.weight} Kg
               </p>

               {/* Gender */}
               <p className="text-xl text-gray-600 border-b border-[#E59560] pb-2 flex items-center">
                 <FontAwesomeIcon icon={faVenusMars} className="text-[#325747] mr-6" /> {pet.gender}
               </p>

               {/* Health Status */}
               <p className="text-xl text-gray-600 border-b border-[#E59560] pb-2 flex items-center">
                  <FontAwesomeIcon icon={faHeartbeat} className="text-[#325747] mr-6" /> {pet.health_status}
               </p>
             </div>


            {/* About Pet Section (if available) */}
            {adoptionDetails?.aboutPet && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold font-laila text-[#325747] mb-2">About {pet.name}</h2>
                <p className="text-lg text-gray-600">{adoptionDetails.aboutPet}</p>
              </div>
            )}
          </div>

          {/* Owner Information */}
          <div className="p-8 flex space-x-6">
  {/* Owner Details */}
  <div className="flex-1">
    <h2 className="text-4xl font-semibold font-laila text-[#E59560] mb-2">Owner Details</h2>
    <div className="flex items-center space-x-4">
      <img
        src={owner.profileImage || "/assets/default-profile.png"}
        alt={owner.fullName}
        className="rounded-full"
        style={{ width: "80px", height: "80px" }}
      />
      <div>
        <p className="text-xl text-[#325747]"><strong>Name:</strong> {owner.fullName}</p>
        <p className="text-xl text-[#325747]"><strong>Phone:</strong> {owner.phone}</p>
      </div>
    </div>
    <div className="flex items-center space-x-2 mt-4" style={{ marginLeft: "80px" }}>
      <button className="text-2xl px-2 py-2">
        <FontAwesomeIcon icon={faPhone} className="text-[#325747]" />
      </button>
      <button className="text-2xl">
        <FontAwesomeIcon icon={faRocketchat} className="text-[#325747]" />
      </button>
    </div>

    {/* Delivery Place and Adoption Type */}
    {adoptionDetails && (
      <div className="mt-6">
        <h2 className="text-4xl font-semibold font-laila text-[#E59560] mb-2">Adoption Details</h2>
        <p className="text-xl text-[#325747] border-b pb-2"><strong>Delivery Place:</strong> {adoptionDetails.delivery_place}</p>
        <p className="text-xl text-[#325747] border-b pb-2">
          <strong>Adoption Type:</strong> {adoptionDetails.adoption_type}
          {adoptionDetails.adoption_type === "temporary" && (
            <>
              <span> (From: {new Date(adoptionDetails.start_date).toLocaleDateString()} to: {new Date(adoptionDetails.end_date).toLocaleDateString()})</span>
            </>
          )}
        </p>
      </div>
    )}
  </div>

  {/* Adoption Request Box */}
  <div className="bg-[#325747] p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-white" style={{ width: "300px", height: "250px" }}>
    <p className="text-2xl mb-4 text-center">Considering {pet.name} for adoption?</p>
    <button
      className="bg-[#ffff] text-[#325747] px-6 py-3 rounded-lg font-laila rounded-lg"
      onClick={() => setShowForm(true)}
    >
      Request Adoption
    </button>

  </div>

          </div>

        </div>

      
      </section>
      {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center font-laila">
                <div className="bg-white p-8 rounded-lg w-1/2 max-h-[70vh] overflow-y-auto">
                  <h2 className="text-2xl mb-4 text-[#325747] font-bold " style={{marginLeft:"180px"}}>Adoption Request Form</h2>

                  {questions.map((q, index) => (
                    <div key={index} className="mb-4">
                      <label className="block text-lg font-semibold">{q}</label>
                      <input
                        type="text"
                        value={answers[index] || ""}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        className="w-full border p-2 rounded-lg"
                      />
                    </div>
                  ))}

                  <label className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={() => setAgree(!agree)}
                      className="mr-2"
                    />
                    I agree to share my mobile number and location with the pet owner.
                  </label>

                  <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} className="bg-[#325747] text-white px-6 py-2 rounded-lg">Submit Request</button>
                  </div>
                </div>
              </div>
            )}

    </div>
  );
};

export default PetDetails;
