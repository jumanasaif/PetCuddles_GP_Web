import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from 'react-router-dom';
import { FaCamera,FaFileMedical, FaDog, FaBirthdayCake, FaVenusMars, FaWeight, FaHeartbeat, FaCalendarAlt, FaPaw, FaRuler, FaArrowLeft,FaEdit, FaTrash,FaUtensils, FaSave, FaTimes, FaBullhorn ,FaHandHoldingHeart,FaCog} from "react-icons/fa";
import BgImage from "../assets/bg.png";
import ExtraImageDog from "../assets/dogprofile.png";
import ExtraImageCat from "../assets/catP2.png";
import MarkAsLostForm from "./LostPetForm"; 
import FeedingScheduleChart from './FeedingScheduleChart';
import QRCodeModal from './QRCodeModal';
import useFeedingReminder from '../hooks/useFeedingReminder';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from "react-toastify";

const PetProfile = () => {
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedPet, setUpdatedPet] = useState({});
  const [showLostForm, setShowLostForm] = useState(false); // State to control form visibility
  const [isLost, setIsLost] = useState(false);
  const [lostPostId, setLostPostId] = useState(null);
  const [showAdoptForm, setShowAdoptForm] = useState(false);
  const [adoptionType, setAdoptionType] = useState("lifetime");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [aboutPet, setAboutPet] = useState("");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [hasQuestions, setHasQuestions] = useState(false);
  const [questions, setQuestions] = useState([""]); 
  const [AdopType, setAdopType] = useState("");
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [showNutritionReport, setShowNutritionReport] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isCaretaker, setIsCaretaker] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const navigate = useNavigate();


 useEffect(() => {
   const fetchPet = async () => {
     try {
      const response = await axios.get(`http://localhost:5000/api/pets/id/${petId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPet(response.data.pet);
      setUpdatedPet(response.data.pet);
      setAdopType(response.data.AdoptionType);
      
      // Check if current user is owner or caretaker
      const currentUser = JSON.parse(localStorage.getItem("user"));
      setIsOwner(response.data.pet.owner_id._id === currentUser._id);
      setIsCaretaker(response.data.pet.temporaryCaretaker?.userId === currentUser._id);
      
      // Get the latest nutrition analysis if it exists
      if (response.data.pet.nutritionAnalysis && response.data.pet.nutritionAnalysis.length > 0) {
        setNutritionInfo(response.data.pet.nutritionAnalysis.slice(-1)[0]);
      }
      
      checkIfPetIsLost();
    } catch (error) {
      console.error("Error fetching pet data:", error);
    }
   };
   fetchPet();
 }, [petId]);



  const handleShowNutritionReport = () => {
    if (nutritionInfo) {
      setShowNutritionReport(true);
    } else {
      alert("No nutrition analysis available. Please calculate nutrition first.");
    }
  };



  const handleEdit = () => setEditMode(true);
  
  const handleCancel = () => {
    setUpdatedPet(pet);
    setEditMode(false);
  };

  const handleChange = (e) => {
    setUpdatedPet({ ...updatedPet, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    axios.put(`http://localhost:5000/api/pets/${petId}`, updatedPet, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(response => {
        setPet(response.data.pet);
        setEditMode(false);
      })
      .catch(error => console.error("Error updating pet:", error));
  };


  useFeedingReminder(
    petId,
    pet?.feedingSchedule?.mealTimes?.map(m => m.time) || [],
    pet?.name || "your pet"
 );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdatedPet({ ...updatedPet, img_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this pet?")) {
      axios.delete(`http://localhost:5000/api/pets/${petId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then(() => navigate("/ownerpets"))
        .catch(error => console.error("Error deleting pet:", error));
    }
  };
  const handleAdoptMe = () => {
    setShowAdoptForm(true);
  };


const handleQuestionChange = (index, event) => {
  const updatedQuestions = [...questions];
  updatedQuestions[index] = event.target.value;
  setQuestions(updatedQuestions);
};

const handleAddQuestion = () => {
  setQuestions([...questions, ""]);
};

const handleRemoveQuestion = (index) => {
  const updatedQuestions = questions.filter((_, i) => i !== index);
  setQuestions(updatedQuestions);
};

const handleHasQuestionsChange = (e) => {
  setHasQuestions(e.target.value === "yes");
};


const handleAdoptSubmit = () => {
  const adoptionData = {
    adoption_type: adoptionType,
    start_date: adoptionType === "temporary" ? startDate : null,
    end_date: adoptionType === "temporary" ? endDate : null,
    delivery_place: deliveryPlace,
    aboutPet: aboutPet,
    questions: hasQuestions ? questions : [] // Add questions if "yes"
  };

  axios.put(`http://localhost:5000/api/pets/${petId}/adopt`, adoptionData, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  })
  .then((response) => {
    setPet(response.data.pet); // Update pet status
    setShowAdoptForm(false);
    alert("Pet is now available for adoption!");
  })
  .catch((error) => {
    console.error("Error putting pet up for adoption:", error);
    alert(error.response?.data?.error || "Failed to put pet up for adoption.");
  });
};

const handleCancelAdoption = () => {
  if (window.confirm("Are you sure you want to cancel this adoption listing?")) {
    axios.delete(`http://localhost:5000/api/pets/${petId}/cancel-adoption`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    .then((response) => {
        setPet(response.data.pet);
        alert(response.data.message);
    })
    .catch((error) => {
        console.error("Error canceling adoption:", error);
        alert(error.response?.data?.error || "Failed to cancel adoption.");
    });
  }
};



const handleMarkAsLost = () => {
  setShowLostForm(true);
  

};

const handleMarkAsFound = async () => {
  try {
      await axios.delete(`http://localhost:5000/api/pets/lostpets/${petId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setIsLost(false);
      setLostPostId(null);
      alert("Pet marked as found and post deleted.");
  } catch (error) {
      console.error("Error marking pet as found:", error);
  }
};

const handleLostFormSuccess = (data) => {
  setIsLost(true);
  setLostPostId(data.postId);
  setShowLostForm(false);
};

const checkIfPetIsLost = async () => {
  try {
      const response = await axios.get(`http://localhost:5000/api/pets/lostpets/${petId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.lostPet) {
          setIsLost(true);
          setLostPostId(response.data.lostPet.postId);
      }
      else{
        setIsLost(false);
      }
  } catch (error) {
      console.error("Error checking if pet is lost:", error);
  }
}

  if (!pet) return <div>Loading...</div>;
  const registrationDate = new Date(pet.created_at).toLocaleDateString();

 
  return (
    <div
      className="min-h-screen bg-[#F6F4E8] flex flex-col items-center p-8 overflow-hidden"
      style={{ backgroundImage: `url(${BgImage})`, backgroundSize: "cover" }}
    >
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Right Side - Extra Image based on Species */}
      {pet.species === "dog" && (
        <div className="absolute right-0" style={{ marginTop: "48px" }}>
          <img src={ExtraImageDog} alt="Dog" className="w-64 h-64 object-cover" />
        </div>
      )}
      
      
     {/* Announcement Icon with "Mark as Lost" or "Mark as Found" Text */}
     <button
  className="absolute flex flex-col items-center"
  style={{ marginTop: "320px", marginLeft: "540px" }}
  onClick={handleShowNutritionReport}
>
  <div className="bg-[#E59560] rounded-full p-3 shadow-lg">
    <FaUtensils className="text-white text-2xl" />
  </div>
  <span className="mt-2 text-sm font-semibold font-laila text-[#E59560]">
    Nutrition Report
  </span>
</button>
<Link 
  to={`/pets/${petId}/health-records`}
  className="absolute flex flex-col items-center"
  style={{ marginTop: "320px", marginLeft: "770px" }}
>
  <div className="bg-[#E59560] rounded-full p-3 shadow-lg">
    <FaFileMedical className="text-white text-2xl" />
  </div>
  <span className="mt-2 text-sm font-semibold font-laila text-[#E59560]">
    Health Records
  </span>
</Link>
   
{/* Replace your existing QR code button with this */}
<button
  className="absolute flex flex-col items-center"
  style={{ marginTop: "320px", marginRight: "560px" }}
  onClick={() => setShowQRModal(true)}
  disabled={!pet.qrCodeUrl}
>
  <div className={`rounded-full p-3 shadow-lg ${pet.qrCodeUrl ? 'bg-[#E59560]' : 'bg-gray-400'}`}>
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="h-6 w-6 text-white" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" 
      />
    </svg>
  </div>
  <span className={`mt-2 text-sm font-semibold font-laila ${pet.qrCodeUrl ? 'text-[#E59560]' : 'text-gray-400'}`}>
     QR Code
  </span>
</button>

<Link 
  to={`/pets/${petId}/behavior`}
  className="absolute flex flex-col items-center"
  style={{ marginTop: "320px", marginRight: "780px" }}
>
  <div className="bg-[#E59560] rounded-full p-3 shadow-lg">
    <FaCog className="text-white text-2xl" />
  </div>
  <span className="mt-2 text-sm font-semibold font-laila text-[#E59560]">
    Behavior Analysis
  </span>
</Link>




{showQRModal && (
  <QRCodeModal 
    pet={pet} 
    onClose={() => setShowQRModal(false)} 
  />
)}
{showNutritionReport && nutritionInfo && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#325747] font-laila">
          Nutrition Analysis for {pet.name}
        </h2>
        <button 
          onClick={() => setShowNutritionReport(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes size={24} />
        </button>
      </div>

      <div className="space-y-4">
        <p className="font-medium text-[#1D3124]">
          Healthy Weight Range: <span className="font-bold text-[#E59560]">{nutritionInfo.idealWeightRange}</span>
        </p>
        
        <p className="font-medium text-[#1D3124]">
          Daily Calories Needed: <span className="font-bold text-[#E59560]">{nutritionInfo.calories} kcal</span>
        </p>
        
        {nutritionInfo.message && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-blue-700">ℹ️ {nutritionInfo.message}</p>
          </div>
        )}

        <div className="bg-[#F6F4E8] p-4 rounded-lg">
          <p className="font-bold text-[#325747] font-laila">Recommended Daily Food:</p>
          <p className="font-bold text-[#E59560] mt-1">{nutritionInfo.foodRecommendation}</p>
        </div>

        {nutritionInfo.warning && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-red-700">⚠️ {nutritionInfo.warning.title}</h3>
            <p className="text-red-700 mt-1 whitespace-pre-line">{nutritionInfo.warning.message}</p>
            {nutritionInfo.warning.calories && (
              <p className="text-red-700 mt-2">
                Suggested calories: <span className="font-bold">{nutritionInfo.warning.calories} kcal/day</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)}
     <button
        className="absolute flex flex-col items-center"
        style={{ marginTop: "320px", marginLeft: "300px" }}
        onClick={isLost ? handleMarkAsFound : handleMarkAsLost}
      >
        <div className="bg-[#E59560] rounded-full p-3 shadow-lg">
          <FaBullhorn className="text-white text-2xl" />
        </div>
        <span className="mt-2 text-sm font-semibold font-laila text-[#E59560]">
          {isLost ? "Mark as Found" : "Mark as Lost"}
        </span>
      </button>

      {/* Pop-up Form for Mark as Lost */}
      {showLostForm && (
        <MarkAsLostForm
          petId={petId}
          ownerId={pet.owner_id}
          onClose={() => setShowLostForm(false)}
          onSuccess={handleLostFormSuccess}
        />
      )}


{/* Show Cancel Adoption button when status is "notadopted" (listed but not yet adopted) */}
{pet.adoption_status === "available" && (
    <button
        className="absolute flex flex-col items-center"
        style={{ marginTop: "320px", marginRight: "300px" }}
        onClick={handleCancelAdoption}
    >
        <div className="bg-red-600 rounded-full p-3 shadow-lg">
            <FaTimes className="text-white text-2xl" />
        </div>
        <span className="mt-2 text-sm font-semibold font-laila text-red-600">
            Cancel Adoption 
        </span>
    </button>
)}

{/* Show Adopt Me button when status is "notAvailable" (not listed for adoption) */}
{(pet.adoption_status === "notAvailable" || 
  (pet.adoption_status === "adopted" && AdopType === "lifetime")) && (
    <button
        className="absolute flex flex-col items-center"
        style={{ marginTop: "320px", marginRight: "300px" }}
        onClick={handleAdoptMe}
    >
        <div className="bg-[#E59560] rounded-full p-3 shadow-lg">
            <FaHandHoldingHeart className="text-white text-2xl" />
        </div>
        <span className="mt-2 text-sm font-semibold font-laila text-[#E59560]">
            Put Up for Adoption
        </span>
    </button>
)}


      {/* Adoption Form for Owner */}
      {showAdoptForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-lg font-bold mb-4 font-laila text-[#325747]" style={{marginLeft:"90px"}}>Adoption Details</h2>
          
          {/* Radio Buttons */}
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2 text-[#E59560] cursor-pointer">
              <input
                type="radio"
                value="lifetime"
                checked={adoptionType === "lifetime"}
                onChange={(e) => setAdoptionType(e.target.value)}
                className="hidden"
              />
              <div
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                  adoptionType === "lifetime" ? "border-[#E59560]" : "border-gray-400"
                }`}
              >
                {adoptionType === "lifetime" && <div className="w-3 h-3 bg-[#E59560] rounded-full"></div>}
              </div>
              <span className="font-laila">Lifetime Adoption</span>
            </label>
      
            <label className="flex items-center space-x-2 text-[#E59560] cursor-pointer">
              <input
                type="radio"
                value="temporary"
                checked={adoptionType === "temporary"}
                onChange={(e) => setAdoptionType(e.target.value)}
                className="hidden"
              />
              <div
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                  adoptionType === "temporary" ? "border-[#E59560]" : "border-gray-400"
                }`}
              >
                {adoptionType === "temporary" && <div className="w-3 h-3 bg-[#E59560] rounded-full"></div>}
              </div>
              <span className="font-laila">Temporary Adoption</span>
            </label>
          </div>
      
          {/* Temporary Adoption Date Fields */}
          {adoptionType === "temporary" && (
            <div className="mt-4">
              <label className="block font-semibold font-laila text-[#325747]">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
              <label className="block font-semibold font-laila text-[#325747] mt-2">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
          )}
      
          {/* About Pet */}
          <label className="block font-semibold font-laila text-[#325747] mt-4">About Pet:</label>
          <textarea
            value={aboutPet}
            onChange={(e) => setAboutPet(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full resize-none"
            rows="3"
          />
      
          {/* Delivery Place */}
          <label className="block font-semibold font-laila text-[#325747] mt-4">Location:</label>
          <input
            type="text"
            id="deliveryPlace"
            value={deliveryPlace}
            onChange={(e) => setDeliveryPlace(e.target.value)}
            placeholder="Specify a location"
            required
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
{/* Do you have any questions for the adopter? */}
<label className="block font-semibold font-laila text-[#325747] mt-4">
  Do you have any questions for the adopter?
</label>
<div className="flex space-x-4">
  <label className="flex items-center space-x-2 text-[#E59560] cursor-pointer">
    <input
      type="radio"
      value="yes"
      checked={hasQuestions}
      onChange={handleHasQuestionsChange}
      className="hidden"
    />
    <div
      className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
        hasQuestions ? "border-[#E59560]" : "border-gray-400"
      }`}
    >
      {hasQuestions && <div className="w-3 h-3 bg-[#E59560] rounded-full"></div>}
    </div>
    <span className="font-laila">Yes</span>
  </label>

  <label className="flex items-center space-x-2 text-[#E59560] cursor-pointer">
    <input
      type="radio"
      value="no"
      checked={!hasQuestions}
      onChange={handleHasQuestionsChange}
      className="hidden"
    />
    <div
      className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
        !hasQuestions ? "border-[#E59560]" : "border-gray-400"
      }`}
    >
      {!hasQuestions && <div className="w-3 h-3 bg-[#E59560] rounded-full"></div>}
    </div>
    <span className="font-laila">No</span>
  </label>
</div>



{/* If yes, show input fields for questions */}
{hasQuestions && (
  <>
    <div className="mt-4">
      {questions.map((question, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => handleQuestionChange(index, e)}
            placeholder={`Question ${index + 1}`}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
          <button
            type="button"
            onClick={() => handleRemoveQuestion(index)}
            className="text-red-500"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddQuestion}
        className="text-blue-500 mt-2"
      >
        Add Another Question
      </button>
    </div>
  </>
)}
      
          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-4 " style={{marginRight:"80px"}}>
            <button
              onClick={handleAdoptSubmit}
              className="bg-[#325747] text-white px-4 py-2 rounded-md font-laila"
            >
              Submit
            </button>
            <button
              onClick={() => setShowAdoptForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md font-laila"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      )}
     
        
      {/* Pop-up Form for Mark as Lost */}
      {showLostForm && (
        <MarkAsLostForm
          petId={petId}
          ownerId={pet.owner_id}
          onClose={() => setShowLostForm(false)}
          onSuccess={(data) =>  toast.success("Pet marked as lost and post created to notify the useres.")}
        />
      )}

      {/* Rest of the Pet Profile UI */}
      <h1 className="text-6xl font-bold text-center font-laila text-[#325747]" style={{ marginTop: "70px" }}>
        Meet {pet.name}!
      </h1>
      <p className="text-lg text-center text-gray-600">Here’s all the info about your furry friend.</p>

      {/* Pet Image */}
      <div className="relative mt-6">
        <img
          src={updatedPet.img_url || "/assets/default-pet.png"}
          alt={pet.name}
          className="rounded-full object-cover mx-auto shadow-lg border-4 border-white"
          style={{ width: "200px", height: "200px" }}
        />
        {editMode && (
          <label className="absolute bottom-0 right-0 bg-gray-700 text-white p-2 rounded-full cursor-pointer">
            <FaCamera className="text-gray-500 text-xl" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e)} />
          </label>
        )}
      </div>
         
      {/* Table Container */}
      <div className="bg-white p-6 mt-6 w-full max-w-4xl drop-shadow-[0px_4px_7px_#E59560] rounded-3xl">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Name", value: "name", icon: <FaPaw className="mr-2 text-blue-500" /> },
            { label: "Species", value: "species", icon: <FaDog className="mr-2 text-yellow-500" /> },
            { label: "Breed", value: "breed", icon: <FaRuler className="mr-2 text-green-500" /> },
            { label: "Age", value: "age", icon: <FaBirthdayCake className="mr-2 text-pink-500" /> },
            { label: "Gender", value: "gender", icon: <FaVenusMars className="mr-2 text-purple-500" /> },
            { label: "Weight", value: "weight", icon: <FaWeight className="mr-2 text-gray-500" /> },
            { label: "Health Status", value: "health_status", icon: <FaHeartbeat className="mr-2 text-red-500" /> },
            { label: "Registered On", value: "created_at", icon: <FaCalendarAlt className="mr-2 text-blue-500" />, isReadOnly: true },
          ].map(({ label, value, icon, isReadOnly }) => (
            <div key={value} className="flex items-center font-laila">
              {icon} <span className="font-semibold font-laila mr-2">{label}:</span>
              {editMode && !isReadOnly ? (
                <input
                  type="text"
                  name={value}
                  value={updatedPet[value] || ""}
                  onChange={(e) => handleChange(e)}
                  className="border border-gray-300 rounded px-2 py-1 w-full"
                />
              ) : (
                <span>{value === "created_at" ? registrationDate : pet[value] || "N/A"}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-4" style={{ marginTop: "10px" }}>
        {editMode ? (
          <>
            <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
              <FaSave className="mr-2" /> Save
            </button>
            <button onClick={handleCancel} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center">
              <FaTimes className="mr-2" /> Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={handleEdit} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center">
              <FaEdit className="mr-2" /> Edit
            </button>
            <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center">
              <FaTrash className="mr-2" /> Delete
            </button>
          </>
        )}
        
      </div>
       <div className="w-full max-w-4xl mt-6">
         <FeedingScheduleChart petId={petId} />
       </div>
    </div>
  );
};

export default PetProfile;