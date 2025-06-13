import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faSearch, faPlus, 
  faClock, faUser, faPaw, faCheck, faTimes
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import DoctorHeader from './DoctorHeader';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    startDate: null,
    endDate: null,
    search: ''
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/doctor/appointments?';
        
        if (filter.status) url += `status=${filter.status}&`;
        if (filter.startDate) url += `startDate=${filter.startDate.toISOString()}&`;
        if (filter.endDate) url += `endDate=${filter.endDate.toISOString()}&`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let filteredData = response.data;
        if (filter.search) {
          const searchTerm = filter.search.toLowerCase();
          filteredData = filteredData.filter(appt => 
            (appt.pet_id?.name?.toLowerCase().includes(searchTerm)) ||
            (appt.externalPet?.name?.toLowerCase().includes(searchTerm)) ||
            (appt.pet_id?.owner_id?.fullName?.toLowerCase().includes(searchTerm)) ||
            (appt.externalPet?.ownerName?.toLowerCase().includes(searchTerm))
       )}
        
        setAppointments(filteredData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [filter]);

  const handleStatusChange = (appointmentId, status) => {
    const updateAppointment = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(
          `http://localhost:5000/api/doctor/appointments/${appointmentId}/status`,
          { status },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAppointments(appointments.map(appt => 
          appt._id === appointmentId ? { ...appt, status } : appt
        ));
      } catch (error) {
        console.error('Error updating appointment:', error);
      }
    };

    updateAppointment();
  };

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
    
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#325747] flex items-center">
             <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mr-3"
              >
                <FontAwesomeIcon icon={faCalendarAlt} className="text-[#325747]" />
              </motion.div>
              Appointments
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
          </div>
            <button 
            onClick={() => navigate('/doctor-appointments/new')}
            className="bg-[#E59560] text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            New Appointment
          </button>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">From Date</label>
              <DatePicker
                selected={filter.startDate}
                onChange={(date) => setFilter({...filter, startDate: date})}
                selectsStart
                startDate={filter.startDate}
                endDate={filter.endDate}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholderText="Select start date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">To Date</label>
              <DatePicker
                selected={filter.endDate}
                onChange={(date) => setFilter({...filter, endDate: date})}
                selectsEnd
                startDate={filter.startDate}
                endDate={filter.endDate}
                minDate={filter.startDate}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholderText="Select end date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pets or owners..."
                  value={filter.search}
                  onChange={(e) => setFilter({...filter, search: e.target.value})}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                />
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#325747]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Pet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No appointments found
                    </td>
                  </tr>
                ) : (
                  appointments.map(appointment => (
                    <tr 
                      key={appointment._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/doctor-appointments/${appointment._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#F6F4E8] flex items-center justify-center">
                            <FontAwesomeIcon icon={faPaw} className="text-[#E59560]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#325747]">
                              {appointment.pet_id?.name || appointment.externalPet?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.pet_id?.species || appointment.externalPet?.species}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#325747]">
                          {appointment.pet_id?.owner_id?.fullName || appointment.externalPet?.ownerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.pet_id?.owner_id?.phone || appointment.externalPet?.ownerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#325747]">
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <FontAwesomeIcon icon={faClock} className="mr-1" />
                          {appointment.Time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {appointment.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(appointment._id, 'accepted');
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(appointment._id, 'cancelled');
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;