import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const LabTestResultForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [labTest, setLabTest] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddParamModal, setShowAddParamModal] = useState(false);
  const [newParam, setNewParam] = useState({
    name: '',
    unit: '',
    normal_range: '',
    value: '',
    flag: 'normal'
  });
  
  const [formData, setFormData] = useState({
    results: [],
    summary: 'normal',
    vet_notes: '',
    recommendations: ''
  });

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/vet/lab-tests/${id}/parameters`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        setLabTest(response.data.test);
        
        // Initialize form with empty results for each parameter
        const initialResults = response.data.parameters.map(param => ({
          name: param.name,
          unit: param.unit,
          normal_range: param.normal_range,
          value: '',
          flag: 'normal'
        }));
        
        setParameters(initialResults);
        setFormData(prev => ({
          ...prev,
          results: initialResults
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching test data:', error);
        setLoading(false);
      }
    };

    fetchTestData();
  }, [id]);

  const handleResultChange = (index, field, value) => {
    const newResults = [...parameters];
    
    if (field === 'value') {
      newResults[index].value = value;
      
      // Auto-detect if value is outside normal range
      if (value !== '') {
        const rangeParts = newResults[index].normal_range.split('-');
        if (rangeParts.length === 2) {
          const [min, max] = rangeParts.map(Number);
          const numValue = parseFloat(value);
          
          if (!isNaN(numValue)) {
            if (numValue < min) newResults[index].flag = 'low';
            else if (numValue > max) newResults[index].flag = 'high';
            else newResults[index].flag = 'normal';
          }
        }
      }
    } else {
      newResults[index][field] = value;
    }
    
    setParameters(newResults);
    setFormData(prev => ({
      ...prev,
      results: newResults
    }));
  };

  const handleAddParameter = () => {
    setParameters([...parameters, {...newParam}]);
    setFormData(prev => ({
      ...prev,
      results: [...prev.results, {...newParam}]
    }));
    setNewParam({
      name: '',
      unit: '',
      normal_range: '',
      value: '',
      flag: 'normal'
    });
    setShowAddParamModal(false);
  };

  const handleRemoveParameter = (index) => {
    const newResults = [...parameters];
    newResults.splice(index, 1);
    setParameters(newResults);
    setFormData(prev => ({
      ...prev,
      results: newResults
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/vet/lab-tests/${id}/complete`, 
        formData, 
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (response.data.success) {
        navigate('/clinic/lab-test');
      } else {
        alert('Failed to submit results: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      alert(`Failed to submit results: ${error.response?.data?.message || error.message}`);
    } 
  };

  if (loading) return <div className="p-4">Loading test information...</div>;
  if (!labTest) return <div className="p-4">Test not found</div>;

  return (
    <div className="container mx-auto p-4 bg-[#F6F4E8] font-laila" style={{marginTop:"80px"}}>
      {/* Add Parameter Modal */}
      {showAddParamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add New Parameter</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Parameter Name</label>
                <input
                  type="text"
                  value={newParam.name}
                  onChange={(e) => setNewParam({...newParam, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={newParam.unit}
                  onChange={(e) => setNewParam({...newParam, unit: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Normal Range</label>
                <input
                  type="text"
                  value={newParam.normal_range}
                  onChange={(e) => setNewParam({...newParam, normal_range: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                  placeholder="e.g., 5.5-8.5"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddParamModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddParameter}
                className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-700"
              >
                Add Parameter
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg p-6 w-3/4 "style={{marginLeft:"170px"}}>
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-[#325747]"style={{marginLeft:"430px"}}>Lab Test Results</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-40 mt-4">
            <div>
              <h2 className="text-lg font-semibold">{labTest.test_name}</h2>
              <p className="text-gray-600">{labTest.requirements}</p>
            </div>
            <div style={{marginLeft:"300px"}}>
              <p><span className="font-medium">Pet:</span> {labTest.pet_info?.name || labTest.pet_id?.name}</p>
              <p><span className="font-medium">Species:</span> {labTest.pet_info?.species || labTest.pet_id?.species}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Test Parameters</h3>
              <button
                type="button"
                onClick={() => setShowAddParamModal(true)}
                className="px-3 py-1 bg-green-800 text-white rounded-md text-sm hover:bg-green-700"
              >
                Add Parameter
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border text-left">Parameter</th>
                    <th className="py-2 px-4 border text-left">Result</th>
                    <th className="py-2 px-4 border text-left">Unit</th>
                    <th className="py-2 px-4 border text-left">Normal Range</th>
                    <th className="py-2 px-4 border text-left">Status</th>
                    <th className="py-2 px-4 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleResultChange(index, 'name', e.target.value)}
                          className="w-full p-1 border rounded"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                          className="w-full p-1 border rounded"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border">
                        <input
                          type="text"
                          value={param.unit}
                          onChange={(e) => handleResultChange(index, 'unit', e.target.value)}
                          className="w-full p-1 border rounded"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border">
                        <input
                          type="text"
                          value={param.normal_range}
                          onChange={(e) => handleResultChange(index, 'normal_range', e.target.value)}
                          className="w-full p-1 border rounded"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border">
                        <select
                          value={param.flag}
                          onChange={(e) => handleResultChange(index, 'flag', e.target.value)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                          <option value="critical">Critical</option>
                        </select>
                      </td>
                      <td className="py-2 px-4 border">
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Overall Summary</label>
              <select
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="inconclusive">Inconclusive</option>
              </select>
            </div>

          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Veterinarian Notes</label>
            <textarea
              value={formData.vet_notes}
              onChange={(e) => setFormData({...formData, vet_notes: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Enter any observations or notes about the test results"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Recommendations</label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Enter any follow-up recommendations"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/clinic')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#325747] text-white rounded-md "
            >
              Submit Results
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabTestResultForm;