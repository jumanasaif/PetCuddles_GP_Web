import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faPaw, faNotesMedical, faFileMedicalAlt, 
  faCalendarAlt, faHistory, faSearch, faTimes,
  faWeight, faTemperatureHigh, faHeartbeat, faPlus,
  faPrescriptionBottleAlt, faStethoscope, faClipboard
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import DoctorHeader from './DoctorHeader';
import { motion } from 'framer-motion';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState({
    weight: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medications: [{ name: '', dosage: '', frequency: '' }],
    notes: '',
    followUpDate: ''
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/doctor/patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(response.data);
        setFilteredPatients(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.owner_id?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.breed.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'dogs') return matchesSearch && patient.species.toLowerCase() === 'dog';
      if (activeTab === 'cats') return matchesSearch && patient.species.toLowerCase() === 'cat';
      if (activeTab === 'other') return matchesSearch && 
                                  !['dog', 'cat'].includes(patient.species.toLowerCase());
      return matchesSearch;
    });
    setFilteredPatients(filtered);
  }, [searchTerm, activeTab, patients]);

  const fetchHealthRecords = async (petId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/doctor/patients/${petId}/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealthRecords(response.data);
    } catch (error) {
      console.error('Error fetching health records:', error);
    }
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    fetchHealthRecords(patient._id);
    setShowModal(true);
  };

  const handleAddMedication = () => {
    setNewRecordForm({
      ...newRecordForm,
      medications: [...newRecordForm.medications, { name: '', dosage: '', frequency: '' }]
    });
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...newRecordForm.medications];
    updatedMedications[index][field] = value;
    setNewRecordForm({ ...newRecordForm, medications: updatedMedications });
  };

  const handleRemoveMedication = (index) => {
    const updatedMedications = [...newRecordForm.medications];
    updatedMedications.splice(index, 1);
    setNewRecordForm({ ...newRecordForm, medications: updatedMedications });
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/doctor/patients/${selectedPatient._id}/records`,
        newRecordForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh health records
      fetchHealthRecords(selectedPatient._id);
      // Reset form
      setNewRecordForm({
        weight: '',
        temperature: '',
        heartRate: '',
        respiratoryRate: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medications: [{ name: '', dosage: '', frequency: '' }],
        notes: '',
        followUpDate: ''
      });
      alert('Health record added successfully!');
    } catch (error) {
      console.error('Error submitting health record:', error);
      alert('Failed to add health record');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4E8] font-laila" style={{ marginTop: "80px" }}>
      <DoctorHeader />
      
      <div className="container mx-auto px-4 py-8">
  
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
                        <FontAwesomeIcon icon={faPaw} className="text-[#325747]" />
                      </motion.div>
                     Patient Management
                    </h1>
                    <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
                  </div>
                    <button 
            onClick={() => navigate('/doctor-dashboard')}
            className="bg-[#325747] text-white px-4 py-2 rounded-lg hover:bg-[#1e3a2b] transition"
          >
            Back to Dashboard
          </button>
                </motion.div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-[#607169]" />
              <input
                type="text"
                placeholder="Search patients by name, owner, species or breed..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-[#607169] hover:text-[#325747]"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === 'all' ? 'bg-[#E59560] text-white' : 'bg-gray-200 text-[#325747]'}`}
              >
                All Patients
              </button>
              <button
                onClick={() => setActiveTab('dogs')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === 'dogs' ? 'bg-[#E59560] text-white' : 'bg-gray-200 text-[#325747]'}`}
              >
                Dogs
              </button>
              <button
                onClick={() => setActiveTab('cats')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === 'cats' ? 'bg-[#E59560] text-white' : 'bg-gray-200 text-[#325747]'}`}
              >
                Cats
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === 'other' ? 'bg-[#E59560] text-white' : 'bg-gray-200 text-[#325747]'}`}
              >
                Other
              </button>
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(patient => (
              <motion.div
                key={patient._id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition"
                onClick={() => handlePatientClick(patient)}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#E59560] flex items-center justify-center text-white text-2xl">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#325747] text-lg">{patient.name}</h3>
                      <p className="text-sm text-[#607169]">
                        {patient.species} • {patient.breed}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-[#607169]">
                      <FontAwesomeIcon icon={faUser} className="mr-2 w-4" />
                      <span>Owner: {patient.owner_id?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center text-sm text-[#607169]">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 w-4" />
                      <span>Last Visit: {patient.lastVisit ? formatDate(patient.lastVisit) : 'Never'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#BACEC1] px-6 py-3 flex justify-between items-center">
                  <span className="text-sm text-[#607169]">
                    {patient.age} years • {patient.gender || 'Unknown'}
                  </span>
                  <button className="text-[#E59560] hover:text-[#d48550] text-sm font-medium">
                    View Records
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FontAwesomeIcon icon={faPaw} className="text-4xl text-[#607169] mb-4" />
              <h3 className="text-xl font-medium text-[#325747] mb-2">
                No patients found
              </h3>
              <p className="text-[#607169]">
                {searchTerm ? 'Try a different search term' : 'No patients in your records yet'}
              </p>
            </div>
          )}
        </div>

        {/* Patient Detail Modal */}
        {showModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-xl font-bold flex items-center">
                  <FontAwesomeIcon icon={faPaw} className="mr-2" />
                  {selectedPatient.name}'s Health Records
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-[#E59560] hover:text-white text-xl"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6">
                {/* Patient Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#F6F4E8] rounded-xl p-4">
                    <h3 className="font-bold text-[#325747] mb-2">Patient Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedPatient.name}</p>
                      <p><span className="font-medium">Species:</span> {selectedPatient.species}</p>
                      <p><span className="font-medium">Breed:</span> {selectedPatient.breed}</p>
                      <p><span className="font-medium">Age:</span> {selectedPatient.age} years</p>
                      <p><span className="font-medium">Gender:</span> {selectedPatient.gender || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#F6F4E8] rounded-xl p-4">
                    <h3 className="font-bold text-[#325747] mb-2">Owner Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedPatient.owner_id?.fullName || 'Unknown'}</p>
                      <p><span className="font-medium">Phone:</span> {selectedPatient.owner_id?.phone || 'Not provided'}</p>
                      <p><span className="font-medium">Email:</span> {selectedPatient.owner_id?.email || 'Not provided'}</p>
                      <p><span className="font-medium">Address:</span> {selectedPatient.owner_id?.address || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#F6F4E8] rounded-xl p-4">
                    <h3 className="font-bold text-[#325747] mb-2">Medical Summary</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Last Visit:</span> {selectedPatient.lastVisit ? formatDate(selectedPatient.lastVisit) : 'Never'}</p>
                      <p><span className="font-medium">Total Records:</span> {healthRecords.length}</p>
                      <p><span className="font-medium">Known Conditions:</span> {selectedPatient.medicalHistory?.conditions?.join(', ') || 'None recorded'}</p>
                      <p><span className="font-medium">Allergies:</span> {selectedPatient.medicalHistory?.allergies?.join(', ') || 'None recorded'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Health Records */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#325747] flex items-center">
                      <FontAwesomeIcon icon={faFileMedicalAlt} className="mr-2" />
                      Health Records
                    </h3>
                    <button 
                      onClick={() => document.getElementById('newRecordForm').scrollIntoView({ behavior: 'smooth' })}
                      className="bg-[#E59560] text-white px-4 py-2 rounded-lg hover:bg-[#d48550] transition flex items-center"
                    >
                      <FontAwesomeIcon icon={faNotesMedical} className="mr-2" />
                      Add New Record
                    </button>
                  </div>
                  
                  {healthRecords.length > 0 ? (
                    <div className="space-y-4">
                      {healthRecords.map(record => (
                        <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:bg-[#F6F4E8]">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-[#325747]">
                              {formatDate(record.date_created)}
                            </h4>
                            <span className="text-sm bg-[#325747] text-white px-2 py-1 rounded">
                              {record.clinic_id?.clinicName || 'Clinic not specified'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <p className="font-medium">Vitals:</p>
                              <p><FontAwesomeIcon icon={faWeight} className="mr-2 w-4" /> Weight: {record.weight} kg</p>
                              <p><FontAwesomeIcon icon={faTemperatureHigh} className="mr-2 w-4" /> Temp: {record.temperature} °C</p>
                              <p><FontAwesomeIcon icon={faHeartbeat} className="mr-2 w-4" /> Heart Rate: {record.heartRate} bpm</p>
                            </div>
                            <div>
                              <p className="font-medium">Diagnosis:</p>
                              <p>{record.diagnosis || 'Not specified'}</p>
                              <p className="font-medium mt-2">Treatment:</p>
                              <p>{record.treatment || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="font-medium">Medications:</p>
                              {record.medications?.length > 0 ? (
                                <ul className="list-disc pl-5">
                                  {record.medications.map((med, idx) => (
                                    <li key={idx}>{med.name} ({med.dosage}, {med.frequency})</li>
                                  ))}
                                </ul>
                              ) : (
                                <p>None prescribed</p>
                              )}
                            </div>
                          </div>
                          {record.notes && (
                            <div className="bg-[#F6F4E8] p-3 rounded text-sm">
                              <p className="font-medium">Notes:</p>
                              <p>{record.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#F6F4E8] rounded-lg">
                      <FontAwesomeIcon icon={faFileMedicalAlt} className="text-4xl text-[#607169] mb-4" />
                      <h4 className="text-lg font-medium text-[#325747] mb-2">
                        No health records found
                      </h4>
                      <p className="text-[#607169]">
                        Add a new health record for {selectedPatient.name} below
                      </p>
                    </div>
                  )}
                </div>
                
                {/* New Health Record Form */}
                <div id="newRecordForm" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#325747] mb-4 flex items-center">
                    <FontAwesomeIcon icon={faNotesMedical} className="mr-2" />
                    New Health Record
                  </h3>
                  
                  <form onSubmit={handleSubmitRecord}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Vitals */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-[#325747] flex items-center">
                          <FontAwesomeIcon icon={faStethoscope} className="mr-2" />
                          Vitals
                        </h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#607169] mb-1">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                            value={newRecordForm.weight}
                            onChange={(e) => setNewRecordForm({...newRecordForm, weight: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#607169] mb-1">Temperature (°C)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                            value={newRecordForm.temperature}
                            onChange={(e) => setNewRecordForm({...newRecordForm, temperature: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#607169] mb-1">Heart Rate (bpm)</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                            value={newRecordForm.heartRate}
                            onChange={(e) => setNewRecordForm({...newRecordForm, heartRate: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#607169] mb-1">Respiratory Rate (breaths/min)</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                            value={newRecordForm.respiratoryRate}
                            onChange={(e) => setNewRecordForm({...newRecordForm, respiratoryRate: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      {/* Diagnosis & Treatment */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#607169] mb-1">Symptoms</label>
                          <textarea
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                            value={newRecordForm.symptoms}
                            onChange={(e) => setNewRecordForm({...newRecordForm, symptoms: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#607169] mb-1">Diagnosis</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                            value={newRecordForm.diagnosis}
                            onChange={(e) => setNewRecordForm({...newRecordForm, diagnosis: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#607169] mb-1">Treatment</label>
                          <textarea
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                            value={newRecordForm.treatment}
                            onChange={(e) => setNewRecordForm({...newRecordForm, treatment: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Medications */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-[#325747] flex items-center">
                          <FontAwesomeIcon icon={faPrescriptionBottleAlt} className="mr-2" />
                          Medications
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddMedication}
                          className="text-sm bg-[#325747] text-white px-3 py-1 rounded hover:bg-[#1e3a2b] transition flex items-center"
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-1" />
                          Add Medication
                        </button>
                      </div>
                      
                      {newRecordForm.medications.map((med, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-[#607169] mb-1">Name</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                              value={med.name}
                              onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#607169] mb-1">Dosage</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                              value={med.dosage}
                              onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="flex-grow">
                              <label className="block text-sm font-medium text-[#607169] mb-1">Frequency</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                                value={med.frequency}
                                onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                              />
                            </div>
                            {newRecordForm.medications.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMedication(index)}
                                className="mb-[9px] text-red-500 hover:text-red-700"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Notes & Follow-up */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-[#607169] mb-1">Notes</label>
                        <textarea
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                          value={newRecordForm.notes}
                          onChange={(e) => setNewRecordForm({...newRecordForm, notes: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#607169] mb-1">Follow-up Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                          value={newRecordForm.followUpDate}
                          onChange={(e) => setNewRecordForm({...newRecordForm, followUpDate: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setNewRecordForm({
                          weight: '',
                          temperature: '',
                          heartRate: '',
                          respiratoryRate: '',
                          symptoms: '',
                          diagnosis: '',
                          treatment: '',
                          medications: [{ name: '', dosage: '', frequency: '' }],
                          notes: '',
                          followUpDate: ''
                        })}
                        className="px-4 py-2 border border-[#325747] text-[#325747] rounded-lg hover:bg-gray-100 transition"
                      >
                        Clear Form
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d48550] transition flex items-center"
                      >
                        <FontAwesomeIcon icon={faClipboard} className="mr-2" />
                        Save Health Record
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;