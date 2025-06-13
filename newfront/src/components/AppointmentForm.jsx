import { React, useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VetCalendar from './VetCalendar ';
import { format, parseISO, startOfWeek, endOfWeek,addMinutes, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { 
  faSearch, faPlus, faArrowLeft, faCalendarAlt,
  faClock, faUser, faPaw, faStethoscope
} from '@fortawesome/free-solid-svg-icons';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const { clinicId: paramClinicId } = useParams(); // Get clinicId from URL for pet owners
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pets, setPets] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [workingHours, setWorkingHours] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search by pet name, owner name, or "Owner,Pet"');
 
  const [vaccinationDoses, setVaccinationDoses] = useState({});
  const [followUpInfo, setFollowUpInfo] = useState({
    needed: false,
    date: '',
    time: '',
    period: '',
    notes: ''
  });
  const currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('clinic'));
  const isPetOwner = currentUser?.role === 'pet_owner';
  
  // Determine clinic ID - from params for pet owners, from localStorage for vets
  const clinicId = isPetOwner ? paramClinicId : JSON.parse(localStorage.getItem('clinic'))?.id;

  const [formData, setFormData] = useState({
    petType: 'registered',
    clinic_id: clinicId,
    doctor_id: '',
    selectedServices: [], 
    notes: '',
    estimatedCost: 0,
    actualCost: 0,
    date: '',
    Time: '',
    reason: '',
    isEmergency: false,
    externalPet: {
      name: '',
      species: '',
      breed: '',
      age: '',
      gender: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

   
  
  // For pet owners: fetch their own pets
  useEffect(() => {
    if (isPetOwner) {
      const fetchUserPets = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/pets/user-pets', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setUserPets(response.data.pets);
        } catch (err) {
          console.error('Error fetching user pets:', err);
        }
      };
      fetchUserPets();
    }
  }, [isPetOwner]);


  // Search pets
  useEffect(() => {
     if (!isPetOwner && searchQuery.length > 2) {
      const timer = setTimeout(() => {
        axios.get(`http://localhost:5000/api/appointment/search-pets?query=${searchQuery}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => setPets(res.data))
        .catch(err => setError(err.response?.data?.message || 'Error searching pets'));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isPetOwner]);


  
const getVaccineDosesInfo = async (vaccineName) => {
  try {
    const token = localStorage.getItem('token');
    const userRole = JSON.parse(localStorage.getItem('user'))?.role || 
                    JSON.parse(localStorage.getItem('clinic'))?.role;
    
    const isPetOwner = userRole === 'pet_owner';
    const clinicId = isPetOwner ? paramClinicId : JSON.parse(localStorage.getItem('clinic'))?.id;

    // Use different endpoints based on user role
    const url = isPetOwner
      ? `http://localhost:5000/api/clinic/vaccinations/by-name/${vaccineName}/${clinicId}`
      : `http://localhost:5000/api/clinic/vaccinations/by-name/${vaccineName}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const vaccine = response.data;
    return {
      name: vaccine.name,
      type: vaccine.petTypes.join(', '),
      doseCount: vaccine.doseCount,
      doseInterval: vaccine.doseInterval,
      doseDescription: `First dose at ${vaccine.firstDoseAge}, then every ${vaccine.doseInterval}`,
      protectsAgainst: vaccine.protectsAgainst
    };
  } catch (error) {
    console.error('Error fetching vaccine details:', error);
    return null;
  }
};

  // Load services and doctors
 useEffect(() => {
   const fetchData = async () => {
   try {
    const token = localStorage.getItem('token');
    const userRole = JSON.parse(localStorage.getItem('user'))?.role || 
                    JSON.parse(localStorage.getItem('clinic'))?.role;
    
    const isPetOwner = userRole === 'pet_owner';
    const clinicId = isPetOwner ? paramClinicId : JSON.parse(localStorage.getItem('clinic'))?.id;

    // Use different endpoints based on user role
    const servicesUrl = isPetOwner 
      ? `http://localhost:5000/api/vet/${clinicId}/services`
      : 'http://localhost:5000/api/vet/services';
    
    const doctorsUrl = isPetOwner
      ? `http://localhost:5000/api/vet/${clinicId}/doctors`
      : 'http://localhost:5000/api/vet/doctors';

    const [servicesRes, doctorsRes] = await Promise.all([
      axios.get(servicesUrl, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(doctorsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);
    
    setServices(servicesRes.data);
    setDoctors(doctorsRes.data);
  } catch (err) {
    setError(err.response?.data?.message || 'Error loading data');
  }
};
    fetchData();
}, [formData.clinic_id]);


useEffect(() => {
  const fetchWorkingHours = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/vet/${clinicId}/working-hours`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setWorkingHours(response.data.workingHours);
    } catch (err) {
      console.error('Error fetching working hours:', err);
    }
  };
  
  if (clinicId) {
    fetchWorkingHours();
  }
}, [clinicId]);

//  useEffect to fetch appointments
useEffect(() => {
  const fetchAppointments = async () => {
    try {
      const today = new Date();
      const startOfMonthDate = startOfMonth(today);
      const endOfMonthDate = endOfMonth(today);
      
      const response = await axios.get(
        `http://localhost:5000/api/appointment/${clinicId}/calendar-appointments`,
        {
          params: {
            startDate: startOfMonthDate.toISOString(),
            endDate: endOfMonthDate.toISOString()
          },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Transform dates from strings to Date objects
      const appointmentsWithDates = response.data.appointments.map(appt => ({
          ...appt,  // Keep all original fields
          date: new Date(appt.date),
          Time: appt.Time,  // Ensure time is included
          expectedEndTime: appt.expectedEndTime,  // Include end time
         doctor_id: appt.doctor_id , // Include doctor info
       }));
      
      setAppointments(appointmentsWithDates);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
  if (clinicId) {
    fetchAppointments();
  }
}, [clinicId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleExternalPetChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      externalPet: {
        ...prev.externalPet,
        [name]: value
      }
    }));
  };

const handleDateSelect = (date) => {
  setFormData(prev => ({
    ...prev,
    date: format(date, 'yyyy-MM-dd')
  }));
};

const handleTimeSelect = (time) => {
  // Ensure time is a valid Date object
  if (!(time instanceof Date) || isNaN(time.getTime())) {
    console.error('Invalid time value received:', time);
    return;
  }
  
  setFormData(prev => ({
    ...prev,
    Time: format(time, 'HH:mm')
  }));
};

const handleServiceSelect = (serviceId, subServiceId, extraServiceId = null) => {
  const service = services.find(s => s._id === serviceId);
  const subService = service?.subServices?.find(s => s._id === subServiceId);
  
  if (!service || !subService) return;

  const extraService = extraServiceId 
    ? subService.extraServices?.find(e => e._id === extraServiceId)
    : null;

   const originalCost = subService.baseCost + (extraService?.cost || 0);
   const discountedCost = formData.petType === 'registered' 
     ? originalCost * 0.9
     : originalCost;

  const newService = {
    service_id: serviceId,
    sub_service_id: subServiceId,
    extra_sub_service_id: extraServiceId || null,
    originalCost: originalCost,  // Store original cost
    cost: discountedCost        // Store discounted cost
  };

  setFormData(prev => ({
    ...prev,
    selectedServices: [...prev.selectedServices, newService],
    estimatedCost: prev.estimatedCost + discountedCost,
    actualCost: prev.actualCost + discountedCost
  }));
};


  const isServiceSelected = (serviceId, subServiceId) => {
    return formData.selectedServices?.some(
      s => s.service_id === serviceId && s.sub_service_id === subServiceId
    );
  };
  
 const isExtraSelected = (serviceId, subServiceId, extraId) => {
      return formData.selectedServices?.some(
        s => s.service_id === serviceId && 
           s.sub_service_id === subServiceId && 
           s.extra_sub_service_id === extraId
      );
  };
  
const toggleService = (serviceId, subServiceId) => {
  const service = services.find(s => s._id === serviceId);
  const subService = service?.subServices.find(s => s._id === subServiceId);
  
  if (!service || !subService) return;

  const isSelected = isServiceSelected(serviceId, subServiceId);
  const originalCost = subService.baseCost;
  const discountedCost = formData.petType === 'registered' 
    ? originalCost * 0.9 
    : originalCost;
  
  if (isSelected) {
    const serviceToRemove = formData.selectedServices.find(
      s => s.service_id === serviceId && s.sub_service_id === subServiceId
    );
    
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(
        s => !(s.service_id === serviceId && s.sub_service_id === subServiceId)
      ),
      estimatedCost: prev.estimatedCost - (serviceToRemove?.cost || 0),
      actualCost: prev.actualCost - (serviceToRemove?.cost || 0)
    }));
  } else {
    const newService = {
      service_id: serviceId,
      sub_service_id: subServiceId,
      extra_sub_service_id: null,
      originalCost: originalCost,
      cost: discountedCost
    };
  
    setFormData(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, newService],
      estimatedCost: prev.estimatedCost + discountedCost,
      actualCost: prev.actualCost + discountedCost
    }));
  }
};

const toggleExtraService = (serviceId, subServiceId, extraId) => {
  const service = services.find(s => s._id === serviceId);
  const subService = service?.subServices.find(s => s._id === subServiceId);
  const extraService = subService?.extraServices.find(e => e._id === extraId);
  
  if (!service || !subService || !extraService) return;

  const isSelected = isExtraSelected(serviceId, subServiceId, extraId);
  const baseOriginalCost = subService.baseCost;
  const extraOriginalCost = extraService.cost;
  const baseDiscountedCost = formData.petType === 'registered' 
    ? baseOriginalCost * 0.9 
    : baseOriginalCost;
  const extraDiscountedCost = formData.petType === 'registered' 
    ? extraOriginalCost * 0.9 
    : extraOriginalCost;
  
  if (isSelected) {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s => 
        s.service_id === serviceId && 
        s.sub_service_id === subServiceId && 
        s.extra_sub_service_id === extraId
          ? {
              ...s,
              extra_sub_service_id: null,
              originalCost: baseOriginalCost,
              cost: baseDiscountedCost
            }
          : s
      ),
      estimatedCost: prev.estimatedCost - extraDiscountedCost,
      actualCost: prev.actualCost - extraDiscountedCost
    }));
  } else {
    if (!isServiceSelected(serviceId, subServiceId)) {
      toggleService(serviceId, subServiceId);
    }
    
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s => 
        s.service_id === serviceId && s.sub_service_id === subServiceId
          ? {
              ...s,
              extra_sub_service_id: extraId,
              originalCost: baseOriginalCost + extraOriginalCost,
              cost: baseDiscountedCost + extraDiscountedCost
            }
          : s
      ),
      estimatedCost: prev.estimatedCost + extraDiscountedCost,
      actualCost: prev.actualCost + extraDiscountedCost
    }));
  }
};
  
  const removeService = (index) => {
    const serviceToRemove = formData.selectedServices[index];
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter((_, i) => i !== index),
      estimatedCost: prev.estimatedCost - serviceToRemove.cost,
      actualCost: prev.actualCost - serviceToRemove.cost
    }));
  };


  useEffect(() => {
    const fetchVaccinationDoses = async () => {
      if (formData.selectedServices.length > 0 && services.length > 0) {
        const newVaccinationDoses = {};
        
        for (const service of formData.selectedServices) {
          const serviceObj = services.find(s => s._id === service.service_id);
          if (serviceObj?.type === 'vaccination') {
            const subService = serviceObj.subServices.find(s => s._id === service.sub_service_id);
            if (subService) {
              const doseInfo = await getVaccineDosesInfo(subService.name);
              if (doseInfo && doseInfo.doseCount > 1) {
                newVaccinationDoses[service.sub_service_id] = {
                  ...doseInfo,
                  selectedDose: 1 // Default to first dose
                };
              }
            }
          }
        }
        
        setVaccinationDoses(newVaccinationDoses);
      } else {
        setVaccinationDoses({});
      }
    };
    
    fetchVaccinationDoses();
  }, [formData.selectedServices, services]);

  const calculateNextDueDate = (date, interval) => {
    if (!date || !interval) return null;
    
    try {
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) return null;
  
      // Parse interval (e.g., "4 weeks", "1 year")
      const intervalParts = interval.split(' ');
      const amount = parseInt(intervalParts[0]) || 1;
      const unit = intervalParts[1]?.toLowerCase() || 'month';
  
      const nextDue = new Date(appointmentDate);
      
      switch(unit) {
        case 'year':
        case 'years':
          nextDue.setFullYear(nextDue.getFullYear() + amount);
          break;
        case 'month':
        case 'months':
          nextDue.setMonth(nextDue.getMonth() + amount);
          break;
        case 'week':
        case 'weeks':
          nextDue.setDate(nextDue.getDate() + (amount * 7));
          break;
        case 'day':
        case 'days':
          nextDue.setDate(nextDue.getDate() + amount);
          break;
        default:
          nextDue.setMonth(nextDue.getMonth() + amount);
      }
  
      return nextDue;
    } catch (error) {
      console.error('Error calculating next due date:', error);
      return null;
    }
  };


const checkDoctorAvailability = async (date, time, duration, doctorId) => {
  try {
    // First check if we have all required parameters
    if (!date || !time || !duration || !doctorId) {
      console.error('Missing required parameters for availability check');
      return false;
    }

    const response = await axios.get(`http://localhost:5000/api/appointment/doctor-availability`, {
      params: {
        date: format(new Date(date), 'yyyy-MM-dd'),
        doctor_id: doctorId
      },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const appointments = response.data;
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = addMinutes(startTime, duration);

    // Check for overlapping appointments
    const isAvailable = !appointments.some(appt => {
      try {
        const apptStart = new Date(`${appt.date}T${appt.Time}`);
        const apptEnd = new Date(`${appt.date}T${appt.expectedEndTime}`);
        
        return (
          (startTime >= apptStart && startTime < apptEnd) ||
          (endTime > apptStart && endTime <= apptEnd) ||
          (startTime <= apptStart && endTime >= apptEnd)
        );
      } catch (e) {
        console.error('Error processing appointment:', e);
        return false;
      }
    });

    return isAvailable;
  } catch (error) {
    console.error('Error checking doctor availability:', error);
    // Return true if there's an error to not block the user
    // You might want to handle this differently
    return true;
  }
};

 


  const validateFollowUpDate = (date, time) => {
    if (!date) return false;
    
    try {
      const dateObj = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(':');
        dateObj.setHours(parseInt(hours, 10));
        dateObj.setMinutes(parseInt(minutes, 10));
      }
      return !isNaN(dateObj.getTime());
    } catch (error) {
      return false;
    }
  };

 const calculateTotalDuration = () => {
  let totalDuration = 0;
  
  formData.selectedServices.forEach(service => {
    const serviceObj = services.find(s => s._id === service.service_id);
    if (!serviceObj) return;
    
    const subService = serviceObj.subServices.find(s => s._id === service.sub_service_id);
    if (subService) {
      totalDuration += subService.duration || 30;
      
      if (service.extra_sub_service_id) {
        const extraService = subService.extraServices.find(e => e._id === service.extra_sub_service_id);
        if (extraService) {
          totalDuration += extraService.duration || 15;
        }
      }
    }
  });
  
  return totalDuration + 5; // Add buffer time
};


const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare vaccination data

       const duration = calculateTotalDuration();
       const isAvailable = await checkDoctorAvailability(
         formData.date, 
         formData.Time, 
         duration, 
         formData.doctor_id
       );

    if (!isAvailable) {
      throw new Error('The selected doctor is not available at this time. Please choose a different time or doctor.');
    }
      const vaccinationData = {};
      formData.selectedServices.forEach(service => {
        const serviceObj = services.find(s => s._id === service.service_id);
        if (serviceObj?.type === 'vaccination') {
          const subService = serviceObj.subServices.find(s => s._id === service.sub_service_id);
          if (subService && vaccinationDoses[service.sub_service_id]) {
            vaccinationData[service.sub_service_id] = vaccinationDoses[service.sub_service_id];
          }
        }
      });
      
      
  
      // Prepare follow-up info
      const followUpData = followUpInfo.needed ? {
        needed: true,
        date: followUpInfo.date,
        time: followUpInfo.time,
        period: followUpInfo.period,
        notes: followUpInfo.notes
      } : null;
  
      const submissionData = {
        ...formData,
        clinic_id: clinicId,
        expectedEndTime: calculateEndTime(formData.Time, duration),
        vaccinationDoses: Object.keys(vaccinationData).length > 0 ? vaccinationData : null,
        followUpInfo: followUpData
      };
  
      console.log('Submitting:', JSON.stringify(submissionData, null, 2));
      if (followUpInfo.needed && !validateFollowUpDate(followUpInfo.date, followUpInfo.time)) {
         setError('Please enter a valid follow-up date and time');
          return;
      }
      const response = await axios.post('http://localhost:5000/api/appointment', 
        submissionData,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      navigate(isPetOwner ? '/home' : '/clinic', {
        state: { success: 'Appointment created successfully!' }
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Error creating appointment');
      setLoading(false);
    }
  };


    const renderPetSelectionStep = () => {
    if (isPetOwner) {
      // Pet Owner View - only show their own pets
      return (
        <div className="p-6 h-full flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-[#325747]">
              <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#E59560]" />
              Select Your Pet
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userPets.map(pet => (
                <div 
                  key={pet._id}
                  onClick={() => {
                    setSelectedPet(pet);
                    setFormData(prev => ({
                      ...prev,
                      pet_id: pet._id,
                      owner_id: pet.owner_id || pet.userId
                    }));
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPet?._id === pet._id 
                      ? 'border-[#E59560] bg-[#F6F4E8]' 
                      : 'border-[#BACEC1] hover:border-[#E59560]'
                  }`}
                >
                  <div className="flex items-center">
                    {pet.img_url && (
                      <img 
                        src={pet.img_url} 
                        alt={pet.name}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-[#325747]">{pet.name}</h3>
                      <p className="text-sm text-[#325747]">
                        {pet.species} • {pet.breed}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedPet}
              className={`px-6 py-2 rounded-lg ${
                !selectedPet 
                  ? 'bg-[#BACEC1] cursor-not-allowed' 
                  : 'bg-[#325747] hover:bg-[#1e3a2b] text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      );
    } else {
      // Vet View - original search functionality
      return (
        <div className="p-6 h-full flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-[#325747]">
              <FontAwesomeIcon icon={faPaw} className="mr-2 text-[#E59560]" />
              Select Pet
            </h2>
            
            <div className="mb-6">
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, petType: 'registered' }))}
                  className={`px-4 py-2 rounded-lg ${
                    formData.petType === 'registered' 
                      ? 'bg-[#325747] text-white' 
                      : 'bg-[#BACEC1] text-[#325747]'
                  }`}
                >
                  Registered Pet
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, petType: 'external' }))}
                  className={`px-4 py-2 rounded-lg ${
                    formData.petType === 'external' 
                      ? 'bg-[#325747] text-white' 
                      : 'bg-[#BACEC1] text-[#325747]'
                  }`}
                >
                  New/External Pet
                </button>
              </div>

              {formData.petType === 'registered' ? (
                <div>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search by pet name, owner name, or 'Owner,Pet'"
                      className="w-full p-3 pl-10 border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />                        
                    <FontAwesomeIcon 
                      icon={faSearch} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
                    />
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pets.map(pet => (
                      <div 
                        key={pet._id}
                        onClick={() => {
                          setSelectedPet(pet);
                          setFormData(prev => ({
                            ...prev,
                            pet_id: pet._id,
                            owner_id: pet.userId 
                          }));
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPet?._id === pet._id 
                            ? 'border-[#E59560] bg-[#F6F4E8]' 
                            : 'border-[#BACEC1] hover:border-[#E59560]'
                        }`}
                      >
                        <div className="flex items-center">
                          {pet.img_url && (
                            <img 
                              src={pet.img_url} 
                              alt={pet.name}
                              className="w-12 h-12 rounded-full object-cover mr-4"
                            />
                          )}
                          <div>
                            <h3 className="font-medium text-[#325747]">{pet.name}</h3>
                            <p className="text-sm text-[#325747]">
                              {pet.species} • {pet.breed} • {pet.owner?.fullName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#325747] mb-1">Pet Name</label>
                            <input
                              type="text"
                              name="name"
                              value={formData.externalPet.name}
                              onChange={handleExternalPetChange}
                              className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#325747] mb-1">Species</label>
                            <select
                              name="species"
                              value={formData.externalPet.species}
                              onChange={handleExternalPetChange}
                              className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                              required
                            >
                              <option value="">Select species</option>
                              <option value="dog">Dog</option>
                              <option value="cat">Cat</option>
                              <option value="bird">Bird</option>
                              <option value="rabbit">Rabbit</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#325747] mb-1">Owner Name</label>
                            <input
                              type="text"
                              name="ownerName"
                              value={formData.externalPet.ownerName}
                              onChange={handleExternalPetChange}
                              className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#325747] mb-1">Owner Phone</label>
                            <input
                              type="tel"
                              name="ownerPhone"
                              value={formData.externalPet.ownerPhone}
                              onChange={handleExternalPetChange}
                              className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#325747] mb-1">Owner Email</label>
                            <input
                              type="email"
                              name="ownerEmail"
                              value={formData.externalPet.ownerEmail}
                              onChange={handleExternalPetChange}
                              className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                            />
                          </div>
                        </div>
                      </div>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={formData.petType === 'registered' && !selectedPet}
              className={`px-6 py-2 rounded-lg ${
                formData.petType === 'registered' && !selectedPet 
                  ? 'bg-[#BACEC1] cursor-not-allowed' 
                  : 'bg-[#325747] hover:bg-[#1e3a2b] text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      );
    }
  };

  const renderFollowUpSection = () => {
    if (isPetOwner) return null; // Hide for pet owners
    
    return (
      <div className="mb-6 p-4 bg-[#F6F4E8] rounded-lg">
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="needsFollowUp"
            checked={followUpInfo.needed}
            onChange={(e) => setFollowUpInfo(prev => ({
              ...prev,
              needed: e.target.checked
            }))}
            className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded"
          />
          <label htmlFor="needsFollowUp" className="ml-2 block text-sm font-medium text-[#325747]">
            Schedule Follow-up Appointment
          </label>
        </div>

        {followUpInfo.needed && (
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpInfo.date}
                  onChange={(e) => setFollowUpInfo(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  min={formData.date || new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">Follow-up Time</label>
                <input
                  type="time"
                  value={followUpInfo.time}
                  onChange={(e) => setFollowUpInfo(prev => ({
                    ...prev,
                    time: e.target.value
                  }))}
                  className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Or Specify Period</label>
              <input
                type="text"
                placeholder="e.g., 3 months, 6 weeks"
                value={followUpInfo.period}
                onChange={(e) => setFollowUpInfo(prev => ({
                  ...prev,
                  period: e.target.value
                }))}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Follow-up Notes</label>
              <textarea
                rows={2}
                value={followUpInfo.notes}
                onChange={(e) => setFollowUpInfo(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                placeholder="Reason for follow-up, special instructions, etc."
              />
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila" style={{marginTop:"80px"}}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 text-[#325747] hover:text-[#E59560]"
          >
            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
          </button>
          <h1 className="text-3xl font-bold text-[#325747]">
            {isPetOwner ? 'Book Appointment' : 'Create New Appointment'}
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                  ${step >= num ? 'bg-[#325747] text-white' : 'bg-[#BACEC1] text-[#325747]'}`}
              >
                {num}
              </div>
              <span className={`text-sm ${step >= num ? 'text-[#325747] font-medium' : 'text-[#BACEC1]'}`}>
                {num === 1 ? 'Pet' : num === 2 ? 'Service' : 'Details'}
              </span>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden min-h-[600px]">
          <form onSubmit={handleSubmit} className="h-full">
            {/* Step 1: Pet Selection */}
             {step === 1 && renderPetSelectionStep()}

            {/* Step 2: Service Selection */}
            {step === 2 && (
              <div className="p-6 h-full flex flex-col">
                <div className="flex-grow overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-[#325747]">
                    <FontAwesomeIcon icon={faStethoscope} className="mr-2 text-[#E59560]" />
                    Select Service
                  </h2>

                  <div className="mb-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#325747] mb-1">Doctor</label>
                      <select
                        name="doctor_id"
                        value={formData.doctor_id}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                        required
                      >
                        <option value="">Select doctor</option>
                        {doctors.map(doctor => (
                          <option key={doctor._id} value={doctor._id}>
                            Dr. {doctor.name} ({doctor.specialty})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Services Summary */}
                  <div className="mb-6 p-4 bg-[#F6F4E8] rounded-lg">
  <h3 className="font-medium mb-2 text-[#325747]">Selected Services</h3>
  {formData.selectedServices?.length > 0 ? (
    <div>
      <ul className="space-y-2 mb-4">
        {formData.selectedServices.map((service, index) => {
          const serviceObj = services.find(s => s._id === service.service_id);
          const subService = serviceObj?.subServices.find(s => s._id === service.sub_service_id);
          const extraService = service.extra_sub_service_id 
            ? subService?.extraServices.find(e => e._id === service.extra_sub_service_id)
            : null;

          return (
            <li key={index} className="flex justify-between items-center">
              <div>
                <span className="font-medium text-[#325747]">{serviceObj?.type} - {subService?.name}</span>
                {extraService && <span className="text-sm ml-2 text-[#325747]">+ {extraService.name}</span>}
              </div>
              <div className="flex items-center">
                {formData.petType === 'registered' ? (
                  <span className="flex flex-col items-end">
                    <span className="text-sm line-through text-gray-500">${service.originalCost.toFixed(2)}</span>
                    <span className="text-[#325747]">${service.cost.toFixed(2)}</span>
                  </span>
                ) : (
                  <span className="text-[#325747]">${service.cost.toFixed(2)}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="ml-4 text-[#E59560] hover:text-[#d48550]"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {formData.petType === 'registered' && (
        <div className="border-t border-[#BACEC1] pt-2 flex justify-between text-[#325747]">
          <span className="text-[red]">10% Discount for Registered Pet:</span>
          <span>-${(formData.selectedServices.reduce((sum, service) => sum + service.originalCost - service.cost, 0).toFixed(2))}</span>
        </div>
      )}
      <div className="border-t border-[#BACEC1] pt-2 flex justify-between font-medium text-[#325747]">
        <span>Total Estimated Cost:</span>
        <span>${formData.selectedServices.reduce((sum, service) => sum + service.cost, 0).toFixed(2)}</span>
      </div>
    </div>
  ) : (
    <p className="text-[#BACEC1]">No services selected yet</p>
  )}
</div>
                    {/* Services Selection */}
                    <div className="space-y-4">
                      {services.map(service => (
                        <div key={service._id} className="border border-[#BACEC1] rounded-lg overflow-hidden">
                          <div className="bg-[#F6F4E8] p-3 font-medium flex justify-between items-center text-[#325747]">
                            <span>
                              {service.type.charAt(0).toUpperCase() + service.type.slice(1).replace('_', ' ')}
                            </span>
                          </div>
                          <div className="p-3">
                            {service.subServices.map(subService => (
                              <div key={subService._id} className="mb-4 last:mb-0">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={isServiceSelected(service._id, subService._id)}
                                      onChange={() => toggleService(service._id, subService._id)}
                                      className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded mr-2"
                                    />
                                    <span className="font-medium text-[#325747]">{subService.name}</span>
                                  </div>
                                  <span className="text-sm text-[#325747]">${subService.baseCost}</span>
                                </div>
                                <div className="pl-6">
                                  {subService.extraServices.length > 0 && (
                                    <div className="text-sm text-[#325747] mb-2">Optional Extras:</div>
                                  )}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {subService.extraServices.map(extra => (
                                      <div 
                                        key={extra._id}
                                        onClick={() => toggleExtraService(service._id, subService._id, extra._id)}
                                        className={`p-2 border rounded cursor-pointer ${
                                          isExtraSelected(service._id, subService._id, extra._id) 
                                            ? 'border-[#E59560] bg-[#F6F4E8]' 
                                            : 'border-[#BACEC1] hover:bg-[#F6F4E8]'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center">
                                            <input
                                              type="checkbox"
                                              checked={isExtraSelected(service._id, subService._id, extra._id)}
                                              readOnly
                                              className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded mr-2"
                                            />
                                            <span className="text-[#325747]">{extra.name}</span>
                                          </div>
                                          <span className="text-[#325747]">+${extra.cost}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 border border-[#BACEC1] rounded-lg text-[#325747] hover:bg-[#F6F4E8]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!formData.selectedServices || formData.selectedServices.length === 0}
                    className={`px-6 py-2 rounded-lg ${
                      !formData.selectedServices || formData.selectedServices.length === 0
                        ? 'bg-[#BACEC1] cursor-not-allowed'
                        : 'bg-[#325747] hover:bg-[#1e3a2b] text-white'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Appointment Details */}
            {step === 3 && (
              <div className="p-6 h-full flex flex-col">
                <div className="flex-grow overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-[#325747]">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-[#E59560]" />
                    Appointment Details
                  </h2>

                  <div className="mb-6 space-y-4">

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-[#325747] mb-1">Date & Time</label>
    {workingHours && appointments ? (
     <VetCalendar
       appointments={appointments}
       workingHours={workingHours}
       selectedServices={formData.selectedServices}
       selectedDoctor={formData.doctor_id}
       doctors={doctors} 
       onDateSelect={handleDateSelect}
       onTimeSelect={handleTimeSelect}
     />
    ) : (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        Loading calendar data...
      </div>
    )}
  </div>
  
  <div>
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#325747] mb-1">Selected Date</label>
      <div className="p-2 border border-[#BACEC1] rounded-md bg-[#F6F4E8]">
        {formData.date ? format(new Date(formData.date), 'EEEE, MMMM d, yyyy') : 'No date selected'}
      </div>
    </div>
    
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#325747] mb-1">Selected Time</label>
      <div className="p-2 border border-[#BACEC1] rounded-md bg-[#F6F4E8]">
        {formData.Time || 'No time selected'}
      </div>
    </div>
    
    {formData.Time && formData.selectedServices.length > 0 && (
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#325747] mb-1">
          <FontAwesomeIcon icon={faClock} className="mr-2 text-[#E59560]" />
          Expected Time Slot
        </label>
        <div className="flex items-center">
          <div className="px-3 py-2 bg-[#F6F4E8] rounded-md text-center">
            {formData.Time}
          </div>
          <span className="mx-2 text-[#325747]">to</span>
          <div className="px-3 py-2 bg-[#F6F4E8] rounded-md text-center">
            {calculateEndTime(formData.Time, calculateTotalDuration())}
          </div>
        </div>
      </div>
    )}
  </div>
</div>

                    <div>
                      <label className="block text-sm font-medium text-[#325747] mb-1">Reason for Visit</label>
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[#325747] mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-[#325747] mb-1">Estimated Cost</label>
                        <input
                          type="number"
                          name="estimatedCost"
                          value={formData.estimatedCost}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-[#BACEC1] rounded-md bg-[#F6F4E8]"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#325747] mb-1">Actual Cost</label>
                        <input
                          type="number"
                          name="actualCost"
                          value={formData.actualCost}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isEmergency"
                        id="isEmergency"
                        checked={formData.isEmergency}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded"
                      />
                      <label htmlFor="isEmergency" className="ml-2 block text-sm text-[#325747]">
                        Emergency Appointment
                      </label>
                    </div>
                          {/* Vaccination Dose Selection */}
                          {vaccinationDoses && Object.keys(vaccinationDoses).length > 0 && (
  <div className="mb-6 p-4 bg-[#F6F4E8] rounded-lg">
    <h3 className="font-medium mb-3 text-[#325747]">Vaccination Dose Information</h3>
    {Object.entries(vaccinationDoses).map(([subServiceId, doseInfo]) => {
      const nextDue = doseInfo.selectedDose < doseInfo.doseCount 
        ? calculateNextDueDate(formData.date, doseInfo.doseInterval)
        : null;
        
      return (
        <div key={subServiceId} className="mb-4 last:mb-0">
          <label className="block text-sm font-medium text-[#325747] mb-2">
            {doseInfo.name} ({doseInfo.type}) - Protects against: {doseInfo.protectsAgainst}
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#325747] mb-1">Select Dose</label>
              <select
                value={doseInfo.selectedDose}
                onChange={(e) => setVaccinationDoses(prev => ({
                  ...prev,
                  [subServiceId]: {
                    ...prev[subServiceId],
                    selectedDose: parseInt(e.target.value)
                  }
                }))}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:border-[#E59560]"
              >
                {Array.from({ length: doseInfo.doseCount }, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {i === 0 ? 'Initial Dose' : `Booster Dose ${i}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-[#325747] mb-1">Dose Schedule</label>
              <div className="p-2 bg-white border border-[#BACEC1] rounded-md text-sm">
                {doseInfo.doseDescription}
                {nextDue && (
                  <div className="mt-1 text-[#E59560]">
                    Next due: {new Date(nextDue).toLocaleDateString()}
                  </div>
                )}
                {doseInfo.selectedDose >= doseInfo.doseCount && (
                  <div className="mt-1 text-green-600">
                    Final dose - no further boosters needed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}

      {/* Follow-up Appointment Section */}
          {renderFollowUpSection()}
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2 border border-[#BACEC1] rounded-lg text-[#325747] hover:bg-[#F6F4E8]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#325747] hover:bg-[#1e3a2b] text-white rounded-lg flex items-center justify-center min-w-24"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Create Appointment'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;
