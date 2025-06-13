import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faFilePdf,faFlaskVial,faHospital } from '@fortawesome/free-solid-svg-icons';


const LabTestManagement = () => {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        let url = 'http://localhost:5000/api/vet/lab-tests';
        if (statusFilter !== 'all') {
          url += `?status=${statusFilter}`;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setLabTests(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lab tests:', error);
        setLoading(false);
      }
    };

    fetchLabTests();
  }, [statusFilter]);

  const handleViewTest = async (testId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/vet/lab-tests/${testId}`,
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          timeout: 10000 // 10 second timeout
        }
      );
      
      if (!response.data) {
        throw new Error('No data returned from server');
      }
      
      setSelectedTest(response.data);
      setShowResultsModal(true);
    } catch (error) {
      console.error('Error fetching test details:', error);
      let errorMessage = 'Failed to load test results';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        errorMessage = error.response.data.message || 
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

// Add these functions to your component
const generatePDF = async () => {
  try {
    const input = document.getElementById('lab-test-results');
    if (!input) {
      throw new Error('PDF generation element not found');
    }
    const canvas = await html2canvas(input, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    const fileName = `LabTest_${selectedTest.test_name}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    
    // Convert PDF to Blob
    const pdfBlob = pdf.output('blob');
    
    // Create a File object from the Blob
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    // Save to server
    await savePDFToRecord(pdfFile, fileName);
    
    // Optionally download it as well
    pdf.save(fileName);
    
    toast.success('PDF saved successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
  }
};

const savePDFToRecord = async (pdfFile, fileName) => {
  try {
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('type', 'lab_result');
    formData.append('description', `Lab Test Results for ${selectedTest.test_name}`);
    formData.append('recordId', selectedTest.health_record_id);

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
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
};

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButton = (test) => {
    if (test.status === 'completed') {
      return (
        <button
          onClick={() => handleViewTest(test._id)}
          className="bg-[#E59560]  text-white px-3 py-1 rounded"
        >
          View Results
        </button>
      );
    } else {
      return (
        <button
          onClick={() => navigate(`/clinic/lab-tests/${test._id}/results`)}
          className="bg-green-800 hover:bg-green-600 text-white px-3 py-1 rounded"
        >
          {test.status === 'processing' ? 'Continue' : 'Enter Results'}
        </button>
      );
    }
  };

  return (
    <div className="container mx-auto px-8 py-8 min-h-screen"    
     style={{ backgroundColor: "#F6F4E8 ", fontFamily: "'Laila', sans-serif" ,marginTop:"80px"}}>
      {/* Results Modal */}
      {showResultsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
             <div  id="lab-test-results">  
              <div className="flex justify-between pb-3">
                 <div className=' grid grid-cols-2 '>
                   <div className="bg-[#e59560] rounded-full w-12 h-12 flex items-center justify-center  ">
                     <FontAwesomeIcon icon={faFlaskVial} className="text-white text-xl" />
                   </div>  
                   <h1 className='font-semibold text-xl mt-2' style={{marginLeft:"-10px"}}>{selectedTest.clinic_id.clinicName} <span className=" text-[#e59560]"> Lab</span> </h1>
                 </div>
                  <h1 className='font-semibold text-xl mt-2' >Lab Report</h1>
                 
                  <div  >
                      <p ><span className='text-[#e59560] font-bold'>Clinic address:</span> {selectedTest.clinic_id.city}, {selectedTest.clinic_id.village}</p>                                        
                      <p ><span className='text-[#e59560] font-bold'>Clinic Phone:</span> {selectedTest.clinic_id.phone}</p>                
                    </div>
              </div>

              {/* Test Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Owner Information */}
                {selectedTest.clinic_id && (
                  <div className="md:col-span-2">
                
                  </div>
                )}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium mb-2 text-[#E59560] ">Test Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                       <p><span className="font-bold text-[#325747]">Test Name: </span> {selectedTest.test_name}</p>
                    </div>
                    <div>
                      <p><span className="font-bold text-[#325747]">Result: </span> 
                         <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(selectedTest.status)}`}>
                          {selectedTest.summary}
                         </span>
                       </p>
                    </div>
                    <div>
                      <p><span className="font-bold  text-[#325747]">Completed At: </span> 
                      {selectedTest.completed_at ? format(new Date(selectedTest.completed_at), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    
                  </div>
                </div>

                {/* Pet Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium mb-2 text-[#E59560]">Pet Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
                    <p><span className="font-bold text-[#325747]">Name: </span>  {selectedTest.pet_id?.name || selectedTest.pet_info?.name}</p>
                    <p><span className="font-bold text-[#325747]">Species: </span> {selectedTest.pet_id?.species || selectedTest.pet_info?.species}</p>
                    <p><span className="font-bold text-[#325747]">Breed: </span> {selectedTest.pet_id?.breed || selectedTest.pet_info?.breed || 'N/A'}</p>
                    <p><span className="font-bold text-[#325747]">Gender: </span> {selectedTest.pet_id?.gender || selectedTest.pet_info?.gender || 'N/A'}</p>
                    <p><span className="font-bold  text-[#325747]">Age: </span> {selectedTest.pet_id?.age || selectedTest.pet_info?.age || 'N/A'}</p>
                  </div>
                </div>

                {/* Owner Information */}
                {selectedTest.pet_id?.owner_id && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mb-2 text-[#E59560]">Owner Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p><span className="font-bold  text-[#325747]">Name:</span> {selectedTest.pet_id.owner_id.fullName}</p>
                      </div>
                      <div>
                        <p><span className="font-bold  text-[#325747]">Email:</span> {selectedTest.pet_id.owner_id.email}</p>
                      </div>
                      <div>
                        <p><span className="font-bold  text-[#325747]">Phone:</span> {selectedTest.pet_id.owner_id.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Results */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-[#E59560]">Test Result</h3>
                {selectedTest.results?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-4 border text-left">Parameter</th>
                          <th className="py-2 px-4 border text-left">Value</th>
                          <th className="py-2 px-4 border text-left">Unit</th>
                          <th className="py-2 px-4 border text-left">Normal Range</th>
                          <th className="py-2 px-4 border text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTest.results.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border">{result.parameter?.name || result.parameter}</td>
                            <td className="py-2 px-4 border">{result.value}</td>
                            <td className="py-2 px-4 border">{result.unit}</td>
                            <td className="py-2 px-4 border">{result.normal_range}</td>
                            <td className="py-2 px-4 border">
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
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    No results recorded for this test
                  </div>
                )}
              </div>

              {/* Vet Notes and Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTest.vet_notes && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Veterinarian Notes</h3>
                    <p className="text-blue-700 whitespace-pre-line">{selectedTest.vet_notes}</p>
                  </div>
                )}
                {selectedTest.recommendations && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-green-800 mb-2">Recommendations</h3>
                    <p className="text-green-700 whitespace-pre-line">{selectedTest.recommendations}</p>
                  </div>
                )}
              </div>
             </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="px-4 space-x-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
                <button onClick={generatePDF}
                    className="px-4 py-2  ml-5 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                  >
                     <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                     Save as PDF
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex justify-between items-center mb-6">
          <div>
             <h1 className="text-4xl font-bold mb-2 text-[#325747]">
                <FontAwesomeIcon icon={faFlaskVial} className="mr-2 text-[#325747]" />
                Laboratory Tests
             </h1>
             <div className="h-1 rounded-full bg-[#E59560]"style={{width:"130px",marginLeft:"40px"}} ></div>
         </div>
    
        
        <div className="flex items-center space-x-4 text-[#325747] font-semibold">
          <label className="text-sm font-medium">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded p-2 border-[#E59560]"
          >
            <option value="all">All Tests</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <p>Loading...</p>
      ) : labTests.length === 0 ? (
        <p>No lab tests found</p>
      ) : (
        <div className="overflow-x-auto shadow-lg pt-8">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Test Name</th>
                <th className="py-2 px-4 border">Pet</th>
                <th className="py-2 px-4 border">Appointment Date</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Created At</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labTests.map((test) => (
                <tr key={test._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{test.test_name}</td>
                  <td className="py-2 px-4 border">
                    {test.pet_id?.name || test.pet_info?.name}
                    <span className="text-gray-500 ml-2">({test.pet_id?.species || test.pet_info?.species})</span>
                  </td>
                  <td className="py-2 px-4 border">
                    {test.appointment_id?.date 
                      ? format(new Date(test.appointment_id.date), 'MMM dd, yyyy') 
                      : 'N/A'}
                  </td>
                  <td className="py-2 px-4 border">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(test.status)}`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    {format(new Date(test.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-2 px-4 border">
                    {getActionButton(test)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LabTestManagement;
