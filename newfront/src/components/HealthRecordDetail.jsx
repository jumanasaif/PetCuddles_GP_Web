import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileMedical, faPills, faSyringe, faFlask,
  faNotesMedical, faCalendarCheck, faArrowLeft,
  faEdit, faTrash, faDownload, faFilePdf,
  faFileImage, faFileAlt, faUpload, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HealthRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('xray');
  const [fileDescription, setFileDescription] = useState('');
  const [editForm, setEditForm] = useState({
    diagnosis: '',
    treatment: '',
    medications: [],
    procedures: [],
    vaccinations: [],
    lab_results: [],
    follow_up_required: false,
    follow_up_date: '',
    follow_up_reason: '',
    notes: ''
  });

  // Fetch health record details
  useEffect(() => {
    const fetchHealthRecord = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/health-records/${id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
        
        setRecord(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading health record');
        setLoading(false);
      }
    };
    
    fetchHealthRecord();
  }, [id]);

  // Open edit modal and populate form
  const openEditModal = () => {
    if (!record) return;
    
    setEditForm({
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      medications: record.medications || [],
      procedures: record.procedures || [],
      vaccinations: record.vaccinations || [],
      lab_results: record.lab_results || [],
      follow_up_required: record.follow_up_required || false,
      follow_up_date: record.follow_up_date 
        ? format(parseISO(record.follow_up_date), 'yyyy-MM-dd')
        : '',
      follow_up_reason: record.follow_up_reason || '',
      notes: record.notes || ''
    });
    setShowEditModal(true);
  };

  // Handle form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle array field changes
  const handleArrayFieldChange = (field, index, key, value) => {
    const newArray = [...editForm[field]];
    newArray[index][key] = value;
    setEditForm(prev => ({ ...prev, [field]: newArray }));
  };

  // Add new item to array field
  const addArrayFieldItem = (field, template) => {
    setEditForm(prev => ({ ...prev, [field]: [...prev[field], template] }));
  };

  // Remove item from array field
  const removeArrayFieldItem = (field, index) => {
    const newArray = [...editForm[field]];
    newArray.splice(index, 1);
    setEditForm(prev => ({ ...prev, [field]: newArray }));
  };

  // Submit health record update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedVaccinations = editForm.vaccinations.map(vacc => ({
        name: vacc.name || '',
        type: vacc.type || '',
        date: vacc.date || null,
        next_due: vacc.next_due || null
      }));

      const formattedData = {
        ...editForm,
        medications: editForm.medications.map(med => ({
          name: med.name || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
          notes: med.notes || ''
        })),
        procedures: editForm.procedures.map(proc => ({
          name: proc.name || '',
          description: proc.description || '',
          notes: proc.notes || ''
        })),
        vaccinations: formattedVaccinations,
        lab_results: editForm.lab_results.map(lab => ({
          test_name: lab.test_name || '',
          result: lab.result || '',
          notes: lab.notes || '',
          date: lab.date || null
        })),
        follow_up_date: editForm.follow_up_date || null
      };

      const response = await axios.put(
        `http://localhost:5000/api/health-records/${id}`,
        formattedData,
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setRecord(response.data);
      setShowEditModal(false);
      toast.success('Health record updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(
        err.response?.data?.message || 
        err.message || 
        'Error updating health record'
      );
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);
    formData.append('description', fileDescription);
    formData.append('recordId', id);

    try {
      await axios.post(
        'http://localhost:5000/api/health-records/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success('File uploaded successfully');
      setShowUploadModal(false);
      setFile(null);
      setFileDescription('');
      
      // Refresh record
      const response = await axios.get(
        `http://localhost:5000/api/health-records/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      setRecord(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading file');
    }
  };

  // Delete health record
  const deleteHealthRecord = async () => {
    if (!window.confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/health-records/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );

      toast.success('Health record deleted successfully');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting health record');
    }
  };

  // Download medical report


  const downloadReport = async (reportId, fileName) => {
    setDownloading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/health-records/download/${id}/${reportId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (err) {
      toast.error('Error downloading file');
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
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

  if (!record) {
    return <div>Health record not found</div>;
  }

  const petName = record.petType === 'registered' 
    ? record.pet_id?.name 
    : record.externalPet?.name;
  const petSpecies = record.petType === 'registered' 
    ? record.pet_id?.species 
    : record.externalPet?.species;
  const petBreed = record.petType === 'registered' 
    ? record.pet_id?.breed 
    : record.externalPet?.breed;
  const petAge = record.petType === 'registered' 
    ? record.pet_id?.age 
    : record.externalPet?.age;

  return (
    <div className="container mx-auto px-8 py-8 min-h-screen" 
     style={{ backgroundColor: "#F6F4E8 ", fontFamily: "'Laila', sans-serif" ,marginTop:"80px"}}>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#325747]">
                Health Record for {petName}
              </h1>
              <p className="text-gray-600">
                {petSpecies} • {petBreed} • {petAge ? `${petAge} years old` : 'Age unknown'}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={openEditModal}
                className="px-4 py-2 bg-[#325747] text-white rounded-md  flex items-center"
              >
                <FontAwesomeIcon icon={faEdit} className="mr-2" />
                Edit Record
              </button>
              <button
                onClick={deleteHealthRecord}
                className="px-4 py-2 bg-[#E59560] text-white rounded-md  flex items-center"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete Record
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <div className="mr-4">
              <span className="font-medium">Date:</span> {format(parseISO(record.date_created), 'MMM dd, yyyy')}
            </div>
            <div>
              <span className="font-medium">Veterinarian:</span> Dr. {record.doctor_name}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`mr-8 py-4 px-2 border-b-2 font-medium  text-sm ${activeTab === 'diagnosis' ? 'border-[#E59560] text-[#E59560]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faFileMedical} className="mr-2" />
              Diagnosis & Treatment
            </button>
            <button
              onClick={() => setActiveTab('medications')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'medications' ? 'border-[#E59560] text-[#E59560]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faPills} className="mr-2" />
              Medications
            </button>
            <button
              onClick={() => setActiveTab('procedures')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'procedures' ? 'border-[#E59560] text-[#E59560]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Procedures
            </button>
            <button
              onClick={() => setActiveTab('vaccinations')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vaccinations' ? 'border-[#E59560] text-[#E59560]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faSyringe} className="mr-2" />
              Vaccinations
            </button>
            <button
              onClick={() => setActiveTab('lab')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'lab' ? 'border-[#E59560] text-[#E59560]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FontAwesomeIcon icon={faFlask} className="mr-2" />
              Lab Results
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reports' ? 'border-[#E59560] text-[#E59560]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Medical Reports
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Diagnosis & Treatment */}
          {activeTab === 'diagnosis' && (
            <div>
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Diagnosis</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {record.diagnosis ? (
                    <p className="text-gray-700 whitespace-pre-line">{record.diagnosis}</p>
                  ) : (
                    <p className="text-gray-500 italic">No diagnosis recorded</p>
                  )}
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Treatment</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {record.treatment ? (
                    <p className="text-gray-700 whitespace-pre-line">{record.treatment}</p>
                  ) : (
                    <p className="text-gray-500 italic">No treatment recorded</p>
                  )}
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-800 mb-2">General Notes</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {record.notes ? (
                    <p className="text-gray-700 whitespace-pre-line">{record.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No additional notes</p>
                  )}
                </div>
              </div>
              
              {record.follow_up_required && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h2 className="text-lg font-medium text-blue-800 mb-2">Follow-up Required</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Date:</span> {format(parseISO(record.follow_up_date), 'MMM dd, yyyy')}
                    </div>
                    <div>
                      <span className="font-medium">Reason:</span> {record.follow_up_reason}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Medications */}
          {activeTab === 'medications' && (
            <div>
              {record.medications?.length > 0 ? (
                <div className="space-y-4">
                  {record.medications.map((med, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="font-medium">Name:</span> {med.name}
                        </div>
                        <div>
                          <span className="font-medium">Dosage:</span> {med.dosage}
                        </div>
                        <div>
                          <span className="font-medium">Frequency:</span> {med.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {med.duration}
                        </div>
                      </div>
                      {med.notes && (
                        <div className="mt-2">
                          <span className="font-medium">Notes:</span>
                          <p className="text-gray-700 mt-1 whitespace-pre-line">{med.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  No medications recorded for this visit
                </div>
              )}
            </div>
          )}
          
          {/* Procedures */}
          {activeTab === 'procedures' && (
            <div>
              {record.procedures?.length > 0 ? (
                <div className="space-y-4">
                  {record.procedures.map((proc, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-lg mb-2">{proc.name}</h3>
                      <div className="mb-3">
                        <span className="font-medium">Description:</span>
                        <p className="text-gray-700 mt-1 whitespace-pre-line">{proc.description}</p>
                      </div>
                      {proc.notes && (
                        <div>
                          <span className="font-medium">Notes:</span>
                          <p className="text-gray-700 mt-1 whitespace-pre-line">{proc.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  No procedures recorded for this visit
                </div>
              )}
            </div>
          )}
          
          {/* Vaccinations */}
{/* Vaccinations */}
{activeTab === 'vaccinations' && (
  <div>
    {record.vaccinations?.length > 0 ? (
      <div className="space-y-4">
        {record.vaccinations.map((vacc, index) => (
          <div key={index} className={`bg-gray-50 p-4 rounded-lg border ${vacc.is_completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <span className="font-medium">Name:</span> {vacc.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Type:</span> {vacc.type || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Date Given:</span> 
                {vacc.date && !isNaN(new Date(vacc.date).getTime()) 
                  ? format(new Date(vacc.date), 'MMM dd, yyyy') 
                  : 'Not recorded'}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                {vacc.is_completed ? (
                  <span className="text-green-600">Completed</span>
                ) : (
                  <>
                    <span className="text-blue-600">In Progress</span>
                    {vacc.next_due && !isNaN(new Date(vacc.next_due).getTime()) && (
                      <span> (Next due: {format(new Date(vacc.next_due), 'MMM dd, yyyy')})</span>
                    )}
                  </>
                )}
              </div>
              <div>
                <span className="font-medium">Dose:</span> {vacc.dose_number}/{vacc.dose_count || '?'}
              </div>
              {vacc.dose_description && (
                <div className="col-span-2">
                  <span className="font-medium">Description:</span> {vacc.dose_description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        No vaccinations recorded for this visit
      </div>
    )}
  </div>
)}
          
          {/* Lab Results */}
{/* Lab Results */}
{/* Lab Results */}
{activeTab === 'lab' && (
  <div>
    {record.lab_results?.length > 0 ? (
      <div className="space-y-6">
        {record.lab_results.map((lab, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">
                  {lab.test_name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {lab.date ? format(new Date(lab.date), 'MMM dd, yyyy') : 'No date'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    lab.summary === 'normal' ? 'bg-green-100 text-green-800' :
                    lab.summary === 'abnormal' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lab.summary}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {/* Display individual test results */}
              {lab.results?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Test Parameters</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Range</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lab.results.map((result, resultIndex) => (
                          <tr key={resultIndex}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {result.parameter?.name || result.parameter}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {result.value}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {result.unit}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {result.normal_range}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                result.flag === 'normal' ? 'bg-green-100 text-green-800' :
                                result.flag === 'high' ? 'bg-red-100 text-red-800' :
                                result.flag === 'low' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Vet Notes and Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {lab.vet_notes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Veterinarian Notes</h4>
                    <p className="text-sm text-blue-700 whitespace-pre-line">{lab.vet_notes}</p>
                  </div>
                )}
                {lab.recommendations && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-1">Recommendations</h4>
                    <p className="text-sm text-green-700 whitespace-pre-line">{lab.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        No lab results recorded for this visit
      </div>
    )}
  </div>
)}   
          {/* Medical Reports */}
          {activeTab === 'reports' && (
  <div>
    {record.medical_reports?.length > 0 ? (
      <div className="space-y-4">
        {record.medical_reports.map((report, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
            <div>
              <div className="flex items-center">
                {report.type === 'lab_result' ? (
                  <FontAwesomeIcon icon={faFilePdf} className="text-red-500 mr-2" />
                ) : report.type === 'xray' ? (
                  <FontAwesomeIcon icon={faFileImage} className="text-blue-500 mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faFileAlt} className="text-gray-500 mr-2" />
                )}
                <span className="font-medium">{report.description || `Medical Report ${index + 1}`}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <span>Uploaded: {format(parseISO(report.upload_date), 'MMM dd, yyyy')}</span>
                <span className="mx-2">•</span>
                <span>Type: {report.type}</span>
              </div>
            </div>
            <button
              onClick={() => downloadReport(report._id, report.file_name)}
              className="px-3 py-1 bg-[#325747] text-white rounded-md  flex items-center"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-1" />
              Download
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        No medical reports uploaded for this visit
      </div>
    )}
    
    <div className="mt-6">
      <button
        onClick={() => setShowUploadModal(true)}
        className="px-4 py-2 bg-[#E59560] text-white rounded-md  flex items-center"
      >
        <FontAwesomeIcon icon={faUpload} className="mr-2" />
        Upload New Report
      </button>
    </div>
  </div>
)}
        </div>
      </div>
      
      {/* Edit Health Record Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#325747]" style={{marginLeft:"250px"}}>
                  <FontAwesomeIcon icon={faFileMedical} className='px-3'/>
                  Edit Health Record for {petName}
                 
                </h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-[#325747] hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Diagnosis */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                    <textarea
                      name="diagnosis"
                      value={editForm.diagnosis}
                      onChange={handleEditChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter diagnosis details..."
                    />
                  </div>
                  
                  {/* Treatment */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
                    <textarea
                      name="treatment"
                      value={editForm.treatment}
                      onChange={handleEditChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter treatment details..."
                    />
                  </div>
                  
                  {/* Medications */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Medications</label>
                      <button
                        type="button"
                        onClick={() => addArrayFieldItem('medications', {
                          name: '',
                          dosage: '',
                          frequency: '',
                          duration: '',
                          notes: ''
                        })}
                        className="text-xs bg-[#325747] text-white px-2 py-1 rounded"
                      >
                        Add Medication
                      </button>
                    </div>
                    
                    {editForm.medications.map((med, index) => (
                      <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Name</label>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleArrayFieldChange('medications', index, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Medication name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Dosage</label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleArrayFieldChange('medications', index, 'dosage', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="e.g. 5mg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Frequency</label>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleArrayFieldChange('medications', index, 'frequency', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="e.g. Twice daily"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Duration</label>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => handleArrayFieldChange('medications', index, 'duration', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="e.g. 7 days"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500">Notes</label>
                            <textarea
                              value={med.notes}
                              onChange={(e) => handleArrayFieldChange('medications', index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Additional notes"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArrayFieldItem('medications', index)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Procedures */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Procedures</label>
                      <button
                        type="button"
                        onClick={() => addArrayFieldItem('procedures', {
                          name: '',
                          description: '',
                          notes: ''
                        })}
                        className="text-xs bg-[#325747] text-white px-2 py-1 rounded"
                      >
                        Add Procedure
                      </button>
                    </div>
                    
                    {editForm.procedures.map((proc, index) => (
                      <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Name</label>
                            <input
                              type="text"
                              value={proc.name}
                              onChange={(e) => handleArrayFieldChange('procedures', index, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Procedure name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Description</label>
                            <textarea
                              value={proc.description}
                              onChange={(e) => handleArrayFieldChange('procedures', index, 'description', e.target.value)}
                              rows={2}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Procedure description"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Notes</label>
                            <textarea
                              value={proc.notes}
                              onChange={(e) => handleArrayFieldChange('procedures', index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Additional notes"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArrayFieldItem('procedures', index)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Vaccinations */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Vaccinations</label>
                      <button
                        type="button"
                        onClick={() => addArrayFieldItem('vaccinations', {
                          name: '',
                          type: '',
                          date: '',
                          next_due: ''
                        })}
                        className="text-xs bg-[#325747] text-white px-2 py-1 rounded"
                      >
                        Add Vaccination
                      </button>
                    </div>
                    
                    {editForm.vaccinations.map((vacc, index) => (
                      <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Name</label>
                            <input
                              type="text"
                              value={vacc.name}
                              onChange={(e) => handleArrayFieldChange('vaccinations', index, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Vaccine name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Type</label>
                            <input
                              type="text"
                              value={vacc.type}
                              onChange={(e) => handleArrayFieldChange('vaccinations', index, 'type', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="e.g. Rabies, Distemper"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Date Given</label>
                            <input
                              type="date"
                              value={vacc.date ? format(parseISO(vacc.date), 'yyyy-MM-dd') : ''}
                              onChange={(e) => handleArrayFieldChange('vaccinations', index, 'date', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Next Due</label>
                            <input
                              type="date"
                              value={vacc.next_due ? format(parseISO(vacc.next_due), 'yyyy-MM-dd') : ''}
                              onChange={(e) => handleArrayFieldChange('vaccinations', index, 'next_due', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArrayFieldItem('vaccinations', index)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Lab Results */}
                 {/* Lab Results */}
<div className="col-span-2">
  <div className="flex justify-between items-center mb-1">
    <label className="block text-sm font-medium text-gray-700">Lab Results</label>
    <button
      type="button"
      onClick={() => addArrayFieldItem('lab_results', {
        test_id: '',
        test_name: '',
        date: '',
        summary: '',
        results: [],
        vet_notes: '',
        recommendations: ''
      })}
      className="text-xs bg-[#325747] text-white px-2 py-1 rounded"
    >
      Add Lab Result
    </button>
  </div>
  
  {editForm.lab_results.map((lab, index) => (
    <div key={index} className="mb-4 p-3 border border-gray-200 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500">Test Name</label>
          <input
            type="text"
            value={lab.test_name}
            onChange={(e) => handleArrayFieldChange('lab_results', index, 'test_name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Test name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Date</label>
          <input
            type="date"
            value={lab.date ? format(parseISO(lab.date), 'yyyy-MM-dd') : ''}
            onChange={(e) => handleArrayFieldChange('lab_results', index, 'date', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Summary</label>
          <select
            value={lab.summary}
            onChange={(e) => handleArrayFieldChange('lab_results', index, 'summary', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="normal">Normal</option>
            <option value="abnormal">Abnormal</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
        </div>
      </div>
      
      {/* Lab Parameters */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-medium text-gray-500">Test Parameters</label>
          <button
            type="button"
            onClick={() => {
              const newResults = [...lab.results];
              newResults.push({
                parameter: { name: '', unit: '', normal_range: '' },
                value: '',
                unit: '',
                normal_range: '',
                flag: 'normal'
              });
              handleArrayFieldChange('lab_results', index, 'results', newResults);
            }}
            className="text-xs bg-[#325747] text-white px-2 py-1 rounded"
          >
            Add Parameter
          </button>
        </div>
        
        {lab.results?.map((result, resultIndex) => (
          <div key={resultIndex} className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500">Parameter Name</label>
                <input
                  type="text"
                  value={result.parameter?.name || ''}
                  onChange={(e) => {
                    const newResults = [...lab.results];
                    newResults[resultIndex].parameter = {
                      ...newResults[resultIndex].parameter,
                      name: e.target.value
                    };
                    handleArrayFieldChange('lab_results', index, 'results', newResults);
                  }}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Value</label>
                <input
                  type="text"
                  value={result.value}
                  onChange={(e) => {
                    const newResults = [...lab.results];
                    newResults[resultIndex].value = e.target.value;
                    handleArrayFieldChange('lab_results', index, 'results', newResults);
                  }}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Unit</label>
                <input
                  type="text"
                  value={result.unit}
                  onChange={(e) => {
                    const newResults = [...lab.results];
                    newResults[resultIndex].unit = e.target.value;
                    handleArrayFieldChange('lab_results', index, 'results', newResults);
                  }}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Normal Range</label>
                <input
                  type="text"
                  value={result.normal_range}
                  onChange={(e) => {
                    const newResults = [...lab.results];
                    newResults[resultIndex].normal_range = e.target.value;
                    handleArrayFieldChange('lab_results', index, 'results', newResults);
                  }}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Status</label>
                <select
                  value={result.flag}
                  onChange={(e) => {
                    const newResults = [...lab.results];
                    newResults[resultIndex].flag = e.target.value;
                    handleArrayFieldChange('lab_results', index, 'results', newResults);
                  }}
                  className="w-full p-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const newResults = [...lab.results];
                newResults.splice(resultIndex, 1);
                handleArrayFieldChange('lab_results', index, 'results', newResults);
              }}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Remove Parameter
            </button>
          </div>
        ))}
      </div>
      
      
      <button
        type="button"
        onClick={() => removeArrayFieldItem('lab_results', index)}
        className="mt-2 text-xs text-red-500 hover:text-red-700"
      >
        Remove Lab Test
      </button>
    </div>
  ))}
</div>
                  
                  {/* Follow-up Information */}
                  <div className="col-span-2 border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Follow-up Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="follow_up_required"
                          name="follow_up_required"
                          checked={editForm.follow_up_required}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            follow_up_required: e.target.checked
                          }))}
                          className="h-4 w-4 text-[#325747]  border-gray-300 rounded"
                        />
                        <label htmlFor="follow_up_required" className="ml-2 block text-sm text-gray-700">
                          Follow-up Required
                        </label>
                      </div>
                      
                      {editForm.follow_up_required && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                            <input
                              type="date"
                              name="follow_up_date"
                              value={editForm.follow_up_date}
                              onChange={handleEditChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                            <input
                              type="text"
                              name="follow_up_reason"
                              value={editForm.follow_up_reason}
                              onChange={handleEditChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              placeholder="Reason for follow-up"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* General Notes */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                    <textarea
                      name="notes"
                      value={editForm.notes}
                      onChange={handleEditChange}
                      rows={4}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Additional notes about this health record..."
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#325747] text-white rounded-md "
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Medical Report Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#325747]">Upload Medical Report</h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              <form onSubmit={handleFileUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md "
                    >
                      <option value="xray">X-ray</option>
                      <option value="lab">Lab Test</option>
                      <option value="ultrasound">Ultrasound</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Brief description of the file"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-[#E59560] hover:text-[#325747] focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={(e) => setFile(e.target.files[0])}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG up to 10MB
                        </p>
                        {file && (
                          <p className="text-sm text-[#325747] font-bold mt-2">
                            Selected: {file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#E59560] text-white rounded-md "
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecordDetail;
