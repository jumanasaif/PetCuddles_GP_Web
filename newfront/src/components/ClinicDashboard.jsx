import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHome,
  faCalendarAlt,
  faPaw,
  faBell,
  faPrescriptionBottleAlt,
  faUser,
  faSignOutAlt,
  faHospital,
  faChartLine,
  faNotesMedical,
  faMapMarkedAlt,
  faCog,
  faClock
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";


const VetDashboard = () => {
    const navigate = useNavigate();
    
    // Sample data
    const [appointments, setAppointments] = useState([
      { id: 1, petName: "Max", owner: "Sara Mohamed", type: "Annual Checkup", time: "10:00 AM", status: "confirmed" },
      { id: 2, petName: "Bella", owner: "Ahmed Hassan", type: "Vaccination", time: "11:30 AM", status: "pending" },
      { id: 3, petName: "Charlie", owner: "Lina Khalid", type: "Dental Cleaning", time: "2:00 PM", status: "confirmed" }
    ]);
  
    const [emergencies, setEmergencies] = useState([
      { id: 1, petName: "Luna", owner: "Omar Sami", symptom: "Difficulty breathing", time: "30 mins ago", priority: "high" },
      { id: 2, petName: "Rocky", owner: "Nadia Fawzi", symptom: "Broken leg", time: "1 hour ago", priority: "medium" }
    ]);
  
    const stats = [
      { title: "Today's Appointments", value: 8, icon: faCalendarAlt, color: "bg-blue-100 text-blue-600" },
      { title: "Active Patients", value: 142, icon: faPaw, color: "bg-green-100 text-green-600" },
      { title: "Pending Emergencies", value: 2, icon: faBell, color: "bg-red-100 text-red-600" },
      { title: "Prescriptions Due", value: 5, icon: faPrescriptionBottleAlt, color: "bg-purple-100 text-purple-600" }
    ];
  
    const handleConfirmAppointment = (id) => {
      setAppointments(appointments.map(appt => 
        appt.id === id ? {...appt, status: "confirmed"} : appt
      ));
    };
  
    const handleAcceptEmergency = (id) => {
      setEmergencies(emergencies.filter(emergency => emergency.id !== id));
      navigate(`/emergency-case/${id}`);
    };
  
    return (
      <div className="bg-[#f6f4e8] min-h-screen pt-20">
        
        <div className="container mx-auto px-6 py-8">
          {/* Welcome Banner */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-[#1d3124] mb-2">Welcome back, Dr. Ahmed!</h1>
            <p className="text-[#5a7a6a]">You have {appointments.length} appointments scheduled for today.</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 flex items-center">
                <div className={`rounded-full w-14 h-14 flex items-center justify-center ${stat.color} mr-4`}>
                  <FontAwesomeIcon icon={stat.icon} className="text-xl" />
                </div>
                <div>
                  <p className="text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#1d3124]">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-[#1d3124] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-3" />
                  Upcoming Appointments
                </h2>
                <a href="/vet-appointments" className="text-[#e59560] hover:underline">View All</a>
              </div>
              
              <div className="divide-y divide-gray-100">
                {appointments.map(appointment => (
                  <div key={appointment.id} className="p-6 hover:bg-[#fff8e8] transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-[#1d3124]">{appointment.petName}</h3>
                        <p className="text-gray-600">{appointment.type}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <FontAwesomeIcon icon={faUser} className="mr-1" />
                          {appointment.owner}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#1d3124]">{appointment.time}</p>
                        {appointment.status === "pending" ? (
                          <button 
                            onClick={() => handleConfirmAppointment(appointment.id)}
                            className="mt-2 bg-[#e59560] text-white px-3 py-1 rounded-md text-sm hover:bg-[#d48550] transition"
                          >
                            Confirm
                          </button>
                        ) : (
                          <span className="inline-block mt-2 bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                            Confirmed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Emergency Alerts */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-[#1d3124] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <FontAwesomeIcon icon={faBell} className="mr-3" />
                  Emergency Alerts
                </h2>
                <a href="/vet-emergencies" className="text-[#e59560] hover:underline">View All</a>
              </div>
              
              <div className="divide-y divide-gray-100">
                {emergencies.map(emergency => (
                  <div 
                    key={emergency.id} 
                    className={`p-6 transition ${emergency.priority === "high" ? "bg-red-50" : "bg-amber-50"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-[#1d3124]">{emergency.petName}</h3>
                        <p className="text-gray-600">{emergency.symptom}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <FontAwesomeIcon icon={faUser} className="mr-1" />
                          {emergency.owner} • {emergency.time}
                        </p>
                      </div>
                      <div>
                        <button 
                          onClick={() => handleAcceptEmergency(emergency.id)}
                          className="bg-[#e59560] text-white px-4 py-2 rounded-md hover:bg-[#d48550] transition flex items-center"
                        >
                          <FontAwesomeIcon icon={faNotesMedical} className="mr-2" />
                          Accept Case
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1d3124] mb-6">Quick Actions</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <a 
                href="/vet-add-patient" 
                className="border border-[#e59560] rounded-lg p-4 text-center hover:bg-[#fff8e8] transition"
              >
                <div className="bg-[#e59560] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faPaw} />
                </div>
                <p className="font-semibold text-[#1d3124]">Add New Patient</p>
              </a>
              
              <a 
                href="/vet-create-prescription" 
                className="border border-[#e59560] rounded-lg p-4 text-center hover:bg-[#fff8e8] transition"
              >
                <div className="bg-[#e59560] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faPrescriptionBottleAlt} />
                </div>
                <p className="font-semibold text-[#1d3124]">Create Prescription</p>
              </a>
              
              <a 
                href="/vet-schedule" 
                className="border border-[#e59560] rounded-lg p-4 text-center hover:bg-[#fff8e8] transition"
              >
                <div className="bg-[#e59560] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </div>
                <p className="font-semibold text-[#1d3124]">Manage Schedule</p>
              </a>
              
              <a 
                href="/vet-clinic-settings" 
                className="border border-[#e59560] rounded-lg p-4 text-center hover:bg-[#fff8e8] transition"
              >
                <div className="bg-[#e59560] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faCog} />
                </div>
                <p className="font-semibold text-[#1d3124]">Clinic Settings</p>
              </a>
   
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default VetDashboard;