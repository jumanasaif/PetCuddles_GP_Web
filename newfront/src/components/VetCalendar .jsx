import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, parseISO, getHours, getMinutes, addMinutes, isWithinInterval,
  startOfWeek, endOfWeek } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

const VetCalendar = ({ appointments = [], workingHours, onDateSelect, onTimeSelect, selectedServices, selectedDoctor,doctors }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [manualTime, setManualTime] = useState('');
  const [expectedEndTime, setExpectedEndTime] = useState('');
  const [busySlots, setBusySlots] = useState([]);
  const [availabilityError, setAvailabilityError] = useState('');

  // Generate days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  console.log("Appointments data:", appointments);
 console.log("Doctors data:", doctors);
 console.log("Selected doctor:", selectedDoctor);


  // Calculate total duration from selected services
  const calculateTotalDuration = () => {
    if (!selectedServices || selectedServices.length === 0) return 0;
    
    let totalDuration = 0;
    selectedServices.forEach(service => {
      // Add base duration (assuming service has duration property)
      totalDuration += service.duration || 30;
      
      // Add extra service duration if exists
      if (service.extraDuration) {
        totalDuration += service.extraDuration;
      }
    });
    
    return totalDuration + 5; // Add buffer time
  };

// Calculate end time based on start time and duration
const calculateEndTime = (startTime, durationMinutes) => {
  if (!startTime) return '';
  
  try {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      throw new Error('Invalid time format');
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Create a new date object using the selected date
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);
    
    // Validate the date
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid date');
    }
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating end time:', error);
    return '--:--'; // Return placeholder if error occurs
  }
};

  // Handle date selection
const handleDateClick = (day) => {
  if (!isWorkingDay(day)) return;
    if (isNaN(day.getTime())) {
    console.error('Invalid date selected');
    return;
  }
  
  
  setSelectedDate(day);
  setManualTime('');
  setExpectedEndTime('');
  setAvailabilityError('');
  onDateSelect(day);
  
  // Get appointments for the selected day
  const dayAppointments = appointments.filter(appt => {
    try {
      const apptDate = appt.date instanceof Date ? appt.date : new Date(appt.date);
      return isSameDay(apptDate, day);
    } catch (e) {
      return false;
    }
  });
  
  console.log("Raw day appointments:", dayAppointments); // Debug log
  
  const slots = dayAppointments.map(appt => ({
    start: appt.Time || '00:00', // Fallback if Time is missing
    end: appt.expectedEndTime || calculateEndTime(appt.Time || '00:00', 30), // Fallback if end time missing
    doctor: appt.doctor_id || null
  }));
  
  console.log("Processed busy slots:", slots); // Debug log
  setBusySlots(slots);
};

  // Handle manual time input change
const handleTimeChange = (e) => {
  const time = e.target.value;
  
  // Reset any previous availability error
  setAvailabilityError('');
  
  // Validate time format (HH:MM)
  if (time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    setAvailabilityError('Please enter a valid time in HH:MM format');
    return;
  }
  
  setManualTime(time);
  
  if (time && selectedDate) {
    try {
      // Create a proper Date object combining selectedDate and time
      const [hours, minutes] = time.split(':').map(Number);
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(hours, minutes, 0, 0);
      
      const duration = calculateTotalDuration();
      const endTime = calculateEndTime(time, duration);
      setExpectedEndTime(endTime);
      
      // Pass the Date object instead of just the time string
      onTimeSelect(dateWithTime);
      
      // Only check availability if we have a selected doctor
      if (selectedDoctor) {
        checkDoctorAvailability(time, endTime);
      }
    } catch (error) {
      console.error('Error handling time change:', error);
      setAvailabilityError('Invalid time value entered');
    }
  } else {
    setExpectedEndTime('');
  }
};


  // Check if the selected time slot is available
  const checkDoctorAvailability = (startTime, endTime) => {
    if (!selectedDoctor || !startTime || !endTime) return;
    
    const isAvailable = !busySlots.some(slot => {
      if (slot.doctor !== selectedDoctor) return false;
      
      return (
        (startTime >= slot.start && startTime < slot.end) ||
        (endTime > slot.start && endTime <= slot.end) ||
        (startTime <= slot.start && endTime >= slot.end)
      );
    });
    
    if (!isAvailable) {
      setAvailabilityError('The selected doctor is not available at this time. Please choose a different time or doctor.');
    } else {
      setAvailabilityError('');
    }
    
    return isAvailable;
  };

  // Check if a day has any appointments
  const hasAppointments = (day) => {
    return appointments.some(appt => {
      try {
        const apptDate = appt.date instanceof Date ? appt.date : new Date(appt.date);
        return isSameDay(apptDate, day);
      } catch (e) {
        return false;
      }
    });
  };

  // Check if a day is within working hours
  const isWorkingDay = (day) => {
    const dayOfWeek = format(day, 'EEEE').toLowerCase();
    return workingHours?.[dayOfWeek] && !workingHours[dayOfWeek].closed;
  };

  // Get day style based on various conditions
  const getDayStyle = (day) => {
    const dayOfWeek = format(day, 'EEEE').toLowerCase();
    const isWorking = isWorkingDay(day);
    const hasAppts = hasAppointments(day);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isToday = isSameDay(day, new Date());
    
    if (!isSameMonth(day, currentMonth)) {
      return 'text-gray-300';
    }
    
    if (!isWorking) {
      return 'text-gray-400 bg-gray-100';
    }
    
    if (isSelected) {
      return 'bg-[#325747] text-white';
    }
    
    if (hasAppts) {
      return 'bg-[#E59560] text-white';
    }
    
    if (isToday) {
      return 'bg-blue-100 text-blue-800';
    }
    
    return 'hover:bg-gray-100';
  };

  // Navigation functions
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      
      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 text-sm">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day, i) => {
          const dayOfWeek = format(day, 'EEEE').toLowerCase();
          const isWorking = isWorkingDay(day);
          const hasAppts = hasAppointments(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={i}
              onClick={() => isWorking && handleDateClick(day)}
              className={`p-2 text-center rounded-full cursor-pointer ${getDayStyle(day)}`}
            >
              {format(day, 'd')}
              {hasAppts && isWorking && (
                <div className="w-1 h-1 mx-auto mt-1 rounded-full bg-white"></div>
              )}
              {isToday && (
                <div className="w-1 h-1 mx-auto mt-1 rounded-full bg-blue-500"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 border-t pt-4">
          <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#325747]" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {/* Time Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FontAwesomeIcon icon={faClock} className="mr-2 text-[#E59560]" />
              Start Time
            </label>
            <input
              type="time"
              value={manualTime}
              onChange={handleTimeChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:border-[#325747]"
              required
            />
          </div>
          
          {/* Expected End Time */}
          {expectedEndTime && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FontAwesomeIcon icon={faClock} className="mr-2 text-[#E59560]" />
                Expected Time Slot
              </label>
              <div className="flex items-center">
                <div className="px-3 py-2 bg-[#F6F4E8] rounded-md text-center">
                  {manualTime}
                </div>
                <span className="mx-2 text-[#325747]">to</span>
                <div className="px-3 py-2 bg-[#F6F4E8] rounded-md text-center">
                  {expectedEndTime}
                </div>
              </div>
            </div>
          )}
          
          {/* Doctor Availability Error */}
          {availabilityError && (
            <div className="text-red-500 text-sm mt-2">{availabilityError}</div>
          )}
          
          {/* Booked Appointments */}
{busySlots.length > 0 && (
  <div className="mt-4">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Booked Appointments:</h4>
    <div className="space-y-2">
      {busySlots.map((slot, index) => {
        const doctor = doctors?.find(d => d._id === slot.doctor);
        return (
          <div key={index} className={`text-sm p-2 rounded ${
            selectedDoctor && slot.doctor === selectedDoctor 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-gray-50'
          }`}>
            <div className="font-medium">Time Slot:</div>
            <div className="flex items-center">
              <span className="font-medium">{slot.start}</span>
              <span className="mx-2">to</span>
              <span className="font-medium">{slot.end}</span>
            </div>
            {doctor && (
              <div className="mt-1">
                <span className="font-medium">Doctor:</span> Dr. {doctor.name}
                {doctor.specialty && ` (${doctor.specialty})`}
              </div>
            )}
            {!doctor && slot.doctor && (
              <div className="mt-1 text-gray-500">Doctor ID: {slot.doctor}</div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
        </div>
      )}
    </div>
  );
};

export default VetCalendar;
