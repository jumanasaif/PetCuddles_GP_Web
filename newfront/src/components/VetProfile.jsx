import React, { useState,useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useChat } from './ChatProvider';
import {
  faMapMarkerAlt,
  faClock,
  faStethoscope,
  faSyringe,
  faUserMd,
  faStar,
  faCalendarAlt,
  faPhone,
  faEnvelope,
  faCommentDots,
  faHome,
  faHandHoldingHeart,
  faCamera
} from '@fortawesome/free-solid-svg-icons';
import ReactStars from 'react-stars';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'react-toastify'; 
import 'leaflet/dist/leaflet.css';
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerChildren = {
    visible: { transition: { staggerChildren: 0.1 } }
  };



 const VetProfile = ({ clinic }) => {
  const {
    profileImage = '',
    clinicName = '',
    city = '',
    village = '',
    services = [],
    doctors = [],
    workingHours = {},
  } = clinic;

  const [activeTab, setActiveTab] = useState('services');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const navigate = useNavigate();
  const { clinicId } = useParams();
  const { startChat } = useChat();
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef(null);

  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('user')); // Assuming you store user data like this
  const isPetOwner = currentUser?.role === 'pet_owner';
  const isVetOwner = JSON.parse(localStorage.getItem('clinic'));;


   const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => {
    if (isVetOwner) {
      fileInputRef.current.click();
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/vet/profile-image', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile image updated successfully');
        // Update the clinic data with the new image
        clinic.profileImage = data.profileImage;
        setPreviewImage('');
        setSelectedFile(null);
      } else {
        toast.error(data.message || 'Failed to update profile image');
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error('Error:', error);
    }
  };

  const handleStartChat = async () => {
    const chatId = await startChat(clinicId, 'Clinic');
    if (chatId) {
      navigate('/chat');
    }
  };

    const handleStartDoctorChat = async (doctorId) => {
    const chatId = await startChat(doctorId, 'Doctor');
    if (chatId) {
      navigate('/chat');
    }
  };


 const handleBookAppointment = () => {
  navigate(`/book-appointment/${clinicId}`); 
};


  const handleSubmitReview = () => {
    toast.success(`Submitted ${rating} star review: ${review}`);
    setRating(0);
    setReview('');
  };

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila" style={{marginTop:"80px"}}>
      {/* Clinic Header with Action Buttons */}
       <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8 relative"
      >
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative">
            <motion.img
              whileHover={{ scale: isVetOwner ? 1.05 : 1 }}
              src={`http://localhost:5000${clinic.profileImage}`}
              alt={clinic.clinicName}
              className="w-32 h-32 rounded-full object-cover border-4 border-[#BACEC1] cursor-pointer"
              onClick={handleImageClick}
            />       
            {isVetOwner && (
              <div className="absolute bottom-0 right-0 bg-[#E59560] text-white p-1 rounded-full cursor-pointer w-10 h-10">
                <FontAwesomeIcon icon={faCamera}className='ml-2 mt-2' />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          {/* Add the upload button when a file is selected */}
          {selectedFile && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUploadImage}
              className="px-4 py-2 bg-[#325747] text-white rounded-lg absolute top-6 right-6"
            >
              Save Image
            </motion.button>
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#325747] mb-2">{clinic.clinicName}</h1>
            {clinic.temporaryCareSettings?.providesTemporaryCare && (
             <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
               className="inline-flex items-center bg-[#325747] text-white px-3 py-1 rounded-full mb-4"
            >
               <FontAwesomeIcon icon={faHome} className="mr-2" />
               <span>Temporary Pet Care Available</span>
              <span>{clinic.temporaryCareSettings.maxPetsCapacity} spots available</span>

             </motion.div>
             
           )}
            <div className="flex items-center gap-2 text-[#E59560] mb-2">
              <ReactStars
                count={5}
                value={4.5}
                size={24}
                color2={'#E59560'}
                edit={false}
              />
              <span className="font-medium">4.9 (128 reviews)</span>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-[#325747]">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>{`${clinic.village ? clinic.village + ', ' : ''}${clinic.city}`}</span>
              </div>
              <div className="flex items-center gap-2 text-[#325747]">
                <FontAwesomeIcon icon={faPhone} />
                <span>{clinic.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[#325747]">
                <FontAwesomeIcon icon={faEnvelope} />
                <span>{clinic.email}</span>
              </div>
            </div>
            
            {/* Action Buttons - Only show for pet owners */}
            {isPetOwner && (
              <div className="flex flex-wrap gap-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBookAppointment}
                  className="px-6 py-3 bg-[#325747] text-white rounded-lg flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  Book Appointment
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartChat}
                  className="px-6 py-3 bg-[#E59560] text-white rounded-lg flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCommentDots} />
                  Start Chat
                </motion.button>
                  
               <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/vet-temporary-care/request`)}
                  className="px-6 py-3 bg-[#325747] text-white rounded-lg flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faHandHoldingHeart} />
                   Request Temporary Care
              </motion.button>
            </div>
            )}
          </div>
          
          {/* Review Form - Only show for pet owners */}
          {isPetOwner && (
            <motion.div 
              className="w-full md:w-1/3 bg-[#F6F4E8] p-4 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="text-lg font-semibold text-[#325747] mb-2">Rate this clinic</h3>
              <ReactStars
                count={5}
                value={rating}
                size={24}
                color2={'#E59560'}
                onChange={(newRating) => setRating(newRating)}
              />
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                className="w-full mt-2 p-2 border border-[#BACEC1] rounded-lg"
                rows="3"
              />
              <button
                onClick={handleSubmitReview}
                className="mt-2 px-4 py-2 bg-[#325747] text-white rounded-lg"
              >
                Submit Review
              </button>
      
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        className="flex justify-center mb-8 gap-4 flex-wrap"
      >
        {['services', 'doctors', 'temporary-care', 'hours', 'map'].map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-[#325747] text-white'
                : 'bg-[#BACEC1] text-[#325747] hover:bg-[#A5BDB3]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      {/* Content Sections */}
      <div className="space-y-8">
        {activeTab === 'services' && (
          <ServiceSection services={clinic.services} />
        )}

    

        {activeTab === 'doctors' && (
          <DoctorsSection doctors={clinic.doctors} onStartChat={handleStartDoctorChat} />
        )}

        {activeTab === 'hours' && (
          <WorkingHoursSection workingHours={clinic.workingHours} />
        )}

        {activeTab === 'temporary-care' && clinic.temporaryCareSettings?.providesTemporaryCare && (
            <TemporaryCareSection settings={clinic.temporaryCareSettings} />
         )}

        {activeTab === 'map' && clinic.coordinates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
            style={{ height: '400px' }}
          >
            <MapContainer
              center={[clinic.coordinates.lat, clinic.coordinates.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[clinic.coordinates.lat, clinic.coordinates.lng]}>
                 
                <Popup>{clinic.clinicName}</Popup>
              </Marker>
            </MapContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
};
// Service Section Component
const ServiceSection = ({ services }) => (
  <motion.div
    variants={fadeIn}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  >
    {services.map((service) => (
      <div
        key={service._id}
        className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-[#E59560] text-white">
            <FontAwesomeIcon icon={serviceIcons[service.type]} size="lg" />
          </div>
          <h3 className="text-xl font-semibold text-[#325747]">
            {service.type.replace(/_/g, ' ').toUpperCase()}
          </h3>
        </div>
        
        <div className="space-y-3">
          {service.subServices.map((sub, idx) => (
            <div key={idx} className="border-l-4 border-[#BACEC1] pl-3">
              <h4 className="font-medium text-[#325747]">{sub.name}</h4>
              {sub.extraServices.length > 0 && (
                <div className="text-sm text-[#607169] mt-1">
                  Extras: {sub.extraServices.map(e => e.name).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ))}
  </motion.div>
);



// Doctors Section Component
const DoctorsSection = ({ doctors, onStartChat }) => (
  <motion.div
    variants={fadeIn}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  >
    {doctors.map((doctor) => (
      <div
        key={doctor._id}
        className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-4 mb-4">
          <img
            src={`http://localhost:5000${doctor.profileImage}`} 
            alt={doctor.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#E59560]"
          />
          <div>
            <h3 className="text-xl font-semibold text-[#325747]">{doctor.name}</h3>
            <p className="text-[#607169]">{doctor.specialty}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#607169]">
          <FontAwesomeIcon icon={faPhone} />
          <span>{doctor.phone}</span>
        </div>
        <button
          className="flex items-center gap-2 text-[#607169]"
          onClick={() => onStartChat(doctor._id)}
        >
          <FontAwesomeIcon icon={faCommentDots} />
          Chat with Doctor
        </button>
      </div>
    ))}
  </motion.div>
);


// Working Hours Component
const WorkingHoursSection = ({ workingHours }) => {
  const days = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday'
  ];

  return (
    <motion.div
      variants={fadeIn}
      className="bg-white rounded-xl shadow-md p-6"
    >
      <h2 className="text-2xl font-bold text-[#325747] mb-6">Working Hours</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {days.map((day) => (
          <div
            key={day}
            className="p-3 rounded-lg bg-[#F6F4E8] border border-[#BACEC1]"
          >
            <h3 className="font-medium text-[#325747] capitalize">{day}</h3>
            {workingHours[day].closed ? (
              <p className="text-[#607169]">Closed</p>
            ) : (
              <p className="text-[#607169]">
                {workingHours[day].open} - {workingHours[day].close}
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const TemporaryCareSection = ({ settings }) => (
  <motion.div
    variants={fadeIn}
    className="bg-white rounded-xl shadow-md p-6"
  >
    <h2 className="text-2xl font-bold text-[#325747] mb-6 flex items-center">
      <FontAwesomeIcon icon={faHome} className="mr-3 text-[#E59560]" />
      Temporary Pet Care
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 bg-[#F6F4E8] rounded-lg">
          <h3 className="font-semibold text-[#325747] mb-2">Capacity & Pricing</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Max Pets:</span> {settings.maxPetsCapacity}</p>
            <p><span className="font-medium">Daily Rate:</span> ${settings.dailyRatePerPet}</p>
            <p><span className="font-medium">Description:</span> {settings.description}</p>
          </div>
        </div>
        
        <div className="p-4 bg-[#F6F4E8] rounded-lg">
          <h3 className="font-semibold text-[#325747] mb-2">Facilities</h3>
          <div className="flex flex-wrap gap-2">
            {settings.facilities.map((facility, index) => (
              <span 
                key={index}
                className="bg-white px-3 py-1 rounded-full text-sm"
              >
                {facility}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-[#F6F4E8] rounded-lg">
        <h3 className="font-semibold text-[#325747] mb-4">How It Works</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Submit a request with your pet's details</li>
          <li>Vet reviews and approves the request</li>
          <li>Drop off your pet at the scheduled time</li>
          <li>Pick up your pet when the care period ends</li>
        </ol>
        
      
      </div>
    </div>
  </motion.div>
);


// Service icons mapping
const serviceIcons = {
  checkup: faStethoscope,
  vaccination: faSyringe,
  emergency: faCalendarAlt,
  surgery: faUserMd,
  grooming: faStar,
  dental: faStar,
  follow_up: faCalendarAlt,
  laboratory_test: faStethoscope,
  diagnostic: faStethoscope
};

export default VetProfile;
