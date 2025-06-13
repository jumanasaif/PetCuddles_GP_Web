import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaw, faNotesMedical, faUserMd, faArrowLeft,
  faVenusMars, faDog, faCat, faDove, faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const FoundPetForm = () => {
  const navigate = useNavigate();
  const clinicData = JSON.parse(localStorage.getItem('clinic'));
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [foundPet, setFoundPet] = useState({
    name: '',
    species: '',
    breed: '',
    estimatedAge: '',
    gender: 'unknown',
    distinguishingFeatures: '',
    foundLocation: '',
    foundDate: new Date().toISOString().split('T')[0] // Default to today
  });
  const [medicalInfo, setMedicalInfo] = useState({
    diagnosis: '',
    treatment: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Fetch doctors when component mounts
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/vet/doctors?clinic=${clinicData.id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
        setDoctors(response.data);
        if (response.data.length > 0) {
          setSelectedDoctor(response.data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load doctors list');
        console.error('Error fetching doctors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [clinicData.id]);

  const handleFoundPetChange = (e) => {
    const { name, value } = e.target;
    setFoundPet(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicalInfoChange = (e) => {
    const { name, value } = e.target;
    setMedicalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    try {
      const doctor = doctors.find(d => d._id === selectedDoctor);
      if (!doctor) throw new Error('Selected doctor not found');

      const response = await axios.post(
        'http://localhost:5000/api/health-records/found-pets',
        {
          clinic_id: clinicData.id,
          doctor_id: selectedDoctor,
          doctor_name: doctor.name,
          foundPet: {
            ...foundPet,
            species: foundPet.species || 'unknown',
            estimatedAge: foundPet.estimatedAge || 'unknown',
            gender: foundPet.gender || 'unknown'
          },
          medicalInfo: {
            diagnosis: medicalInfo.diagnosis || '',
            treatment: medicalInfo.treatment || '',
            notes: medicalInfo.notes || '',
            procedures: [],
            medications: [],
            vaccinations: [],
            lab_results: []
          }
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      toast.success('Found pet record created successfully');
      navigate(`/health-records/${response.data.data._id}`);
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      toast.error(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Error creating found pet record'
      );
    }
  };

  const getSpeciesIcon = (species) => {
    switch (species) {
      case 'dog': return faDog;
      case 'cat': return faCat;
      case 'bird': return faDove;
      case 'rabbit': return faPaw;
      default: return faQuestionCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="min-h-screen pt-20 p-4 md:p-8 bg-[#F6F4E8]" style={{ fontFamily: "'Laila', sans-serif" }}>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-[#325747] mb-4">
            <FontAwesomeIcon icon={faUserMd} className="mr-2" />
            No Doctors Available
          </h1>
          <p className="text-gray-600 mb-6">
            There are no doctors registered in this clinic. Please add doctors before creating records.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#325747] text-white rounded-lg"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Go Back
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 p-4 md:p-8 bg-[#F6F4E8]" style={{ fontFamily: "'Laila', sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center mb-8"
        >
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[#325747]" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#325747] flex items-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mr-3"
              >
                <FontAwesomeIcon icon={faPaw} className="text-[#325747]" />
              </motion.div>
              Register Found Pet
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "180px", marginLeft: "40px" }}></div>
          </div>
        </motion.div>

        {/* Form Container */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <form onSubmit={handleSubmit}>
            {/* Doctor Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#325747] mb-4 flex items-center">
                <FontAwesomeIcon icon={faUserMd} className="mr-3 text-[#E59560]" />
                Attending Veterinarian
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor *</label>
                  <select
                    value={selectedDoctor}
                    onChange={handleDoctorChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    required
                  >
                    {doctors.map(doctor => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.name} ({doctor.specialization || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pet Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#325747] mb-6 flex items-center">
                <FontAwesomeIcon icon={faPaw} className="mr-3 text-[#E59560]" />
                Pet Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name (if known)</label>
                  <input
                    type="text"
                    name="name"
                    value={foundPet.name}
                    onChange={handleFoundPetChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    placeholder="Unknown"
                  />
                </div>

                {/* Species */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Species *</label>
                  <div className="relative">
                    <select
                      name="species"
                      value={foundPet.species}
                      onChange={handleFoundPetChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747] appearance-none"
                      required
                    >
                      <option value="">Select species</option>
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="bird">Bird</option>
                      <option value="rabbit">Rabbit</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FontAwesomeIcon 
                        icon={getSpeciesIcon(foundPet.species)} 
                        className={foundPet.species ? "text-[#325747]" : "text-gray-400"} 
                      />
                    </div>
                  </div>
                </div>

                {/* Breed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Breed (if known)</label>
                  <input
                    type="text"
                    name="breed"
                    value={foundPet.breed}
                    onChange={handleFoundPetChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                  />
                </div>

                {/* Estimated Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Age *</label>
                  <select
                    name="estimatedAge"
                    value={foundPet.estimatedAge}
                    onChange={handleFoundPetChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    required
                  >
                    <option value="">Select age range</option>
                    <option value="puppy/kitten">Puppy/Kitten (0-1 year)</option>
                    <option value="young">Young (1-3 years)</option>
                    <option value="adult">Adult (3-8 years)</option>
                    <option value="senior">Senior (8+ years)</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={foundPet.gender}
                      onChange={handleFoundPetChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747] appearance-none"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FontAwesomeIcon icon={faVenusMars} className="text-[#325747]" />
                    </div>
                  </div>
                </div>

                {/* Found Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Found Date *</label>
                  <input
                    type="date"
                    name="foundDate"
                    value={foundPet.foundDate}
                    onChange={handleFoundPetChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    required
                  />
                </div>

                {/* Distinguishing Features */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distinguishing Features</label>
                  <textarea
                    name="distinguishingFeatures"
                    value={foundPet.distinguishingFeatures}
                    onChange={handleFoundPetChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    placeholder="Color, markings, collar, etc."
                  />
                </div>

                {/* Found Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Found Location *</label>
                  <input
                    type="text"
                    name="foundLocation"
                    value={foundPet.foundLocation}
                    onChange={handleFoundPetChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    placeholder="Where the pet was found"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#325747] mb-6 flex items-center">
                <FontAwesomeIcon icon={faNotesMedical} className="mr-3 text-[#E59560]" />
                Medical Information
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Diagnosis</label>
                  <textarea
                    name="diagnosis"
                    value={medicalInfo.diagnosis}
                    onChange={handleMedicalInfoChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    placeholder="Initial health assessment"
                  />
                </div>

                {/* Treatment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Provided</label>
                  <textarea
                    name="treatment"
                    value={medicalInfo.treatment}
                    onChange={handleMedicalInfoChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    placeholder="Treatment administered"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={medicalInfo.notes}
                    onChange={handleMedicalInfoChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                    placeholder="Additional notes about the pet's condition"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-[#325747] text-white rounded-lg hover:bg-[#2a4a3a] flex items-center"
              >
                <FontAwesomeIcon icon={faPaw} className="mr-2" />
                Create Found Pet Record
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default FoundPetForm;
