import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaw } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const FoundPetModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    estimatedAge: '',
    gender: 'unknown',
    distinguishingFeatures: '',
    foundLocation: '',
    foundDate: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-[#325747] flex items-center">
            <FontAwesomeIcon icon={faPaw} className="mr-2" />
            Add Found Pet
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (if known)</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Leave blank if unknown"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed (if known)</label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Leave blank if unknown"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Age</label>
              <input
                type="text"
                name="estimatedAge"
                value={formData.estimatedAge}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., 2 years, 6 months"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distinguishing Features</label>
              <textarea
                name="distinguishingFeatures"
                value={formData.distinguishingFeatures}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows="2"
                placeholder="Describe any unique markings, colors, or features"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Found Location</label>
                <input
                  type="text"
                  name="foundLocation"
                  value={formData.foundLocation}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Where found?"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Found Date</label>
                <input
                  type="date"
                  name="foundDate"
                  value={formData.foundDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 text-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-[#325747] text-white rounded-lg text-sm"
            >
              Add Found Pet
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FoundPetModal;
