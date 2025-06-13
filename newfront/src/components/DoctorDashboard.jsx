import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faUserMd, faFlask, 
  faFileMedicalAlt, faChartLine, faClock,
  faUser, faPaw, faBell, faNotesMedical,
  faPrescription, faVial, faStethoscope,
  faHistory, faTasks, faCalendarPlus,
  faClipboard, faMicroscope, faUserEdit
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import DoctorHeader from './DoctorHeader';
import { motion } from 'framer-motion';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingTests: 0,
    completedRecords: 0,
    upcomingAppointments: 0,
    recentPatients: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [profileRes, statsRes, todayAppointmentsRes, upcomingRes, patientsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/doctor/profile', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/doctor/stats', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/doctor/appointments/today', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/doctor/appointments/upcoming', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/doctor/patients/recent', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setDoctor(profileRes.data);
        setStats(statsRes.data);
        setTodayAppointments(todayAppointmentsRes.data);
        setUpcomingAppointments(upcomingRes.data);
        setRecentPatients(patientsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4E8] font-laila" style={{marginTop:"80px"}}>
      <DoctorHeader />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#325747] mb-2">
            Welcome, Dr. {doctor?.name}
          </h1>
          <p className="text-[#607169]">
            {doctor?.clinic?.clinicName} - {doctor?.clinic?.city}
          </p>
          <p className="text-sm text-[#607169] mt-1">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            Last login: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate('/doctor-appointments')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#607169]">Today's Appointments</p>
                <p className="text-3xl font-bold text-[#325747]">
                  {stats.todayAppointments}
                </p>
              </div>
              <div className="bg-[#E59560] bg-opacity-20 p-3 rounded-full">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-[#E59560] text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate('/doctor-lab-tests')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#607169]">Pending Lab Tests</p>
                <p className="text-3xl font-bold text-[#325747]">
                  {stats.pendingTests}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faFlask} className="text-blue-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate('/doctor-patients')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#607169]">Completed Records</p>
                <p className="text-3xl font-bold text-[#325747]">
                  {stats.completedRecords}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faFileMedicalAlt} className="text-green-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate('/doctor-appointments')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#607169]">Upcoming Appointments</p>
                <p className="text-3xl font-bold text-[#325747]">
                  {stats.upcomingAppointments}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faCalendarPlus} className="text-purple-600 text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate('/doctor-patients')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#607169]">Recent Patients</p>
                <p className="text-3xl font-bold text-[#325747]">
                  {stats.recentPatients}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faUser} className="text-amber-600 text-xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Today's Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Today's Appointments
              </h2>
              <button 
                onClick={() => navigate('/doctor-appointments')}
                className="text-[#E59560] hover:underline"
              >
                View All
              </button>
            </div>
            
            <div className="p-6">
              {todayAppointments.length === 0 ? (
                <p className="text-center py-4 text-[#607169]">No appointments scheduled for today</p>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.slice(0, 5).map(appointment => (
                    <motion.div 
                      key={appointment._id}
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-[#F6F4E8] cursor-pointer"
                      onClick={() => navigate(`/doctor-appointments/${appointment._id}`)}
                    >
                      <div>
                        <h3 className="font-bold text-[#325747]">
                          {appointment.pet_id?.name || appointment.externalPet?.name}
                        </h3>
                        <p className="text-sm text-[#607169]">
                          Owner: {appointment.pet_id?.owner_id?.fullName || appointment.externalPet?.ownerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#325747]">
                          {appointment.Time}
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-md text-sm ${
                          appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          appointment.status === "completed" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-[#E59560] text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
                Upcoming Appointments
              </h2>
              <button 
                onClick={() => navigate('/doctor-appointments')}
                className="text-white hover:underline"
              >
                View All
              </button>
            </div>
            
            <div className="p-6">
              {upcomingAppointments.length === 0 ? (
                <p className="text-center py-4 text-[#607169]">No upcoming appointments</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 5).map(appointment => (
                    <motion.div 
                      key={appointment._id}
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-[#F6F4E8] cursor-pointer"
                      onClick={() => navigate(`/doctor-appointments/${appointment._id}`)}
                    >
                      <div>
                        <h3 className="font-bold text-[#325747]">
                          {appointment.pet_id?.name || appointment.externalPet?.name}
                        </h3>
                        <p className="text-sm text-[#607169]">
                          {new Date(appointment.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#325747]">
                          {appointment.Time}
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-md text-sm ${
                          appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          appointment.status === "completed" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Recent Patients
            </h2>
            <button 
              onClick={() => navigate('/doctor-patients')}
              className="text-[#E59560] hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="p-6">
            {recentPatients.length === 0 ? (
              <p className="text-center py-4 text-[#607169]">No recent patients</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentPatients.slice(0, 5).map(patient => (
                  <motion.div 
                    key={patient._id}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-[#F6F4E8] cursor-pointer"
                    onClick={() => navigate(`/doctor-patients/${patient._id}`)}
                  >
                    <div className="w-16 h-16 rounded-full bg-[#E59560] flex items-center justify-center text-white text-2xl mb-3">
                      {patient.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-[#325747] text-center">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-[#607169] text-center">
                      {patient.species} • {patient.breed}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-4 mb-8">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/doctor-appointments/new')}
            className="bg-[#E59560] text-white p-4 rounded-2xl flex flex-col items-center hover:bg-[#d48550] transition"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="text-2xl mb-2" />
            <span>New Appointment</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/doctor-lab-tests/new')}
            className="bg-blue-600 text-white p-4 rounded-2xl flex flex-col items-center hover:bg-blue-700 transition"
          >
            <FontAwesomeIcon icon={faMicroscope} className="text-2xl mb-2" />
            <span>Register Lab Test Result</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/doctor-profile')}
            className="bg-gray-600 text-white p-4 rounded-2xl flex flex-col items-center hover:bg-gray-700 transition"
          >
            <FontAwesomeIcon icon={faUserEdit} className="text-2xl mb-2" />
            <span>My Profile</span>
          </motion.button>
        
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              Recent Activity
            </h2>
            <button 
              onClick={() => navigate('/doctor-activity')}
              className="text-[#E59560] hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start p-3 border-b border-gray-200">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <FontAwesomeIcon icon={faFileMedicalAlt} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[#325747]">Completed health record for <span className="font-semibold">Max</span></p>
                  <p className="text-sm text-[#607169]">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 border-b border-gray-200">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <FontAwesomeIcon icon={faFlask} className="text-green-600" />
                </div>
                <div>
                  <p className="text-[#325747]">Submitted lab results for <span className="font-semibold">Bella</span></p>
                  <p className="text-sm text-[#607169]">Yesterday</p>
                </div>
              </div>
              
              <div className="flex items-start p-3">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <FontAwesomeIcon icon={faPrescription} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-[#325747]">Prescribed medication for <span className="font-semibold">Rocky</span></p>
                  <p className="text-sm text-[#607169]">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;