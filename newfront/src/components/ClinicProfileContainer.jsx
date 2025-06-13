import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VetProfile from './VetProfile';
import { useParams } from 'react-router-dom';

const ClinicProfileContainer = () => {
  const [clinicData, setClinicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { clinicId } = useParams();

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userRole = JSON.parse(localStorage.getItem('clinic'))?.role || JSON.parse(localStorage.getItem('user'))?.role;
   
       // 'pet_owner' or 'clinic'
        console.log('Fetching data as:', userRole); // Debug log
        if (userRole === 'vet' && token) {
          // For vet accounts, use their own profile
          const [profileResponse, servicesResponse, doctorsResponse, tempCareResponse] = await Promise.all([
            axios.get('http://localhost:5000/api/vet/profile', {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get('http://localhost:5000/api/vet/services', {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get('http://localhost:5000/api/vet/doctors', {
              headers: { Authorization: `Bearer ${token}` }
            }),
           axios.get(`http://localhost:5000/api/vet-temporary-care/vet/requests`, {
            headers: { Authorization: `Bearer ${token}` }
           })
          ]);

          setClinicData({
            ...profileResponse.data,
            services: servicesResponse.data,
            doctors: doctorsResponse.data,
            temporaryRequests: tempCareResponse.data
          });
        } else if (userRole === 'pet_owner' && token) {
          // For pet owners or public access
          if (!clinicId) {
            throw new Error('Clinic ID is required');
          }
          const response = await axios.get(`http://localhost:5000/api/vet/public-profile/${clinicId}`);
          setClinicData(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, [clinicId]);

  if (loading) return <div>Loading clinic profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!clinicData) return <div>Clinic not found</div>;

  return <VetProfile clinic={clinicData} />;
};

export default ClinicProfileContainer;
