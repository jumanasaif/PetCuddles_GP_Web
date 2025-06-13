import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserMd,
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faSync,
  faKey
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import DoctorForm from "./VetaddDoctors";

const ClinicDoctorsManagement = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Fetch doctors data
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/vet/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDoctors(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch doctors');
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Add new doctor
  const handleAddDoctor = async (newDoctor) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/vet/doctors',
        newDoctor,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDoctors([...doctors, response.data]);
      setShowDoctorForm(false);
      toast.success('Doctor added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add doctor');
    }
  };

  // Update doctor
  const handleUpdateDoctor = async (updatedDoctor) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/vet/doctors/${updatedDoctor._id}`,
        updatedDoctor,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDoctors(doctors.map(doc => 
        doc._id === response.data._id ? response.data : doc
      ));
      setSelectedDoctor(null);
      setShowDoctorForm(false);
      toast.success('Doctor updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor');
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5000/api/vet/doctors/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDoctors(doctors.filter(doc => doc._id !== doctorId));
      toast.success('Doctor deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete doctor');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset doctor password
  const handleResetPassword = async (doctorId) => {
    if (!window.confirm('Reset this doctor\'s password to default?')) return;
    
    try {
      setIsResettingPassword(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `http://localhost:5000/api/vet/doctors/${doctorId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the doctor in state with temporary password
      setDoctors(doctors.map(doc => 
        doc._id === doctorId ? { 
          ...doc, 
          temporaryPassword: response.data.temporaryPassword 
        } : doc
      ));
      
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Update doctor status
  const handleStatusChange = async (doctorId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `http://localhost:5000/api/vet/doctors/${doctorId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDoctors(doctors.map(doc => 
        doc._id === doctorId ? { ...doc, status: newStatus } : doc
      ));
      
      toast.success(`Doctor status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialty && doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doctor.email && doctor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doctor.phone && doctor.phone.includes(searchTerm))
  );

  // Status badge component with click handler
  const StatusBadge = ({ status, doctorId }) => {
    let badgeClass = "";
    const statusOptions = ["active", "on leave", "inactive"];
    const nextStatus = statusOptions[(statusOptions.indexOf(status) + 1) % statusOptions.length];
    
    switch (status) {
      case "active":
        badgeClass = "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer";
        break;
      case "on leave":
        badgeClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer";
        break;
      case "inactive":
        badgeClass = "bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer";
    }
    
    return (
      <span 
        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
        onClick={() => handleStatusChange(doctorId, nextStatus)}
        title="Click to change status"
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button 
          onClick={fetchDoctors}
          className="mt-2 px-3 py-1 bg-[#325747] text-white rounded hover:bg-[#1e3c2e]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 font-laila bg-[#F6F4E8]" style={{marginTop:"80px"}}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">

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
                      Manage Doctors
                    </h1>

                    <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
                     <p className="text-[#607169]">
            {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} in your clinic
          </p>
                  </div>
                </motion.div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
          {/* Search Input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search doctors..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Add Doctor Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedDoctor(null);
              setShowDoctorForm(true);
            }}
            className="bg-[#325747] text-white px-6 py-2 rounded-lg flex items-center gap-2 justify-center"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Doctor
          </motion.button>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#BACEC1]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#325747] text-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Specialty
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {doctor.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={`http://localhost:5000${doctor.profileImage}`}
                              alt={doctor.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <FontAwesomeIcon icon={faUserMd} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {doctor.name} {doctor.gender && `(${doctor.gender === 'male' ? '♂' : '♀'})`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doctor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {doctor.specialty || 'General'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doctor.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge 
                        status={doctor.status || 'active'} 
                        doctorId={doctor._id} 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Edit Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowDoctorForm(true);
                          }}
                          className="text-[#325747] hover:text-[#E59560]"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </motion.button>
                        
                        {/* Reset Password Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleResetPassword(doctor._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Reset Password"
                          disabled={isResettingPassword}
                        >
                          {isResettingPassword ? (
                            <FontAwesomeIcon icon={faSync} className="animate-spin" />
                          ) : (
                            <FontAwesomeIcon icon={faKey} />
                          )}
                        </motion.button>
                        
                        {/* Delete Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteDoctor(doctor._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <FontAwesomeIcon icon={faSync} className="animate-spin" />
                          ) : (
                            <FontAwesomeIcon icon={faTrash} />
                          )}
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No doctors match your search' : 'No doctors found in your clinic'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Form Modal */}
      {showDoctorForm && (
        <DoctorForm 
          onClose={() => {
            setShowDoctorForm(false);
            setSelectedDoctor(null);
          }} 
          onAddDoctor={handleAddDoctor}
          onUpdateDoctor={handleUpdateDoctor}
          existingDoctor={selectedDoctor}
        />
      )}

      {/* Temporary Password Modal */}
      {doctors.some(doc => doc.temporaryPassword) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-[#325747] mb-4">New Doctor Credentials</h3>
            {doctors
              .filter(doc => doc.temporaryPassword)
              .map(doc => (
                <div key={doc._id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-600 mt-1">Email: {doc.email}</p>
                  <p className="text-sm text-gray-600">Temporary Password: 
                    <span className="font-mono bg-yellow-100 px-2 py-1 rounded ml-1">
                      {doc.temporaryPassword}
                    </span>
                  </p>
                  <p className="text-xs text-red-500 mt-2">
                    Please provide these credentials to the doctor and ask them to change their password immediately.
                  </p>
                </div>
              ))}
            <div className="flex justify-end">
              <button
                onClick={() => setDoctors(doctors.map(doc => ({ ...doc, temporaryPassword: undefined })))}
                className="px-4 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#1e3c2e]"
              >
                I've noted these down
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicDoctorsManagement;