import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faStar } from '@fortawesome/free-solid-svg-icons';

const TrialModal = ({ guideId, placeId, placeName, onClose, onSuccess }) => {
  const [experience, setExperience] = useState('');
  const [tips, setTips] = useState('');
  const [rating, setRating] = useState(5);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!experience) {
      setError('Please share your experience');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/travel-guide/${guideId}/trials`,
        { 
          experience, 
          tips, 
          rating, 
          photos,
          placeId,
          placeName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit travel experience');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => URL.createObjectURL(file));
    setPhotos([...photos, ...newPhotos]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Your Travel Experience</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {placeName && (
          <div className="mb-4 p-3 bg-[#F6F4E8] rounded-lg">
            <p className="font-semibold">Sharing experience for:</p>
            <p className="text-[#325747]">{placeName}</p>
          </div>
        )}
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Your Experience</label>
            <textarea
              className="w-full p-3 border rounded-lg"
              rows="4"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Tell us about your trip with your pet..."
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Travel Tips</label>
            <textarea
              className="w-full p-3 border rounded-lg"
              rows="3"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="Any tips for other pet owners traveling here?"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Rating</label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl focus:outline-none"
                >
                  <FontAwesomeIcon 
                    icon={faStar} 
                    className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Photos (Optional)</label>
            <input
              type="file"
              multiple
              onChange={handlePhotoUpload}
              className="w-full p-2 border rounded-lg"
              accept="image/*"
            />
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {photos.map((photo, i) => (
                  <div key={i} className="relative">
                    <img 
                      src={photo} 
                      alt={`Preview ${i}`}
                      className="h-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                      className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#E59560] text-white px-4 py-2 rounded-lg hover:bg-[#d48550] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Share Experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrialModal;
