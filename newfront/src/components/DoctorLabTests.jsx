import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFlask, faSearch, faPlus, 
  faClock, faCheck, faFileMedicalAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import DoctorHeader from './DoctorHeader';
import { motion } from 'framer-motion';

const DoctorLabTests = () => {
  const navigate = useNavigate();
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'pending',
    search: ''
  });

  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/doctor/lab-tests?status=${filter.status}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let filteredData = response.data;
        if (filter.search) {
          const searchTerm = filter.search.toLowerCase();
          filteredData = filteredData.filter(test => 
            test.pet_id?.name?.toLowerCase().includes(searchTerm) ||
            test.test_name?.toLowerCase().includes(searchTerm)
  )}
        
        setLabTests(filteredData);
      } catch (error) {
        console.error('Error fetching lab tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabTests();
  }, [filter]);

  const submitTestResults = (testId, results) => {
    const updateTest = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `http://localhost:5000/api/doctor/lab-tests/${testId}/results`,
          { results, summary: 'Test results submitted' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setLabTests(labTests.map(test => 
          test._id === testId ? { ...test, status: 'completed' } : test
        ));
      } catch (error) {
        console.error('Error updating lab test:', error);
      }
    };

    updateTest();
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
                        <FontAwesomeIcon icon={faFlask} className="text-[#325747]" />
                      </motion.div>
                      Laboratory Tests
                    </h1>
                    <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
                  </div>
                    <button 
                    onClick={() => navigate('/doctor-appointments/new')}
                    className="bg-[#E59560] text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    New Test
                  </button>
                </motion.div>
    
        

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#325747] mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by pet name or test name..."
                  value={filter.search}
                  onChange={(e) => setFilter({...filter, search: e.target.value})}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                />
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lab Tests List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#325747]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Pet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Appointment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labTests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No lab tests found
                    </td>
                  </tr>
                ) : (
                  labTests.map(test => (
                    <tr key={test._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#325747]">
                          {test.test_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {test.requirements}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#325747]">
                          {test.pet_id?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {test.pet_id?.species} ({test.pet_id?.breed})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#325747]">
                          {new Date(test.appointment_id?.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          test.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {test.status === 'pending' ? (
                          <button
                            onClick={() => navigate(`/doctor-lab-tests/${test._id}/results`)}
                            className="text-[#E59560] hover:text-[#d48550]"
                          >
                            <FontAwesomeIcon icon={faFileMedicalAlt} className="mr-1" />
                            Enter Results
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/doctor-lab-tests/${test._id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                            View Results
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLabTests;