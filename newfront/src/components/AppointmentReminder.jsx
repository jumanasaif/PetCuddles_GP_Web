import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faMapMarkerAlt, 
  faUserMd, 
  faCheckCircle,
  faTimesCircle,
  faCalendarPlus,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faStethoscope,
  faSyringe,
  faNotesMedical,
  faClipboardCheck,
  faCalendarCheck,
  faPaw,
  faList
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import VetCalendar from './VetCalendar ';
import { toast } from 'react-toastify';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth, 
  isSameDay, 
  startOfWeek,
  endOfWeek,
  isToday,
  isAfter,
  isBefore,
  isPast,
  isFuture
} from 'date-fns';
import { IoTodaySharp } from "react-icons/io5";

const AppointmentCalendar = ({ appointments, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Enhanced color scheme
  const colors = {
    primary: '#325747',
    secondary: '#E59560',
    background: '#F6F4E8',
    accent: '#BACEC1',
    today: '#4C9AFF',
    past: '#DFE1E6',
    future: '#F4F5F7',
    completed: '#36B37E',
    canceled: '#FF5630',
    upcoming: '#FFAB00',
    inProgress: '#6554C0',
    single: '#F6F4E8',
    multiple: '#EFDFD6',
    text: '#172B4D',
    textLight: '#5E6C84'
  };

  // Get appointments for a specific day
  const getDayAppointments = (day) => {
    return appointments.filter(appt => {
      const apptDate = appt.date instanceof Date ? appt.date : new Date(appt.date);
      return isSameDay(apptDate, day);
    });
  };

  // Get status icon and color
  const getStatusIcon = (status) => {
    if (!status) return { icon: faCalendarCheck, color: colors.textLight };
    
    switch(status.toLowerCase()) {
      case 'completed': return { icon: faCheckCircle, color: colors.completed };
      case 'canceled': 
      case 'cancelled': return { icon: faTimesCircle, color: colors.canceled };
      case 'upcoming':
      case 'pending': return { icon: faCalendarPlus, color: colors.upcoming };
      case 'in-progress': return { icon: faSpinner, color: colors.inProgress };
      case 'past': return { icon: faCalendarCheck, color: colors.past };
      default: return { icon: faCalendarCheck, color: colors.textLight };
    }
  };

  // Get day style based on appointments
const getDayStyle = (day) => {
  const dayAppointments = getDayAppointments(day);
  const count = dayAppointments.length;
  const isPastDate = isPast(day) && !isToday(day);
  const isFutureDate = isFuture(day) && !isToday(day);

  if (!isSameMonth(day, currentMonth)) return 'text-gray-300';

  if (isToday(day)) return 'bg-[#d6ddda] white border-2 border-[#325747] text-[#325747]';

  if (isPastDate) return 'bg-gray-200 text-gray-500';

  // Future dates with appointments
  if (isFutureDate) {
    if (count === 1) return 'bg-[#F6F4E8] text-[#325747]'; // Using your cream color
    if (count > 1) return 'bg-[#EFDFD6] text-[#325747]'; // Using your light terracotta
  }

  // Future dates without appointments
  if (isFutureDate && count === 0) return 'bg-gray-100 text-gray-400';

  return 'bg-white hover:bg-gray-100 text-gray-900';
};
  // Get icon for appointment type
  const getAppointmentIcon = (appointment) => {
    if (appointment.reason?.toLowerCase().includes('vaccin')) return faSyringe;
    if (appointment.reason?.toLowerCase().includes('check') || 
        appointment.reason?.toLowerCase().includes('exam')) return faStethoscope;
    if (appointment.services?.some(s => s.service_details?.type === 'consultation')) return faNotesMedical;
    return faClipboardCheck;
  };

  // Handle date selection
  const handleDateClick = (day) => {
    setSelectedDate(day);
    onDateSelect(day);
  };

  // Navigation functions
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 text-[#325747]"
        >
          <FontAwesomeIcon icon={faChevronLeft} size="lg" />
        </button>
        <h2 className="text-2xl font-bold text-[#325747]">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 text-[#325747]"
        >
          <FontAwesomeIcon icon={faChevronRight} size="lg" />
        </button>
      </div>
      
      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-[#325747]">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((day, i) => {
          const dayAppointments = getDayAppointments(day);
          const count = dayAppointments.length;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const hasAppointments = count > 0;
          
          // Get unique statuses from day's appointments
          const statuses = hasAppointments 
            ? [...new Set(dayAppointments.map(a => a.status))].filter(Boolean)
            : [];
          
          return (
            <div 
              key={i}
              onClick={() => handleDateClick(day)}
              className={`relative h-24 p-1 rounded-lg cursor-pointer transition-all duration-200 ${getDayStyle(day)} ${
                !isCurrentMonth ? 'opacity-50' : ''
              } ${
                selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-[#E59560]' : ''
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="text-sm font-medium self-end">
                  {format(day, 'd')}
                </div>
                
                {/* Appointment indicators */}
                <div className="mt-1 flex-grow overflow-hidden">
                  {dayAppointments.slice(0, 2).map((appt, idx) => {
                    const statusIcon = getStatusIcon(appt.status);
                    return (
                      <div key={idx} className="flex items-center mb-1">
                        <FontAwesomeIcon 
                          icon={getAppointmentIcon(appt)} 
                          className="text-xs mr-1" 
                        />
                        <span className="text-xs truncate">
                          {appt.Time}
                        </span>
                       
                      </div>
                    );
                  })}
                  {count > 2 && (
                    <div className="text-xs">+{count - 2} more</div>
                  )}
                </div>
              </div>
              
              {/* Today indicator - ribbon style */}
              {isToday(day) && (
                <div className="absolute bottom-1 right-1 ">
                  <IoTodaySharp 
                   className="text-xl" 
                  />
               </div>
              )}
              
              {/* Status indicators for the day */}
              {statuses.length > 0 && (
                <div className="absolute bottom-1 right-1 flex space-x-1">
                  {statuses.slice(0, 2).map((status, idx) => {
                    const statusIcon = getStatusIcon(status);
                    return (
                      <FontAwesomeIcon 
                        key={idx}
                        icon={statusIcon.icon} 
                        className="text-xl" 
                        style={{ color: statusIcon.color }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-[#325747] mb-4">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {getDayAppointments(selectedDate).length > 0 ? (
            <div className="space-y-4">
              {getDayAppointments(selectedDate).map(appointment => {
                const statusIcon = getStatusIcon(appointment.status);
                return (
                  <motion.div
                    key={appointment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#F6F4E8] p-4 rounded-lg border-l-4"
                    style={{ borderLeftColor: statusIcon.color }}
                  >
                    <div className="flex items-start">
                      <div 
                        className="p-3 rounded-full bg-[#325747] text-white mr-4"
                        style={{ backgroundColor: statusIcon.color }}
                      >
                        <FontAwesomeIcon icon={getAppointmentIcon(appointment)} size="lg" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-[#325747]">
                            {appointment.pet_id?.name || appointment.externalPet?.name}'s Appointment
                          </h4>
                          <span 
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ 
                              backgroundColor: `${statusIcon.color}20`,
                              color: statusIcon.color
                            }}
                          >
                            {appointment.status || 'Scheduled'}
                          </span>
                        </div>
                        <div className="text-sm text-[#607169] mt-1">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faClock} className="mr-2" />
                            {appointment.Time} - {appointment.expectedEndTime}
                          </div>
                          <div className="flex items-center mt-1">
                            <FontAwesomeIcon icon={faUserMd} className="mr-2" />
                            Dr. {appointment.doctor_id?.name || 'Not assigned'}
                          </div>
                          <div className="flex items-center mt-1">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                            {appointment.clinic_id?.clinicName || 'Clinic'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {appointment.reason && (
                      <div className="mt-3 text-sm">
                        <span className="font-semibold">Reason:</span> {appointment.reason}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-[#607169]">
              <p>No appointments scheduled for this day</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};



const AppointmentReminder = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [rescheduleData, setRescheduleData] = useState({
    appointmentId: null,
    showModal: false,
    newDate: '',
    newTime: '',
    reason: '',
    loading: false
  });
  const [clinicData, setClinicData] = useState(null);
  const [workingHours, setWorkingHours] = useState(null);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

  // Fetch appointments for the logged-in pet owner
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch appointments
        const appointmentsRes = await axios.get('http://localhost:5000/api/appointment/owner', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if(appointmentsRes.data.length === 0){

        }
        setAppointments(appointmentsRes.data);
        
        // If there are upcoming appointments, fetch clinic data for the first one
        if (appointmentsRes.data.length > 0) {
          const firstAppointment = appointmentsRes.data.find(a => a.status === 'pending');
          if (firstAppointment) {
            fetchClinicData(firstAppointment.clinic_id);
          }
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch clinic data when preparing to reschedule
  const fetchClinicData = async (clinicId) => {
    try {
      const token = localStorage.getItem('token');
      
      const [clinicRes, workingHoursRes, appointmentsRes, doctorsRes, servicesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/vet/public-profile/${clinicId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/vet/${clinicId}/working-hours`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/appointment/${clinicId}/calendar-appointments`, {
          params: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
          },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/vet/${clinicId}/doctors`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/vet/${clinicId}/services`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setClinicData(clinicRes.data);
      setWorkingHours(workingHoursRes.data.workingHours);
      setCalendarAppointments(appointmentsRes.data.appointments);
      setDoctors(doctorsRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching clinic data:', error);
    }
  };

   const upcomingAppointments = appointments.filter(app => 
    app.status === 'pending' && 
    app.reminders?.dayBeforeSent === true
  );

  const canceledAppointments = appointments.filter(app => app.status === 'cancelled');
  const completedAppointments = appointments.filter(app => app.status === 'completed');


  // Handle appointment confirmation
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointment/${appointmentId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setAppointments(appointments.map(app => 
        app._id === appointmentId ? { ...app, status: 'pending' } : app
      ));
      
      toast.success('Appointment confirmed! The clinic has been notified.');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Failed to confirm appointment');
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointment/${appointmentId}/cancel`,
        { cancellationReason: 'canceled by the owner' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setAppointments(appointments.map(app => 
        app._id === appointmentId ? { ...app, status: 'cancelled' } : app
      ));
      
      toast.success('Appointment canceled. The clinic has been notified.');
    } catch (error) {
      console.error('Error canceling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  // Handle reschedule request
  const handleRescheduleRequest = async (appointmentId) => {
    try {
      const appointment = appointments.find(a => a._id === appointmentId);
      if (!appointment) return;
      
      // Fetch clinic data if not already loaded
      if (!clinicData || clinicData._id !== appointment.clinic_id?._id) {
        await fetchClinicData(appointment.clinic_id?._id);
      }
      
      setRescheduleData({
        ...rescheduleData,
        appointmentId,
        showModal: true,
        newDate: appointment.date,
        newTime: appointment.Time,
        reason: ''
      });
    } catch (error) {
      console.error('Error preparing reschedule:', error);
      toast.error('Failed to prepare reschedule request');
    }
  };

  // Submit reschedule request
  const submitRescheduleRequest = async () => {
    try {
      setRescheduleData(prev => ({ ...prev, loading: true }));
      
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/appointment/${rescheduleData.appointmentId}/request-reschedule`,
        {
          newDate: rescheduleData.newDate,
          newTime: rescheduleData.newTime,
          reason: rescheduleData.reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Reschedule request submitted. The clinic will review your request.');
      setRescheduleData({
        appointmentId: null,
        showModal: false,
        newDate: '',
        newTime: '',
        reason: '',
        loading: false
      });
      
      // Refresh appointments
      const response = await axios.get('http://localhost:5000/api/appointment/owner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error submitting reschedule:', error);
      toast.error('Failed to submit reschedule request');
      setRescheduleData(prev => ({ ...prev, loading: false }));
    }
  };

  // Format date and time for display
  const formatDateTime = (dateString, timeString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return `${date.toLocaleDateString(undefined, options)} at ${timeString}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila" style={{ marginTop: '80px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#325747]">My Appointments</h1>
          <button
            onClick={() => setShowCalendarView(!showCalendarView)}
            className="px-4 py-2 bg-[#325747] text-white rounded-lg flex items-center gap-2"
          >
            <FontAwesomeIcon icon={showCalendarView ? faCalendarAlt : faList} />
            {showCalendarView ? 'Show List View' : 'Show Calendar View'}
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-[#BACEC1] mb-6">
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'upcoming' ? 'text-[#E59560] border-b-2 border-[#E59560]' : 'text-[#607169]'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'completed' ? 'text-[#E59560] border-b-2 border-[#E59560]' : 'text-[#607169]'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedAppointments.length})
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'canceled' ? 'text-[#E59560] border-b-2 border-[#E59560]' : 'text-[#607169]'}`}
            onClick={() => setActiveTab('canceled')}
          >
            Canceled ({canceledAppointments.length})
          </button>
        </div>
        
        {/* Content based on active tab */}
         {showCalendarView ? (
          <AppointmentCalendar 
            appointments={appointments.filter(app => 
              activeTab === 'upcoming' ? app.status === 'pending' :
              activeTab === 'completed' ? app.status === 'completed' :
              app.status === 'cancelled'
            )}
            onDateSelect={(date) => console.log('Date selected:', date)}
          />
        ) : (
         <>
            {activeTab === 'upcoming' && (
              <div className="space-y-6">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-12 text-[#607169]">
                    <p className="text-xl">No upcoming appointments</p>
                    <p>Book an appointment to see it here</p>
                  </div>
                ) : (
              upcomingAppointments.map((appointment) => (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Appointment Info */}
                    <div className="col-span-2">
                      <h2 className="text-xl font-bold text-[#325747] mb-2">
                        {appointment.pet_id?.name || appointment.externalPet?.name}'s Appointment
                      </h2>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[#607169]">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          <span>{formatDateTime(appointment.date, appointment.Time)}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[#607169]">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          <span>{appointment.clinic_id?.clinicName || 'Clinic'}</span>
                        </div>
                        
                        {appointment.doctor_id && (
                          <div className="flex items-center gap-3 text-[#607169]">
                            <FontAwesomeIcon icon={faUserMd} />
                            <span>Dr. {appointment.doctor_id.name}</span>
                          </div>
                        )}
                        
                        {appointment.reason && (
                          <div className="flex items-start gap-3 text-[#607169]">
                            <FontAwesomeIcon icon={faPaw} className="mt-1" />
                            <span>Reason: {appointment.reason}</span>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3 text-[#607169]">
                          <FontAwesomeIcon icon={faClock} className="mt-1" />
                          <span>Expected duration: {appointment.Time} - {appointment.expectedEndTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConfirmAppointment(appointment._id)}
                        className="px-4 py-2 bg-[#325747] text-white rounded-lg flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Confirm Attendance
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRescheduleRequest(appointment._id)}
                        className="px-4 py-2 bg-[#E59560] text-white rounded-lg flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faCalendarPlus} />
                        Reschedule
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCancelAppointment(appointment._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faTimesCircle} />
                        Cancel Appointment
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'completed' && (
          <div className="space-y-6">
            {completedAppointments.length === 0 ? (
              <div className="text-center py-12 text-[#607169]">
                <p className="text-xl">No completed appointments</p>
              </div>
            ) : (
              completedAppointments.map((appointment) => (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-3">
                      <h2 className="text-xl font-bold text-[#325747] mb-2">
                        {appointment.pet_id?.name || appointment.externalPet?.name}'s Completed Appointment
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-[#607169]">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{formatDateTime(appointment.date, appointment.Time)}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[#607169]">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <span>{appointment.clinic_id?.clinicName || 'Clinic'}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {appointment.doctor_id && (
                            <div className="flex items-center gap-3 text-[#607169]">
                              <FontAwesomeIcon icon={faUserMd} />
                              <span>Dr. {appointment.doctor_id.name}</span>
                            </div>
                          )}
                          
                          {appointment.reason && (
                            <div className="flex items-start gap-3 text-[#607169]">
                              <FontAwesomeIcon icon={faPaw} className="mt-1" />
                              <span>Reason: {appointment.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'canceled' && (
          <div className="space-y-6">
            {canceledAppointments.length === 0 ? (
              <div className="text-center py-12 text-[#607169]">
                <p className="text-xl">No canceled appointments</p>
              </div>
            ) : (
              canceledAppointments.map((appointment) => (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-3">
                      <h2 className="text-xl font-bold text-[#325747] mb-2">
                        {appointment.pet_id?.name || appointment.externalPet?.name}'s Canceled Appointment
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-[#607169]">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{formatDateTime(appointment.date, appointment.Time)}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[#607169]">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <span>{appointment.clinic_id?.clinicName || 'Clinic'}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {appointment.doctor_id && (
                            <div className="flex items-center gap-3 text-[#607169]">
                              <FontAwesomeIcon icon={faUserMd} />
                              <span>Dr. {appointment.doctor_id.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3 text-[#607169]">
                            <FontAwesomeIcon icon={faTimesCircle} className="mt-1 text-[#E59560]" />
                            <span>Cancel reason: {appointment.cancellationReason}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </>
        )}
        {/* Reschedule Modal */}
        {rescheduleData.showModal && (
            
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-[#325747] mb-4">Reschedule Appointment</h2>
              
              {clinicData && workingHours && (
              <>
             {(() => {
               const appointment = appointments.find(app => app._id === rescheduleData.appointmentId);
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-[#325747]">Select New Date & Time</h3>
                    <VetCalendar
                      appointments={calendarAppointments}
                      workingHours={workingHours}
                      selectedServices={appointment?.services || []}
                      selectedDoctor={appointment?.doctor_id?._id}
                      doctors={doctors}
                      onDateSelect={(date) => setRescheduleData(prev => ({
                        ...prev,
                        newDate: format(date, 'yyyy-MM-dd')
                      }))}
                      onTimeSelect={(time) => setRescheduleData(prev => ({
                        ...prev,
                        newTime: format(time, 'HH:mm')
                      }))}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-[#325747]">Reschedule Details</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#325747] mb-1">Current Appointment</label>
                      <div className="p-3 bg-[#F6F4E8] rounded-lg">
                        {appointment && (
                          <>
                            <p className="font-medium">
                              {formatDateTime(appointment.date, appointment.Time)}
                            </p>
                            <p className="text-sm">
                              {appointment.clinic_id?.clinicName || 'Clinic'} • Dr. {appointment.doctor_id?.name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#325747] mb-1">New Date & Time</label>
                      <div className="p-3 bg-[#F6F4E8] rounded-lg">
                        {rescheduleData.newDate && rescheduleData.newTime ? (
                          <p className="font-medium">
                            {formatDateTime(rescheduleData.newDate, rescheduleData.newTime)}
                          </p>
                        ) : (
                          <p className="text-[#BACEC1]">Select a new date and time</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#325747] mb-1">Reason for Reschedule</label>
                      <textarea
                        value={rescheduleData.reason}
                        onChange={(e) => setRescheduleData(prev => ({
                          ...prev,
                          reason: e.target.value
                        }))}
                        className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                        placeholder="Please explain why you need to reschedule..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setRescheduleData(prev => ({ ...prev, showModal: false }))}
                        className="px-4 py-2 border border-[#BACEC1] rounded-lg text-[#325747] hover:bg-[#F6F4E8]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitRescheduleRequest}
                        disabled={!rescheduleData.newDate || !rescheduleData.newTime || rescheduleData.loading}
                        className={`px-4 py-2 rounded-lg flex items-center justify-center ${
                          !rescheduleData.newDate || !rescheduleData.newTime || rescheduleData.loading
                            ? 'bg-[#BACEC1] cursor-not-allowed'
                            : 'bg-[#325747] hover:bg-[#1e3a2b] text-white'
                        }`}
                      >
                        {rescheduleData.loading ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                            Submitting...
                          </>
                        ) : (
                          'Request Reschedule'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                 );
          })()}
        </>
            )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentReminder;