import React, { useState, useEffect } from 'react';
import { FaCamera, FaSpinner, FaClinicMedical, FaPaw, FaNotesMedical,FaFileMedical } from 'react-icons/fa';
import { GiHealthNormal, GiDogBowl } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const SkinAnalysis = () => {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPets, setLoadingPets] = useState(true);
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState('');
  const [petError, setPetError] = useState(null);
  const [aiDetails, setAiDetails] = useState(null);
const [currentQuestion, setCurrentQuestion] = useState("");
const [aiAnswer, setAiAnswer] = useState(null);
const [aiLoading, setAiLoading] = useState(false);

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/pets/user-pets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPets(response.data.pets);
        setPetError(null);
      } catch (err) {
        setPetError(err.response?.data?.message || 'Failed to load pets');
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!image || !selectedPetId) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('petId', selectedPetId);
    formData.append('notes', notes);

    try {
      const response = await axios.post('http://localhost:5000/api/skin/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        withCredentials: true
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
  if (!currentQuestion || !result) return;
  
  setAiLoading(true);
  try {
    const response = await axios.post('http://localhost:5000/api/skin/ask', {
      question: currentQuestion,
      analysisId: result._id
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    setAiAnswer(response.data.answer);
  } catch (error) {
    console.error("Failed to get answer:", error);
    alert("Failed to get AI response");
  } finally {
    setAiLoading(false);
  }
};


const handleAddToHealthRecords = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `http://localhost:5000/api/pets/${selectedPetId}/health-records`,
      {
        type: 'skin_detection',
        title: `Skin Analysis - ${result.prediction}`,
        description: `Skin condition detection with ${Math.round(result.confidence * 100)}% confidence`,
        notes: notes,
        data: {  // This should match what renderSkinDetectionDetails expects
          type: 'skin_detection',
          prediction: result.prediction,
          confidence: result.confidence,
          recommendation: result.recommendation,
          imageUrl: result.image_url
        },
        images: [result.image_url] // Add to images array if your backend expects it
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    alert('Added to health records successfully!');
  } catch (error) {
    console.error('Error adding to health records:', error);
    alert(`Failed to add to health records: ${error.response?.data?.error || error.message}`);
  }
};
  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila"style={{marginTop:"80px"}}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center bg-[#325747] text-[#F6F4E8] px-6 py-3 rounded-full mb-4"
          >
            <GiHealthNormal className="text-2xl mr-2" />
            <h1 className="text-3xl font-bold">Skin Condition Analysis</h1>
          </motion.div>
          <p className="text-[#325747] max-w-2xl mx-auto">
            Upload a clear photo of your pet's skin condition for AI-powered analysis and recommendations
          </p>
        </div>

        {/* Pet Selection */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto"
        >
          <div className="flex items-center mb-4">
            <FaPaw className="text-[#E59560] text-xl mr-2" />
            <h2 className="text-xl font-semibold text-[#325747]">Select Your Pet</h2>
          </div>
          
          <div className="relative">
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560] transition-all appearance-none bg-white"
              disabled={loadingPets}
            >
              <option value="">-- Select a Pet --</option>
              {pets.map(pet => (
                <option key={pet._id} value={pet._id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 text-[#325747]">
              <FaPaw />
            </div>
          </div>
          
          <AnimatePresence>
            {petError && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-sm mt-2"
              >
                {petError}
              </motion.p>
            )}
            {!loadingPets && pets.length === 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#325747] text-sm mt-2"
              >
                No pets found. Please add a pet first.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="bg-[#325747] text-[#F6F4E8] p-4 flex items-center">
              <FaCamera className="mr-2" />
              <h3 className="font-semibold">Upload Skin Image</h3>
            </div>
            
            <div className="p-6">
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-[#BACEC1] rounded-lg p-8 text-center transition-all hover:border-[#E59560] hover:bg-[#F6F4E8]">
                  {preview ? (
                    <motion.img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <FaCamera className="mx-auto text-[#BACEC1] text-5xl mb-4" />
                      <p className="text-[#325747] font-medium">Click to upload an image</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG (max 5MB)</p>
                    </motion.div>
                  )}
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </div>
              </label>

              <div className="mt-6">
                <div className="flex items-center mb-2 text-[#325747]">
                  <FaNotesMedical className="mr-2 text-[#E59560]" />
                  <label className="font-medium">Additional Notes</label>
                </div>
                <textarea
                  className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560] transition-all"
                  placeholder="Describe any symptoms or concerns..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                />
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={!image || loading || !selectedPetId}
                whileHover={(!image || loading || !selectedPetId) ? {} : { scale: 1.03 }}
                whileTap={(!image || loading || !selectedPetId) ? {} : { scale: 0.98 }}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition-all ${(!image || loading || !selectedPetId) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#E59560] hover:bg-[#d4834a] text-white'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <GiHealthNormal className="mr-2" />
                    Analyze Skin Condition
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="bg-[#325747] text-[#F6F4E8] p-4 flex items-center">
              <GiDogBowl className="mr-2" />
              <h3 className="font-semibold">Analysis Results</h3>
            </div>
            
            <div className="p-6 h-full">
              <AnimatePresence>
{result && (
  <motion.div
    key="result"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-6 rounded-lg ${result.prediction === 'healthy' ? 'bg-[#BACEC1]' : 'bg-[#f8e3d6]'}`}
  >
    {/* Results Header */}
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-2xl capitalize text-[#325747]">
          {result.prediction.replace('_', ' ')}
        </h3>
        <p className="text-[#325747]">
          Confidence: <span className="font-semibold">{Math.round(result.confidence * 100)}%</span>
        </p>
      </div>
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#325747] shadow">
        {result.species}
      </span>
    </div>

    {/* Basic Recommendation */}
    <div className="mt-4 p-4 bg-white rounded-lg">
      <p className="font-semibold text-[#325747] mb-2">Recommendation:</p>
      <p className="text-[#325747]">{result.recommendation.baseRecommendation}</p>
    </div>

    {/* AI Explanation - Only show if available */}
    {result.recommendation.explanation && (
      <div className="mt-4 p-4 bg-white rounded-lg">
        <h4 className="font-semibold text-[#325747] mb-2">AI Explanation</h4>
        <p className="text-[#325747]">{result.recommendation.explanation}</p>
        
        {result.recommendation.home_care?.length > 0 && (
          <div className="mt-3">
            <h4 className="font-semibold text-[#325747] mb-1">Home Care Tips</h4>
            <ul className="list-disc pl-5">
              {result.recommendation.home_care.map((tip, i) => (
                <li key={i} className="text-[#325747]">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <p className="font-semibold text-[#325747]">Vet Urgency:</p>
            <p>{result.recommendation.vet_urgency || 'Moderate'}</p>
          </div>
          <div>
            <p className="font-semibold text-[#325747]">Contagious:</p>
            <p>{result.recommendation.contagious || 'Unknown'}</p>
          </div>
        </div>
      </div>
    )}

    {/* Q&A Section */}
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          placeholder="Ask about this condition..."
          className="flex-1 p-2 border-2 border-[#BACEC1] rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
        />
        <button 
          onClick={handleAskQuestion}
          disabled={aiLoading}
          className="bg-[#325747] text-white px-4 py-2 rounded-lg"
        >
          {aiLoading ? <FaSpinner className="animate-spin" /> : "Ask"}
        </button>
      </div>
      
      {aiAnswer && (
        <div className="mt-3 p-3 bg-[#F6F4E8] rounded-lg">
          <p>{aiAnswer}</p>
          <p className="text-xs mt-2 text-gray-500">
            AI-generated advice. Consult your vet for medical decisions.
          </p>
        </div>
      )}
    </div>

    {result.prediction !== 'healthy' && (
      <button
        onClick={() => window.location.href = '/vet/appointments'}
        className="mt-6 w-full bg-[#E59560] text-white py-3 rounded-lg"
      >
        <FaClinicMedical className="inline mr-2" />
        Book Vet Appointment
      </button>
      
    )}
      <button
  onClick={handleAddToHealthRecords}
  className="bg-[#325747] mt-3 w-full text-white py-3 rounded-lg"
>
  <FaFileMedical className="inline mr-2" />
  Add to Health Records
</button>
  </motion.div>
)}:

                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#325747]"
                  >
                    <GiDogBowl className="text-5xl text-[#BACEC1] mb-4" />
                    <p className="text-center">Upload an image to analyze your pet's skin condition</p>
                    <p className="text-sm text-gray-500 mt-2">Results will appear here</p>
                  </motion.div>
                
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default SkinAnalysis;