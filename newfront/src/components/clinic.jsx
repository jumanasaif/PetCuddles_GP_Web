import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DoctorForm from "./VetaddDoctors";
import BgImage from "../assets/bg.png";
import { motion } from "framer-motion";
import { toast } from 'react-toastify';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCalendarAlt,
  faUserMd,
  faHandHoldingHeart,
  faPaw,
  faBell,
  faPrescriptionBottleAlt,
  faUser,
  faSignOutAlt,
  faHospital,
  faChartLine,
  faUsers,
  faCog,
  faPlus,
  faStethoscope,
  faClipboardList,
  faMapMarkerAlt,
  faClock,
  faFileMedical,
  faExclamationTriangle,
  faCommentDots,
  faStar,
  faEnvelope,
  faFirstAid,
  faPills,
  faUtensils,
  faDog,
  faMapMarkedAlt,
  faCamera,
  faMicrophone,
  faQrcode,
  faPhone,
  faCheckSquare
} from "@fortawesome/free-solid-svg-icons";

const VetDashboard = () => {
  const navigate = useNavigate();
  const [vetData, setVetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [appointments, setAppointments] = useState([
    { id: 1, doctor: "Dr. Ahmed", petName: "Max", owner: "Sara Mohamed", time: "10:00 AM", status: "confirmed" },
    { id: 2, doctor: "Dr. Sara", petName: "Bella", owner: "Ahmed Hassan", time: "11:30 AM", status: "pending" },
    { id: 3, doctor: "Dr. Sara", petName: "Rocky", owner: "Lina Khalil", time: "2:00 PM", status: "confirmed" }
  ]);
  const [emergencies, setEmergencies] = useState([
    { id: 1, petName: "Charlie", owner: "Mohammed Ali", type: "Accident", time: "30 mins ago", status: "pending" },
    { id: 2, petName: "Luna", owner: "Rana Sami", type: "Poisoning", time: "1 hour ago", status: "in-progress" }
  ]);

  // Fetch data
  useEffect(() => {
    const fetchVetData = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem('clinic'));
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          throw new Error('No user data or token found');
        }

        const response = await axios.get('http://localhost:5000/api/vet/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setVetData(response.data);
  
        const VetDoctors = await axios.get('http://localhost:5000/api/vet/doctors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDoctors(VetDoctors.data);

      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch clinic data');
        if (err.response?.status === 401) navigate('/vet-login');
      } finally {
        setLoading(false);
      }
    };

    fetchVetData();
  }, [navigate]);


  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setIsLoadingAppointments(true);
        const token = localStorage.getItem('token');
        const clinicId = JSON.parse(localStorage.getItem('clinic')).id;
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        const response = await axios.get(
          `http://localhost:5000/api/appointment/today?clinic_id=${clinicId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setTodayAppointments(response.data);
      } catch (err) {
        console.error('Error fetching today appointments:', err);
        toast.error('Failed to load today appointments');
      } finally {
        setIsLoadingAppointments(false);
      }
    };
  
    fetchTodayAppointments();
  }, []);


  const stats = [
  { title: "Active Doctors", value: doctors.length, icon: faUserMd, color: "bg-blue-100 text-blue-600" },
  { title: "Today's Appointments", value: todayAppointments.length, icon: faCalendarAlt, color: "bg-green-100 text-green-600" },
  { title: "Pending Emergencies", value: emergencies.filter(e => e.status === "pending").length, icon: faExclamationTriangle, color: "bg-red-100 text-red-600" },
  { title: "Registered Patients", value: 142, icon: faPaw, color: "bg-amber-100 text-amber-600" }
];


  const quickActions = [
    { title: "Add New Doctor", icon: faUserMd, link: "/vet-add-doctor", color: "bg-blue-100 text-blue-600" },
    { title: "Manage Services", icon: faClipboardList, link: "/clinic-service", color: "bg-amber-100 text-amber-600" }, 
    { title: "Active Care Pets",  icon: faPaw, link: "/clinic/temporary-care/pets/active", color: "bg-purple-100 text-purple-600" },
    { title: "View Health Records", icon: faFileMedical, link: "/health-records", color: "bg-green-100 text-green-600" },
    { title: "Check Emergencies", icon: faFirstAid, link: "/vet-emergencies", color: "bg-red-100 text-red-600" },
    { title: "Manage Clinic Profile", icon: faHospital, link: "/vet-clinic-profile", color: "bg-cyan-100 text-cyan-600" },
    { title: "View Reviews", icon: faStar, link: "/clinic/temporary-care/pets/active", color: "bg-yellow-100 text-yellow-600" },
    { title: "Messages", icon: faEnvelope, link: "/vet-messages", color: "bg-indigo-100 text-indigo-600" },
    { title: "Appointments", icon: faCalendarAlt, link: "/clinic-appointment", color: "bg-teal-100 text-teal-600" },
    { title: "Care Requests", icon: faHandHoldingHeart, link: "/clinic-care/requests", color: "bg-orange-100 text-orange-600" }
  ];

  // Helper functions
  const confirmAppointment = (id) => {
    setAppointments(appointments.map(app => 
      app.id === id ? {...app, status: "confirmed"} : app
    ));
  };

  const startEmergency = (id) => {
    setEmergencies(emergencies.map(em => 
      em.id === id ? {...em, status: "in-progress"} : em
    ));
  };

  // Format working hours
  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return [];
  
    const dayMap = {
      sunday: "Sun",
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
    };
  
    return Object.entries(workingHours).map(([day, info], idx) => (
      <div key={idx} className="flex justify-between py-1">
        <span className="font-medium text-[#325747]">{dayMap[day]}:</span>
        <span className="text-[#607169]">
          {info.closed ? 'Closed' : `${info.open} - ${info.close}`}
        </span>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-[#F6F4E8] pt-20" >

      {/* Header with welcome banner */}
    <div className="container mx-auto px-6 py-8">
      <div className="bg-[#325747] text-white rounded-xl p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-laila">Welcome, {vetData?.clinicName || 'Clinic'}</h1>
            <p className="text-[#BACEC1]">Manage your veterinary practice</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDoctorForm(true)}
            className="bg-[#E59560] text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add New Doctor
          </motion.button>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-6 font-laila">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-md p-6 flex items-center border border-[#BACEC1]"
            >
              <div className={`rounded-full w-14 h-14 flex items-center justify-center ${stat.color} mr-4`}>
                <FontAwesomeIcon icon={stat.icon} className="text-xl" />
              </div>
              <div>
                <p className="text-[#607169]">{stat.title}</p>
                <p className="text-2xl font-bold text-[#325747]">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Doctors section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-[#BACEC1]"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 font-laila">
                  <FontAwesomeIcon icon={faUserMd} />
                  Your Doctors
                </h2>
                <button className="text-[#E59560] hover:underline">View All</button>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.slice(0, 4).map(doctor => (
                  <div key={doctor._id} className="flex items-start gap-4 p-4 bg-[#F6F4E8] rounded-lg">
                    {doctor.profileImage && (
                      <img 
                        src={`http://localhost:5000${doctor.profileImage}`} 
                        alt={doctor.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#E59560]"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-[#325747]">
                        {doctor.name} ({doctor.gender === 'male' ? '♂' : '♀'})
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-[#607169] gap-2">
                        <FontAwesomeIcon icon={faStethoscope} />
                        <span>{doctor.specialty}</span>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-[#607169] gap-2">
                        <FontAwesomeIcon icon={faPhone} />
                        <span>{doctor.phone}</span>
                      </div>
                      <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                        doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                        doctor.status === 'on leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doctor.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Appointments section */}
            <motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="bg-white rounded-xl shadow-md overflow-hidden border border-[#BACEC1]"
>
  <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
    <h2 className="text-xl font-bold flex items-center gap-2 font-laila">
      <FontAwesomeIcon icon={faCalendarAlt} />
      Today's Appointments
    </h2>
    <button className="text-[#E59560] hover:underline">View All</button>
  </div>
  
  <div className="p-6 space-y-4">
    {isLoadingAppointments ? (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#325747]"></div>
      </div>
    ) : todayAppointments.length === 0 ? (
      <p className="text-center py-4 text-[#607169]">No appointments scheduled for today</p>
    ) : (
      todayAppointments.map(appointment => {
        const petName = appointment.petType === 'registered' 
          ? appointment.pet_id?.name 
          : appointment.externalPet?.name || 'Unknown Pet';
        
        const ownerName = appointment.petType === 'registered'
          ? appointment.pet_id.owner_id?.fullName
          : appointment.externalPet?.ownerName || 'Unknown Owner';
        
        return (
          <div key={appointment._id} className="flex justify-between items-center p-4 bg-[#F6F4E8] rounded-lg">
            <div>
              <h3 className="font-bold text-[#325747]">{petName}</h3>
              <div className="flex items-center mt-1 text-sm text-[#607169] gap-2">
                <FontAwesomeIcon icon={faUserMd} />
                <span>With {appointment.doctor_id?.name || 'Unknown Doctor'}</span>
              </div>
              <div className="flex items-center mt-1 text-sm text-[#607169] gap-2">
                <FontAwesomeIcon icon={faUser} />
                <span>Owner: {ownerName}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#325747]">
                {(appointment.Time) || "11:00"}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-md text-sm ${
                appointment.status === "pending" ? "bg-[#fff4e5] text-[#E59560]" :
                appointment.status === "completed" ? "bg-[#e1f0e8] text-[#2e8b57]" :
                "bg-gray-100 text-gray-800"
              }`}>
                {appointment.status}
              </span>
            </div>
          </div>
        );
      })
    )}
  </div>
</motion.div>

 <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-white rounded-xl shadow-md p-6 border border-[#BACEC1]"
  >
    <h2 className="text-xl font-bold text-[#325747] mb-4 font-laila">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-4">
      {quickActions.map((action, index) => (
        <motion.button
          key={index}
          whileHover={{ y: -3 }}
          className={`flex flex-col items-center p-4 rounded-lg ${action.color.replace('text', 'hover:text')} transition-all`}
          onClick={() => navigate(action.link)}
        >
          <div className="text-2xl mb-2">
            <FontAwesomeIcon icon={action.icon} />
          </div>
          <span className="text-center text-sm font-medium text-[#325747]">{action.title}</span>
        </motion.button>
      ))}
    </div>
  </motion.div>


          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* Emergency cases */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-[#BACEC1]"
            >
              <div className="bg-[#E59560] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 font-laila">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  Emergency Cases
                </h2>
                <button className="text-white hover:underline">View All</button>
              </div>
              
              <div className="p-6 space-y-4">
                {emergencies.map(emergency => (
                  <div key={emergency.id} className="p-4 bg-[#fff4e5] rounded-lg">
                    <h3 className="font-bold text-[#c0392b]">{emergency.petName}</h3>
                    <div className="flex items-center mt-1 text-sm text-[#607169] gap-2">
                      <FontAwesomeIcon icon={faUser} />
                      <span>Owner: {emergency.owner}</span>
                    </div>
                    <div className="flex items-center mt-1 text-sm text-[#607169] gap-2">
                      <FontAwesomeIcon icon={faFirstAid} />
                      <span>Type: {emergency.type}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-[#607169]">{emergency.time}</span>
                      {emergency.status === "pending" ? (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startEmergency(emergency.id)}
                          className="bg-[#ffe8cc] text-[#E59560] px-3 py-1 rounded-md text-sm"
                        >
                          Start Treatment
                        </motion.button>
                      ) : (
                        <span className="bg-[#fff4e5] text-[#E59560] px-3 py-1 rounded-md text-sm">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Clinic info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6 border border-[#BACEC1]"
            >
              <h2 className="text-xl font-bold text-[#325747] mb-4 font-laila">Clinic Information</h2>
              
              <div className="space-y-9">
                <div className="p-4 bg-[#F6F4E8] rounded-lg">
                  <h3 className="font-semibold text-[#325747] flex items-center gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    Location
                  </h3>
                  <p className="mt-1 text-[#607169]">{`${vetData?.village}, ${vetData?.city}` || '123 Veterinary Street, Nablus'}</p>
                  <button className="text-[#E59560] text-sm hover:underline mt-2">
                    View on Map
                  </button>
                </div>
                
                <div className="p-4 bg-[#F6F4E8] rounded-lg">
                  <h3 className="font-semibold text-[#325747] flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} />
                    Working Hours
                  </h3>
                  {vetData?.workingHours ? (
                    <div className="mt-2 space-y-1">
                      {formatWorkingHours(vetData.workingHours)}
                    </div>
                  ) : (
                    <p className="mt-1 text-[#607169]">Working hours not specified</p>
                  )}
                  <button className="text-[#E59560] text-sm hover:underline mt-2">
                    Edit Hours
                  </button>
                </div>
                
                <div className="p-4 bg-[#F6F4E8] rounded-lg">
                  <h3 className="font-semibold text-[#325747] flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} />
                    Clinic Team
                  </h3>
                  <p className="mt-1 text-[#607169]">{doctors.length} doctors</p>
                 
                  <button className="text-[#E59560] text-sm hover:underline mt-2">
                    Manage Team
                  </button>
                </div>
                <div className="p-4 bg-[#F6F4E8] rounded-lg">
                  <h3 className="font-semibold text-[#325747] flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckSquare} />
                    Support Temporary Care for pets
                  </h3>
                  <button className="text-[#E59560] text-sm hover:underline mt-2">
                    Manage Temporary Care
                  </button>
                </div>
              </div>
            </motion.div>


          </div>
        </div>
      </div>
</div>
      {/* Doctor Form Modal */}
      {showDoctorForm && (
        <DoctorForm 
          onClose={() => setShowDoctorForm(false)} 
          setDoctors={setDoctors} 
          doctors={doctors} 
        />
      )}
    </div>

  );
};

export default VetDashboard;