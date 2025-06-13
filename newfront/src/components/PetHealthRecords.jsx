import React, { useState, useEffect } from 'react';
import { 
  FaFolder, 
  FaFileMedical, 
  FaPlus, 
  FaChevronDown, 
  FaChevronRight,
  FaSpinner,
  FaNotesMedical,
  FaClinicMedical,
  FaInfoCircle
} from 'react-icons/fa';
import { GiHealthNormal } from 'react-icons/gi';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const PetHealthRecords = ({ petId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/pets/${petId}/health-records`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecords(response.data);
      } catch (error) {
        console.error('Error fetching health records:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [petId]);

  const toggleFolder = (type) => {
    setExpandedFolders(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getTypeLabel = (type) => {
    const labels = {
      skin_detection: 'Skin Analysis',
      vet_visit: 'Vet Visits',
      vaccination: 'Vaccinations',
      medication: 'Medications',
      other: 'Other Records'
    };
    return labels[type] || type;
  };

  
  const renderSkinDetectionDetails = (data) => {
    if (!data || data.type !== 'skin_detection') return null;
    
    return (
      <div className="mt-4 space-y-4">
        {/* Prediction and Confidence */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <GiHealthNormal className="text-[#E59560] mr-2" />
            <h4 className="font-semibold text-[#325747]">Diagnosis</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Condition</p>
              <p className="font-medium capitalize">{data.prediction?.replace('_', ' ') || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="font-medium">
                {data.confidence ? `${Math.round(data.confidence * 100)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {data.recommendation && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <FaNotesMedical className="text-[#E59560] mr-2" />
              <h4 className="font-semibold text-[#325747]">Recommendation</h4>
            </div>
            <p className="mb-2">{data.recommendation.baseRecommendation}</p>
            
            {data.recommendation.explanation && (
              <>
                <div className="flex items-center mt-3 mb-2">
                  <FaInfoCircle className="text-[#325747] mr-2" />
                  <h5 className="font-medium text-[#325747]">Explanation</h5>
                </div>
                <p>{data.recommendation.explanation}</p>
              </>
            )}

            {data.recommendation.home_care?.length > 0 && (
              <>
                <div className="flex items-center mt-3 mb-2">
                  <FaNotesMedical className="text-[#325747] mr-2" />
                  <h5 className="font-medium text-[#325747]">Home Care Tips</h5>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {data.recommendation.home_care.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-sm text-gray-600">Vet Urgency</p>
                <p className="font-medium capitalize">
                  {data.recommendation.vet_urgency || 'Moderate'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contagious</p>
                <p className="font-medium capitalize">
                  {data.recommendation.contagious || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Image */}
        {data.imageUrl && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <FaFileMedical className="text-[#325747] mr-2" />
              <h4 className="font-semibold text-[#325747]">Analysis Image</h4>
            </div>
            <img 
              src={`http://localhost:5000${data.imageUrl}`} 
              alt="Skin condition analysis"
              className="rounded-lg max-h-64 mx-auto"
            />
          </div>
        )}
      </div>
    );
  };

  const renderVaccinationDetails = (record) => {
  if (record.type !== 'vaccination') return null;
  
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Clinic Name</p>
            <p className="font-medium">{record.data.clinic}</p>
          </div>
           <div>
            <p className="text-sm text-gray-600">Dr. </p>
            <p className="font-medium">{record.data.vet}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vaccine Name</p>
            <p className="font-medium">{record.data.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-medium">{record.data.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date Administered</p>
            <p className="font-medium">
              {new Date(record.data.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dose</p>
            <p className="font-medium">
              {record.data.doseNumber}/{record.data.totalDoses}
            </p>
          </div>
          {record.data.nextDue && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Next Dose Due</p>
              <p className="font-medium">
                {new Date(record.data.nextDue).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        
        {record.data.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Notes</p>
            <p className="font-medium">{record.data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
 };

  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.type]) {
      acc[record.type] = [];
    }
    acc[record.type].push(record);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center py-8"><FaSpinner className="animate-spin text-2xl" /></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#325747]">Health Records</h2>
        <button className="bg-[#E59560] text-white px-4 py-2 rounded-lg flex items-center">
          <FaPlus className="mr-2" /> Add Record
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedRecords).map(([type, typeRecords]) => (
          <div key={type} className="border border-[#BACEC1] rounded-lg overflow-hidden">
            <div 
              className="bg-[#F6F4E8] p-3 flex items-center cursor-pointer"
              onClick={() => toggleFolder(type)}
            >
              {expandedFolders[type] ? <FaChevronDown className="mr-2" /> : <FaChevronRight className="mr-2" />}
              <FaFolder className="text-[#E59560] mr-2" />
              <span className="font-semibold">{getTypeLabel(type)} ({typeRecords.length})</span>
            </div>
            
            <AnimatePresence>
              {expandedFolders[type] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="divide-y divide-[#BACEC1]">
                    {typeRecords.map(record => (
                      <div 
                        key={record._id} 
                        className="p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="flex items-center">
                          <FaFileMedical className="text-[#325747] mr-2" />
                          <div>
                            <h3 className="font-medium">{record.title}</h3>
                            <p className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Record Detail Modal */}
       <AnimatePresence>
        {selectedRecord && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div 
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#325747]">{selectedRecord.title}</h2>
                    <p className="text-gray-600">
                      {new Date(selectedRecord.date).toLocaleString()} • {getTypeLabel(selectedRecord.type)}
                    </p>
                  </div>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedRecord(null)}
                  >
                    ✕
                  </button>
                </div>

                {/* Conditionally render based on record type */}
                {selectedRecord.type === 'vaccination' ? (
                  renderVaccinationDetails(selectedRecord)
               ) : selectedRecord.type === 'skin_detection' ? (
                 renderSkinDetectionDetails(selectedRecord.data)
               ) : (
                  <>
                    {selectedRecord.description && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-[#325747]">Description</h3>
                        <p>{selectedRecord.description}</p>
                      </div>
                    )}

                    {selectedRecord.images?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-[#325747] mb-2">Images</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedRecord.images.map((img, i) => (
                            <img 
                              key={i} 
                              src={`http://localhost:5000${img}`} 
                              alt={`Record ${i}`}
                              className="rounded-lg shadow-sm"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedRecord.notes && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-[#325747]">Notes</h3>
                        <p>{selectedRecord.notes}</p>
                      </div>
                    )}

                    {selectedRecord.data && (
                      <div className="bg-[#F6F4E8] p-4 rounded-lg">
                        <h3 className="font-semibold text-[#325747] mb-2">Details</h3>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedRecord.data, null, 2)}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PetHealthRecords;