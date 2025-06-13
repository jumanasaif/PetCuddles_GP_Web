import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faCalendarAlt, faClock,faInfoCircle, faPlus,faUserMd, faPaw,
  faUser, faPhone, faEnvelope, faEllipsisV, faCheck,
  faTimes, faEdit, faPaperPlane, faFilter,faArrowLeft, faSync,faChevronUp,faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isBefore, isAfter } from 'date-fns';

const VetAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOwnerPopup, setShowOwnerPopup] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAppointmentForService, setSelectedAppointmentForService] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    doctor: 'all',
    petType: 'all'
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    doctor_id: '',
    reason: ''
  });
  const [cancelReason, setCancelReason] = useState('');
  const [expandedFilters, setExpandedFilters] = useState(false);

  const [doctors, setDoctors] = useState([]);

  const clinicData = JSON.parse(localStorage.getItem('clinic'));
  const clinicId = clinicData?.id;

  // Fetch appointments and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsRes, doctorsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/appointment?clinic=${clinicId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`http://localhost:5000/api/vet/doctors?clinic=${clinicId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        
        setAppointments(appointmentsRes.data);
        setFilteredAppointments(appointmentsRes.data);
        setDoctors(doctorsRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clinicId]);

  // Apply filters and search
  useEffect(() => {
    let result = [...appointments];

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(app => app.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.dateRange === 'today') {
        result = result.filter(app => {
          const appDate = new Date(app.date);
          return appDate.toDateString() === today.toDateString();
        });
      } else if (filters.dateRange === 'upcoming') {
        result = result.filter(app => {
          const appDate = new Date(app.date);
          return isAfter(appDate, today) || appDate.toDateString() === today.toDateString();
        });
      } else if (filters.dateRange === 'past') {
        result = result.filter(app => {
          const appDate = new Date(app.date);
          return isBefore(appDate, today) && appDate.toDateString() !== today.toDateString();
        });
      }
    }

    // Apply doctor filter
    if (filters.doctor !== 'all') {
      result = result.filter(app => app.doctor_id?._id === filters.doctor);
    }

    // Apply pet type filter
    if (filters.petType !== 'all') {
      result = result.filter(app => app.petType === filters.petType);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app => {
        // Get owner name from either direct owner_id or through pet_id
        const ownerName = app.owner_id?.fullName || 
                         (app.petType === 'registered' && app.pet_id?.owner_id?.fullName);
        
        if (app.petType === 'registered') {
          return (
            app.pet_id?.name?.toLowerCase().includes(term) ||
            (ownerName && ownerName.toLowerCase().includes(term)) ||
            app.pet_id?.species?.toLowerCase().includes(term) ||
            app.pet_id?.breed?.toLowerCase().includes(term)
          );
    }
    // Search in external pet info
    else {
      return (
        app.externalPet?.name?.toLowerCase().includes(term) ||
        app.externalPet?.ownerName?.toLowerCase().includes(term) ||
        app.externalPet?.ownerEmail?.toLowerCase().includes(term) ||
        app.externalPet?.ownerPhone?.toLowerCase().includes(term) ||
        app.externalPet?.species?.toLowerCase().includes(term)
      );
    }
  });
}
    setFilteredAppointments(result);
  }, [appointments, filters, searchTerm]);

  // Handle edit modal open
  const openEditModal = (appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      date: format(parseISO(appointment.date), 'yyyy-MM-dd'),
      time: appointment.Time,
      doctor_id: appointment.doctor_id?._id || '',
      reason: appointment.reason || ''
    });
    setShowEditModal(true);
  };

  // Handle cancel modal open
  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setShowCancelModal(true);
  };

 // Color palette
 const colors = {
  primary: '#325747',      // Dark green
  secondary: '#E59560',    // Terracotta
  background: '#F6F4E8',   // Cream
  accent: '#BACEC1',       // Soft green
  textDark: '#2D3748',
  textLight: '#4A5568'
};
const statusClasses = {
  pending_request: 'bg-purple-100 text-purple-800', // New status color
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800'
}
  // Handle form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit appointment update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/appointment/${selectedAppointment._id}`,
        {
          ...selectedAppointment,
          date: editForm.date,
          Time: editForm.time,
          doctor_id: editForm.doctor_id,
          reason: editForm.reason,
          updatedAt: new Date().toISOString()
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
  
      // Update state with the returned data
      setAppointments(prev => prev.map(app => 
        app._id === selectedAppointment._id ? response.data : app
      ));
      setFilteredAppointments(prev => prev.map(app => 
        app._id === selectedAppointment._id ? response.data : app
      ));
      
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating appointment');
    } finally {
      setActionLoading(false);
    }
  };
  

  // Submit appointment cancellation
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const cancelledAppointment = {
        ...selectedAppointment,
        status: 'cancelled',
        cancellationReason: cancelReason,
        updatedAt: new Date().toISOString()
      };

      await axios.put(
        `http://localhost:5000/api/appointment/${selectedAppointment._id}`,
        cancelledAppointment,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Send email notification
      await sendNotificationEmail(
        selectedAppointment,
        'cancellation',
        `Your appointment has been cancelled. Reason: ${cancelReason}`
      );

      // Update local state
      setAppointments(prev => prev.map(app => 
        app._id === selectedAppointment._id ? cancelledAppointment : app
      ));
      
      setShowCancelModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error cancelling appointment');
    }finally {
      setActionLoading(false);
    }
  };

  // Complete an appointment
  const handleCompleteAppointment = async (appointmentId) => {
    setActionLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/appointment/${appointmentId}`,
        { status: 'completed', updatedAt: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
  
      // Check if the response indicates success
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to complete appointment');
      }
  
      const { appointment: updatedAppointment, healthRecord } = response.data;
      
      // Update state with the returned data
      setAppointments(prev => prev.map(app => 
        app._id === appointmentId ? updatedAppointment : app
      ));
      setFilteredAppointments(prev => prev.map(app => 
        app._id === appointmentId ? updatedAppointment : app
      ));
      
      if (healthRecord) {
        const petName = updatedAppointment.petType === 'registered' 
          ? updatedAppointment.pet_id?.name 
          : updatedAppointment.externalPet?.name;
        
        toast.success(
          <div>
            New health record for {petName} created!
            <button 
              onClick={(e) => {
                e.preventDefault();
                navigate(`/health-records/${healthRecord._id}`);
              }}
              className="ml-2 text-blue-500 hover:underline"
            >
              Complete details now
            </button>
          </div>,
          {
            autoClose: 10000,
            closeOnClick: false,
            draggable: false,
          }
        );
      }
      
    } catch (err) {
      console.error('Error completing appointment:', err);
      toast.error(err.response?.data?.message || err.message || 'Error completing appointment');
    } finally {
      setActionLoading(false);
    }
  };

const handleAcceptAppointment = async (appointmentId) => {
  setActionLoading(true);
  try {
    const response = await axios.put(
      `http://localhost:5000/api/appointment/${appointmentId}`,
      { 
        status: 'pending', // Change status to 'pending'
        source: 'vet_added' // Also change the source to 'vet_added'
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
    );

    // Send acceptance email
    await sendNotificationEmail(
      response.data.appointment,
      'acceptance',
      'Your appointment request has been accepted and is now pending. We will confirm the details soon.'
    );

    // Update state
    setAppointments(prev => prev.map(app => 
      app._id === appointmentId ? response.data.appointment : app
    ));
    
    toast.success('Appointment request accepted! It is now in pending status.');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error accepting appointment');
  } finally {
    setActionLoading(false);
  }
};

const handleRejectAppointment = async (appointmentId) => {
  setActionLoading(true);
  try {
    await axios.delete(
      `http://localhost:5000/api/appointment/${appointmentId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
    );

    // Update state by removing the rejected appointment
    setAppointments(prev => prev.filter(app => app._id !== appointmentId));
    setFilteredAppointments(prev => prev.filter(app => app._id !== appointmentId));
    
    toast.success('Appointment request rejected and removed!');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error rejecting appointment');
  } finally {
    setActionLoading(false);
  }
};

  // Function to send email notifications
const sendNotificationEmail = async (appointment, type, message) => {
  try {
    let recipientEmail = '';
    let subject = '';
    let emailContent = '';
    let ownerid= null;
    if (appointment.petType === 'registered') {
      if (appointment.owner_id && typeof appointment.owner_id === 'object') {
        recipientEmail = appointment.owner_id?.email;
        subject = `Appointment ${type} for ${appointment.pet_id?.name}`;
        ownerid= appointment.owner_id._id;
        emailContent = `
          <p>Dear ${appointment.owner_id?.fullName},</p>
          <p>${message}</p>
          ${type === 'rejection' ? 
            '<p>Please contact the clinic to reschedule or for more information.</p>' : 
            '<p>We look forward to seeing you!</p>'}
        `;
      } 
    } else {
      recipientEmail = appointment.externalPet?.ownerEmail;
      subject = `Appointment ${type} for ${appointment.externalPet?.name}`;
      emailContent = `
        <p>Dear ${appointment.externalPet?.ownerName},</p>
        <p>${message}</p>
        ${type === 'rejection' ? 
          '<p>Please contact the clinic to reschedule or for more information.</p>' : 
          '<p>We look forward to seeing you!</p>'}
      `;
    }

    if (!recipientEmail) return;

    await axios.post('http://localhost:5000/api/appointment/send-email', {
      to: recipientEmail,
      subject: subject,
      ownerid,
      text: message,
      html: emailContent
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  } catch (err) {
    console.error('Error sending email:', err);
  }
};
const handleApproveReschedule = async (appointmentId, requestId) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `http://localhost:5000/api/appointment/${appointmentId}/approve-reschedule/${requestId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Refresh appointments
    const response = await axios.get(`http://localhost:5000/api/appointment?clinic=${clinicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAppointments(response.data);
    setFilteredAppointments(response.data);
    
    toast.success('Reschedule approved! The owner has been notified.');
  } catch (error) {
    console.error('Error approving reschedule:', error);
    toast.error('Failed to approve reschedule');
  }
};

const handleRejectReschedule = async (appointmentId, requestId) => {
  const reason = prompt('Please enter a reason for rejecting this reschedule request:');
  if (!reason) return;
  
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `http://localhost:5000/api/appointment/${appointmentId}/reject-reschedule/${requestId}`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Refresh appointments
    const response = await axios.get(`http://localhost:5000/api/appointment?clinic=${clinicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAppointments(response.data);
    setFilteredAppointments(response.data);
    
    toast.success('Reschedule rejected. The owner has been notified.');
  } catch (error) {
    console.error('Error rejecting reschedule:', error);
    toast.error('Failed to reject reschedule');
  }
};


  const OwnerInfoPopup = () => {
    if (!showOwnerPopup || !ownerInfo) return null;
  
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowOwnerPopup(false)}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Owner Information</h3>
            <button 
              onClick={() => setShowOwnerPopup(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Full Name:</span>
              <p>{ownerInfo.fullName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p>{ownerInfo.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Phone:</span>
              <p>{ownerInfo.phone}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const ServiceDetailsModal = () => {
    if (!showServiceDetails || !selectedService) return null;
  
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowServiceDetails(false)}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              Service Details for {selectedAppointmentForService?.petType === 'registered' 
                ? selectedAppointmentForService.pet_id?.name 
                : selectedAppointmentForService.externalPet?.name}
            </h3>
            <button 
              onClick={() => setShowServiceDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Service Type:</span>
              <p>{selectedService.service_details?.type || 'N/A'}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Sub-Service:</span>
              <p>{selectedService.service_details?.sub_service?.name || 'N/A'}</p>
            </div>
            
            {selectedService.service_details?.extra_service && (
              <div>
                <span className="text-sm font-medium text-gray-500">Extra Service:</span>
                <p>{selectedService.service_details.extra_service.name}</p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <span className="text-sm font-medium text-gray-500">Cost Breakdown:</span>
              <div className="mt-2 space-y-2">
                {selectedService.service_details?.sub_service && (
                  <div className="flex justify-between">
                    <span>Base Service:</span>
                    <span>${selectedService.service_details.sub_service.baseCost || 0}</span>
                  </div>
                )}
                {selectedService.service_details?.extra_service && (
                  <div className="flex justify-between">
                    <span>Extra Service:</span>
                    <span>${selectedService.service_details.extra_service.cost || 0}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Cost:</span>
                  <span>${selectedService.cost}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <span className="text-sm font-medium text-gray-500">Appointment Date:</span>
              <p>
                {format(parseISO(selectedAppointmentForService.date), 'MMM dd, yyyy')} at {formatTime(selectedAppointmentForService.Time)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Status badge component
const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
        {error}
      </div>
    );
  }

  const vetAddedAppointments = filteredAppointments.filter(app => app.source === 'vet_added');
  const ownerAddedAppointments = filteredAppointments.filter(app => app.source === 'owner');


  return (
    <div 
      className="container mx-auto px-4 py-8 min-h-screen"
      style={{ backgroundColor: colors.background, fontFamily: "'Laila', sans-serif" ,marginTop:"80px"}}
    >
       
       
{/* Header with animated gradient */}
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="mb-8 flex justify-between items-center"
>
  <div>
    <h1 className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>
      Appointment Management
    </h1>
    <div className="h-1 w-20 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
  </div>
  
  <button 
    onClick={() => navigate("/clinic-appointment")} 
    className="text-[#325747] hover:text-[#E59560] flex items-center gap-2"
  >
    <FontAwesomeIcon icon={faPlus} size="lg" />
    Add New Appointment
  </button>
</motion.div>
      
      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
      >
        <div className="flex flex-col gap-6">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by pet name, owner name, or species..."
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
              style={{ 
                focusRingColor: colors.primary,
                borderColor: colors.accent 
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Main Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                Status
              </label>
              <select
  className="w-full p-2 border rounded-lg focus:ring-2 focus:outline-none transition-all"
  style={{ 
    borderColor: colors.accent,
    focusRingColor: colors.primary 
  }}
  value={filters.status}
  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
>
  <option value="all">All Statuses</option>
  <option value="pending_request">Pending Request</option>
  <option value="pending">Pending</option>
  <option value="accepted">Accepted</option>
  <option value="completed">Completed</option>
  <option value="cancelled">Cancelled</option>
  <option value="rejected">Rejected</option>
</select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                Date Range
              </label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: colors.accent,
                  focusRingColor: colors.primary 
                }}
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                Doctor
              </label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: colors.accent,
                  focusRingColor: colors.primary 
                }}
                value={filters.doctor}
                onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
              >
                <option value="all">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                Pet Type
              </label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: colors.accent,
                  focusRingColor: colors.primary 
                }}
                value={filters.petType}
                onChange={(e) => setFilters({ ...filters, petType: e.target.value })}
              >
                <option value="all">All Pet Types</option>
                <option value="registered">Registered Pets</option>
                <option value="external">External Pets</option>
              </select>
            </div>
          </div>
          
          {/* Advanced Filters Toggle */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setExpandedFilters(!expandedFilters)}
              className="flex items-center text-sm font-medium"
              style={{ color: colors.primary }}
            >
              {expandedFilters ? (
                <>
                  <FontAwesomeIcon icon={faChevronUp} className="mr-2" />
                  Hide Advanced Filters
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faChevronDown} className="mr-2" />
                  Show Advanced Filters
                </>
              )}
            </button>
            
            <button
              onClick={() => setFilters({
                status: 'all',
                dateRange: 'all',
                doctor: 'all',
                petType: 'all'
              })}
              className="flex items-center text-sm p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: colors.textDark }}
            >
              <FontAwesomeIcon icon={faSync} className="mr-2" />
              Reset Filters
            </button>
          </div>
          
          {/* Expanded Filters (can add more here) */}
          <AnimatePresence>
            {expandedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {/* Add additional advanced filters here */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                      Emergency Only
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      style={{ borderColor: colors.accent }}
                    >
                      <option value="all">All Appointments</option>
                      <option value="emergency">Emergency Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                      Service Type
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      style={{ borderColor: colors.accent }}
                    >
                      <option value="all">All Services</option>
                      <option value="consultation">Consultation</option>
                      <option value="surgery">Surgery</option>
                      <option value="vaccination">Vaccination</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Appointments List */}
      {/* Appointments List */}
      
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.4 }}
  className="space-y-12"
>
  {/* Owner-Added Appointments Section */}
  <div>
    <motion.h2 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-2xl font-bold mb-6 flex items-center"
    >
      <FontAwesomeIcon icon={faUser} className="mr-3 text-purple-600" />
       Owner appointment requests
      <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
        {ownerAddedAppointments.length}
      </span>
    </motion.h2>
    
    {ownerAddedAppointments.length === 0 ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-8 text-center rounded-xl shadow-lg"
        style={{ color: colors.textLight }}
      >
        <FontAwesomeIcon icon={faInfoCircle} className="text-4xl mb-4" style={{ color: colors.accent }} />
        <h3 className="text-xl font-medium mb-2">No owner appointment requests found</h3>
        <p>Try adjusting your search or filters</p>
      </motion.div>
    ) : (
      <div className="space-y-6">
        {ownerAddedAppointments.map((appointment, index) => (
          <motion.div
            key={appointment._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-6 hover:bg-gray-50 transition-colors duration-200 rounded-xl shadow-lg border-l-4 border-purple-500"
          >               
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Pet Info with Avatar */}
              <div className="flex items-start gap-4 flex-1">
                <div className="relative">
                  {appointment.petType === 'registered' && appointment.pet_id?.img_url ? (
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      src={appointment.pet_id.img_url} 
                      alt={appointment.pet_id.name}
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ borderColor: colors.accent }}
                    />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${appointment.petType === 'registered' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}
                      style={{ borderColor: colors.accent }}
                    >
                      <FontAwesomeIcon 
                        icon={appointment.petType === 'registered' ? faPaw : faUser} 
                        className="text-2xl" 
                      />
                    </motion.div>
                  )}
                  {appointment.isEmergency && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <span className="text-xs font-bold">!</span>
                    </motion.div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold" style={{ color: colors.primary }}>
                      {appointment.petType === 'registered' 
                        ? appointment.pet_id?.name 
                        : appointment.externalPet?.name}
                    </h2>
                    <StatusBadge status={appointment.status} />
                  </div>
                  
                  <p className="text-sm mb-3" style={{ color: colors.textLight }}>
                    {appointment.petType === 'registered' 
                      ? `${appointment.pet_id?.species} • ${appointment.pet_id?.breed}`
                      : `${appointment.externalPet?.species} • ${appointment.externalPet?.breed || 'Unknown breed'}`}
                  </p>
                  
                  {/* Appointment Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-sm" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="text-sm font-medium">
                          {format(parseISO(appointment.date), 'MMM dd, yyyy')} at {formatTime(appointment.Time)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                        <FontAwesomeIcon icon={faUserMd} className="text-sm" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Veterinarian</p>
                        <p className="text-sm font-medium">
                          {appointment.doctor_id?.name 
                            ? `Dr. ${appointment.doctor_id.name}`
                            : 'Not assigned'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                        <FontAwesomeIcon 
                          icon={appointment.petType === 'registered' ? faUser : faPhone} 
                          className="text-sm" 
                          style={{ color: colors.primary }} 
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Owner</p>
                        <button 
                          onClick={() => {
                            if (appointment.petType === 'registered') {
                              setOwnerInfo({
                                fullName: appointment.owner_id?.fullName || 'Not available',
                                email: appointment.owner_id?.email || 'Not available',
                                phone: appointment.owner_id?.phone || 'Not available'
                              });
                            } else {
                              setOwnerInfo({
                                fullName: appointment.externalPet?.ownerName || 'Not available',
                                email: appointment.externalPet?.ownerEmail || 'Not available',
                                phone: appointment.externalPet?.ownerPhone || 'Not available'
                              });
                            }
                            setShowOwnerPopup(true);
                          }}
                          className="text-sm font-medium hover:underline"
                          style={{ color: colors.primary }}
                        >
                          {appointment.petType === 'registered'
                            ? (appointment.owner_id?.fullName || 'Owner not available')
                            : (appointment.externalPet?.ownerName || 'Owner not available')}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  {appointment.reason && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Reason for Visit</p>
                      <p className="text-sm" style={{ color: colors.textDark }}>
                        {appointment.reason}
                      </p>
                    </div>
                  )}
                  
                  {/* Services */}
                  {appointment.services?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {appointment.services.map((service, idx) => (
                          <motion.span
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedService(service);
                              setSelectedAppointmentForService(appointment);
                              setShowServiceDetails(true);
                            }}
                            className="text-xs rounded-full px-3 py-1 cursor-pointer flex items-center gap-1"
                            style={{ 
                              backgroundColor: colors.accent,
                              color: colors.primary
                            }}
                          >
                            {service.service_details?.type}: {service.service_details?.sub_service?.name}
                            {service.service_details?.extra_service?.name && ` + ${service.service_details.extra_service.name}`}
                            <span className="font-bold">${service.cost}</span>
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Reschedule Requests */}
{appointment.rescheduleRequests?.length > 0 && (
  <div className="mt-4 border-t pt-3">
    <h4 className="text-sm font-medium text-gray-500 mb-2">Reschedule Requests:</h4>
    {appointment.rescheduleRequests.map((request) => (
      <div 
        key={request._id} 
        className={`p-3 mb-2 rounded-lg ${
          request.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
          request.status === 'approved' ? 'bg-green-50 border border-green-200' :
          'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">
              Requested: {format(new Date(request.requestedDate), 'MMM d, yyyy')} at {request.requestedTime}
            </p>
            {request.reason && <p className="text-sm mt-1">Reason: {request.reason}</p>}
            <p className="text-xs mt-1">
              Status: {request.status} • {format(new Date(request.requestedAt), 'MMM d, h:mm a')}
            </p>
          </div>
          
          {request.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleApproveReschedule(appointment._id, request._id)}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => handleRejectReschedule(appointment._id, request._id)}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
)}
              
              {/* Action Buttons - Owner-Added Specific */}
              <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[200px] mt-4">
                {appointment.status === 'pending_request' && (
                  <>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAcceptAppointment(appointment._id)}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                        actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                      }`}
                      style={{ backgroundColor: '#3B82F6', color: 'white' }}
                    >
                      {actionLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheck} />
                          Accept
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRejectAppointment(appointment._id)}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                        actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                      }`}
                      style={{ backgroundColor: '#8B5CF6', color: 'white' }}
                    >
                      {actionLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTimes} />
                          Reject
                        </>
                      )}
                    </motion.button>
                  </>
                )}
                
                {appointment.status === 'completed' && (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/health-records/${appointment._id}`)}
                    className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-md"
                    style={{ backgroundColor: colors.textDark, color: 'white' }}
                  >
                    <FontAwesomeIcon icon={faInfoCircle} />
                    View Details
                  </motion.button>
                )}
                
                {appointment.status === 'cancelled' && (
                  <div className="text-sm p-2 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                    <p className="font-medium">Cancelled:</p>
                    <p>{appointment.cancellationReason}</p>
                  </div>
                )}
             
                
                {appointment.status === 'rejected' && (
                  <div className="text-sm p-2 rounded-lg" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8' }}>
                    <p className="font-medium">Rejected by clinic</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
  
  {/* Vet-Added Appointments Section */}
  <div>
    <motion.h2 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-2xl font-bold mb-6 flex items-center"
    >
      <FontAwesomeIcon icon={faUserMd} className="mr-3 text-blue-600" />
      Vet-Added Appointments
      <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
        {vetAddedAppointments.length}
      </span>
    </motion.h2>
    
    {vetAddedAppointments.length === 0 ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-8 text-center rounded-xl shadow-lg"
        style={{ color: colors.textLight }}
      >
        <FontAwesomeIcon icon={faInfoCircle} className="text-4xl mb-4" style={{ color: colors.accent }} />
        <h3 className="text-xl font-medium mb-2">No vet-added appointments found</h3>
        <p>Try adjusting your search or filters</p>
      </motion.div>
    ) : (
      <div className="space-y-6">
        {vetAddedAppointments.map((appointment, index) => (
          <motion.div
            key={appointment._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-6 hover:bg-gray-50 transition-colors duration-200 rounded-xl shadow-lg border-l-4 border-blue-500"
          >               
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Pet Info with Avatar */}
              <div className="flex items-start gap-4 flex-1">
                <div className="relative">
                  {appointment.petType === 'registered' && appointment.pet_id?.img_url ? (
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      src={appointment.pet_id.img_url} 
                      alt={appointment.pet_id.name}
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ borderColor: colors.accent }}
                    />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${appointment.petType === 'registered' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}
                      style={{ borderColor: colors.accent }}
                    >
                      <FontAwesomeIcon 
                        icon={appointment.petType === 'registered' ? faPaw : faUser} 
                        className="text-2xl" 
                      />
                    </motion.div>
                  )}
                  {appointment.isEmergency && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <span className="text-xs font-bold">!</span>
                    </motion.div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold" style={{ color: colors.primary }}>
                      {appointment.petType === 'registered' 
                        ? appointment.pet_id?.name 
                        : appointment.externalPet?.name}
                    </h2>
                    <StatusBadge status={appointment.status} />
                  </div>
                  
                  <p className="text-sm mb-3" style={{ color: colors.textLight }}>
                    {appointment.petType === 'registered' 
                      ? `${appointment.pet_id?.species} • ${appointment.pet_id?.breed}`
                      : `${appointment.externalPet?.species} • ${appointment.externalPet?.breed || 'Unknown breed'}`}
                  </p>
                  
                  {/* Appointment Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-sm" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="text-sm font-medium">
                          {format(parseISO(appointment.date), 'MMM dd, yyyy')} at {formatTime(appointment.Time)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                        <FontAwesomeIcon icon={faUserMd} className="text-sm" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Veterinarian</p>
                        <p className="text-sm font-medium">
                          {appointment.doctor_id?.name 
                            ? `Dr. ${appointment.doctor_id.name}`
                            : 'Not assigned'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                        <FontAwesomeIcon 
                          icon={appointment.petType === 'registered' ? faUser : faPhone} 
                          className="text-sm" 
                          style={{ color: colors.primary }} 
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Owner</p>
                        <button 
                          onClick={() => {
                            if (appointment.petType === 'registered') {
                              setOwnerInfo({
                                fullName: appointment.owner_id?.fullName || 'Not available',
                                email: appointment.owner_id?.email || 'Not available',
                                phone: appointment.owner_id?.phone || 'Not available'
                              });
                            } else {
                              setOwnerInfo({
                                fullName: appointment.externalPet?.ownerName || 'Not available',
                                email: appointment.externalPet?.ownerEmail || 'Not available',
                                phone: appointment.externalPet?.ownerPhone || 'Not available'
                              });
                            }
                            setShowOwnerPopup(true);
                          }}
                          className="text-sm font-medium hover:underline"
                          style={{ color: colors.primary }}
                        >
                          {appointment.petType === 'registered'
                            ? (appointment.owner_id?.fullName || 'Owner not available')
                            : (appointment.externalPet?.ownerName || 'Owner not available')}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  {appointment.reason && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Reason for Visit</p>
                      <p className="text-sm" style={{ color: colors.textDark }}>
                        {appointment.reason}
                      </p>
                    </div>
                  )}
                  
                  {/* Services */}
                  {appointment.services?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {appointment.services.map((service, idx) => (
                          <motion.span
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedService(service);
                              setSelectedAppointmentForService(appointment);
                              setShowServiceDetails(true);
                            }}
                            className="text-xs rounded-full px-3 py-1 cursor-pointer flex items-center gap-1"
                            style={{ 
                              backgroundColor: colors.accent,
                              color: colors.primary
                            }}
                          >
                            {service.service_details?.type}: {service.service_details?.sub_service?.name}
                            {service.service_details?.extra_service?.name && ` + ${service.service_details.extra_service.name}`}
                            <span className="font-bold">${service.cost}</span>
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Reschedule Requests */}
{appointment.rescheduleRequests?.length > 0 && (
  <div className="mt-4 border-t pt-3">
    <h4 className="text-sm font-medium text-gray-500 mb-2">Reschedule Requests:</h4>
    {appointment.rescheduleRequests.map((request) => (
      <div 
        key={request._id} 
        className={`p-3 mb-2 rounded-lg ${
          request.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
          request.status === 'approved' ? 'bg-green-50 border border-green-200' :
          'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">
              Requested: {format(new Date(request.requestedDate), 'MMM d, yyyy')} at {request.requestedTime}
            </p>
            {request.reason && <p className="text-sm mt-1">Reason: {request.reason}</p>}
            <p className="text-xs mt-1">
              Status: {request.status} • {format(new Date(request.requestedAt), 'MMM d, h:mm a')}
            </p>
          </div>
          
          {request.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleApproveReschedule(appointment._id, request._id)}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => handleRejectReschedule(appointment._id, request._id)}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
)}
              {/* Action Buttons - Vet-Added Specific */}
              <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[200px] mt-4">
                 {appointment.status === 'pending' && (
              <>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openEditModal(appointment)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                      {actionLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faEdit} />
                          Edit
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openCancelModal(appointment)}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                        actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                      }`}
                      style={{ backgroundColor: '#EF4444', color: 'white' }}
                    >
                      {actionLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTimes} />
                          Cancel
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCompleteAppointment(appointment._id)}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                        actionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                      }`}
                      style={{ backgroundColor: '#10B981', color: 'white' }}
                    >
                      {actionLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheck} />
                          Complete
                        </>
                      )}
                    </motion.button>
                  </>
                )}
                
                {appointment.status === 'completed' && (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/health-records/${appointment._id}`)}
                    className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-md"
                    style={{ backgroundColor: colors.textDark, color: 'white' }}
                  >
                    <FontAwesomeIcon icon={faInfoCircle} />
                    View Details
                  </motion.button>
                )}
                
                {appointment.status === 'cancelled' && (
                  <div className="text-sm p-2 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                    <p className="font-medium">Cancelled:</p>
                    <p>{appointment.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
</motion.div>
      
      {/* Edit Appointment Modal */}
      <AnimatePresence>
        {showEditModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>Edit Appointment</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <form onSubmit={handleUpdateSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>Date</label>
                      <input
                        type="date"
                        name="date"
                        value={editForm.date}
                        onChange={handleEditChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                        style={{ 
                          borderColor: colors.accent,
                          focusRingColor: colors.primary 
                        }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>Time</label>
                      <input
                        type="time"
                        name="time"
                        value={editForm.time}
                        onChange={handleEditChange}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                        style={{ 
                          borderColor: colors.accent,
                          focusRingColor: colors.primary 
                        }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>Doctor</label>
                      <select
                        name="doctor_id"
                        value={editForm.doctor_id}
                        onChange={handleEditChange}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                        style={{ 
                          borderColor: colors.accent,
                          focusRingColor: colors.primary 
                        }}
                      >
                        <option value="">Select doctor</option>
                        {doctors.map(doctor => (
                          <option key={doctor._id} value={doctor._id}>
                            Dr. {doctor.name} ({doctor.specialty})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                        Reason for Change
                      </label>
                      <textarea
                        name="reason"
                        value={editForm.reason}
                        onChange={handleEditChange}
                        rows={3}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                        style={{ 
                          borderColor: colors.accent,
                          focusRingColor: colors.primary 
                        }}
                        placeholder="Explain why this appointment needs to be rescheduled..."
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                      style={{ borderColor: colors.accent }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-all"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Send Update
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cancel Appointment Modal */}
      <AnimatePresence>
        {showCancelModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold" style={{ color: '#B91C1C' }}>Cancel Appointment</h2>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <p className="mb-4 text-gray-600">
                  Are you sure you want to cancel this appointment? The pet owner will be notified.
                </p>
                
                <form onSubmit={handleCancelSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                      Reason for Cancellation
                    </label>
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                      style={{ 
                        borderColor: colors.accent,
                        focusRingColor: colors.primary 
                      }}
                      required
                    >
                      <option value="">Select a reason</option>
                      <option value="owner_request">Owner Request</option>
                      <option value="clinic_request">Clinic Request</option>
                      <option value="doctor_unavailable">Doctor Unavailable</option>
                      <option value="emergency_closure">Emergency Closure</option>
                      <option value="other">Other</option>
                    </select>
                    
                    {cancelReason === 'other' && (
                      <textarea
                        className="w-full p-3 border rounded-lg mt-2 focus:ring-2 focus:outline-none transition-all"
                        style={{ 
                          borderColor: colors.accent,
                          focusRingColor: colors.primary 
                        }}
                        placeholder="Please specify the reason..."
                        rows={3}
                        required
                      />
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <motion.button
                      type="button"
                      onClick={() => setShowCancelModal(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                      style={{ borderColor: colors.accent }}
                    >
                      Go Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg text-white transition-all"
                      style={{ backgroundColor: '#B91C1C' }}
                    >
                      Confirm Cancellation
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Service Details Modal */}
      <AnimatePresence>
        {showServiceDetails && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowServiceDetails(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold" style={{ color: colors.primary }}>
                    Service Details
                  </h3>
                  <button 
                    onClick={() => setShowServiceDetails(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                      <FontAwesomeIcon icon={faPaw} style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pet Name</p>
                      <p className="font-medium">
                        {selectedAppointmentForService?.petType === 'registered' 
                          ? selectedAppointmentForService.pet_id?.name 
                          : selectedAppointmentForService.externalPet?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Service Type</p>
                      <p className="font-medium">
                        {selectedService.service_details?.type || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Sub-Service</p>
                      <p className="font-medium">
                        {selectedService.service_details?.sub_service?.name || 'N/A'}
                      </p>
                    </div>
                    
                    {selectedService.service_details?.extra_service && (
                      <div>
                        <p className="text-sm text-gray-500">Extra Service</p>
                        <p className="font-medium">
                          {selectedService.service_details.extra_service.name}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">Cost Breakdown</p>
                    <div className="space-y-2">
                      {selectedService.service_details?.sub_service && (
                        <div className="flex justify-between">
                          <span>Base Service:</span>
                          <span>${selectedService.service_details.sub_service.baseCost || 0}</span>
                        </div>
                      )}
                      {selectedService.service_details?.extra_service && (
                        <div className="flex justify-between">
                          <span>Extra Service:</span>
                          <span>${selectedService.service_details.extra_service.cost || 0}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total Cost:</span>
                        <span>${selectedService.cost}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-sm text-gray-500">Appointment Date</p>
                    <p className="font-medium">
                      {format(parseISO(selectedAppointmentForService.date), 'MMM dd, yyyy')} at {formatTime(selectedAppointmentForService.Time)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Owner Info Popup */}
      <AnimatePresence>
        {showOwnerPopup && ownerInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowOwnerPopup(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ color: colors.primary }}>Owner Information</h3>
                <button 
                  onClick={() => setShowOwnerPopup(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                    <FontAwesomeIcon icon={faUser} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{ownerInfo.fullName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                    <FontAwesomeIcon icon={faEnvelope} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{ownerInfo.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full" style={{ backgroundColor: colors.accent }}>
                    <FontAwesomeIcon icon={faPhone} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{ownerInfo.phone}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ServiceDetailsModal />
      <OwnerInfoPopup />
    </div>
  );
};

export default VetAppointments;
