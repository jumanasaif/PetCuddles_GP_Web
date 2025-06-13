import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCheck } from '@fortawesome/free-solid-svg-icons';

const FoundPetAdoptionForm = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    aboutPet: '',
    deliveryPlace: '',
    questions: ['']
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = value;
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const addQuestion = () => {
    setFormData(prev => ({ ...prev, questions: [...prev.questions, ''] }));
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(
        `http://localhost:5000/api/vet/found-pets/${petId}/adopt`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('Pet listed for adoption successfully!');
      navigate('/clinic/patients');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error listing pet for adoption');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto"style={{marginTop:"80px"}}>
      <h2 className="text-2xl font-bold text-[#325747] mb-6 flex items-center">
        <FontAwesomeIcon icon={faPaw} className="mr-3 text-[#E59560]" />
        List Found Pet for Adoption
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            About this Pet
          </label>
          <textarea
            name="aboutPet"
            value={formData.aboutPet}
            onChange={handleChange}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Place
          </label>
          <input
            type="text"
            name="deliveryPlace"
            value={formData.deliveryPlace}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adoption Questions
          </label>
          {formData.questions.map((question, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={question}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#325747] focus:border-[#325747]"
                
              />
              {formData.questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="ml-2 px-3 bg-red-500 text-white rounded-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="mt-2 px-4 py-2 bg-[#325747] text-white rounded-lg"
          >
            Add Question
          </button>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#E59560] text-white rounded-lg hover:bg-[#d48550] flex items-center"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            {loading ? 'Listing...' : 'List for Adoption'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoundPetAdoptionForm;