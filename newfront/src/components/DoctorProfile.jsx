import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserMd, faPhone, faEnvelope, 
  faVenusMars, faCalendarAlt, faHospital,
  faSave, faEdit, faLock
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import DoctorHeader from './DoctorHeader';
import { motion } from 'framer-motion';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    specialty: '',
    status: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/doctor/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setDoctor(response.data);
        setFormData({
          phone: response.data.phone,
          specialty: response.data.specialty,
          status: response.data.status
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/doctor/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDoctor({
        ...doctor,
        ...formData
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/doctor/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    }
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
                <FontAwesomeIcon icon={faUserMd} className="text-[#325747]" />
              </motion.div>
              My Profile
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#325747]">
                  Personal Information
                </h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[#E59560] hover:text-[#d48550] flex items-center"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-1" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={doctor.name}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Gender</label>
                    <div className="flex items-center p-2 border border-gray-300 rounded-lg bg-gray-100">
                      <FontAwesomeIcon 
                        icon={faVenusMars} 
                        className="mr-2 text-[#607169]"
                      />
                      <span>{doctor.gender}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Email</label>
                    <input
                      type="email"
                      value={doctor.email}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center p-2 border border-gray-300 rounded-lg bg-gray-100">
                        <FontAwesomeIcon 
                          icon={faPhone} 
                          className="mr-2 text-[#607169]"
                        />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Specialty</label>
                    {editing ? (
                      <select
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="General">General</option>
                        <option value="Dentistry">Dentistry</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Internal Medicine">Internal Medicine</option>
                        <option value="Ophthalmology">Ophthalmology</option>
                        <option value="Cardiology">Cardiology</option>
                      </select>
                    ) : (
                      <div className="p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {doctor.specialty}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Status</label>
                    {editing ? (
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="active">Active</option>
                        <option value="on leave">On Leave</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <div className="p-2 border border-gray-300 rounded-lg bg-gray-100">
                        {doctor.status}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Clinic</label>
                    <div className="flex items-center p-2 border border-gray-300 rounded-lg bg-gray-100">
                      <FontAwesomeIcon 
                        icon={faHospital} 
                        className="mr-2 text-[#607169]"
                      />
                      <span>{doctor.clinic?.clinicName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#325747] mb-1">Location</label>
                    <div className="p-2 border border-gray-300 rounded-lg bg-gray-100">
                      {doctor.clinic?.city}, {doctor.clinic?.village}
                    </div>
                  </div>
                </div>
                
                {editing && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#E59560] text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Password & Actions */}
          <div className="space-y-6">
            {/* Password Change */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-[#325747] mb-4 flex items-center">
                <FontAwesomeIcon icon={faLock} className="mr-2" />
                Password Settings
              </h2>
              
              {showPasswordForm ? (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#325747] mb-1">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#325747] mb-1">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#325747] mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="submit"
                        className="bg-[#325747] text-white px-4 py-2 rounded-lg"
                      >
                        Change Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full bg-[#F6F4E8] text-[#325747] p-4 rounded-lg hover:bg-[#e8e4d5] transition"
                >
                  Change Password
                </button>
              )}
            </div>

            {/* Profile Image */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-[#325747] mb-4">Profile Image</h2>
              
              <div className="flex flex-col items-center">
                {doctor.profileImage ? (
                  <img 
                    src={`http://localhost:5000${doctor.profileImage}`} 
                    alt={doctor.profileImage}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#E59560] mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-[#E59560] flex items-center justify-center text-white text-4xl mb-4">
                    {doctor.name.charAt(0)}
                  </div>
                )}
                
                <button className="bg-[#F6F4E8] text-[#325747] px-4 py-2 rounded-lg hover:bg-[#e8e4d5] transition">
                  Update Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
