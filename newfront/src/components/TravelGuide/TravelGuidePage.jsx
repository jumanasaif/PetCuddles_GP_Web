import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHospital, faShoppingCart, faTree, faUtensils, faPaw,
  faHome, faBed, faShower, faHiking, faCoffee, faPills,
  faPlus, faComment, faChevronDown, faChevronUp, faStar
} from '@fortawesome/free-solid-svg-icons';
import TrialModal from './TrialModal';
import { motion, AnimatePresence } from 'framer-motion';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const iconMap = {
  veterinary: { icon: faHospital, color: '#E59560' },
  pet_shop: { icon: faShoppingCart, color: '#325747' },
  animal_shelter: { icon: faHome, color: '#8C5E58' },
  animal_boarding: { icon: faBed, color: '#4A7C59' },
  pet_grooming: { icon: faShower, color: '#7A6F9B' },
  dog_park: { icon: faTree, color: '#325747' },
  park: { icon: faTree, color: '#4A7C59' },
  pet_friendly_park: { icon: faTree, color: '#325747' },
  hiking_trail: { icon: faHiking, color: '#8C5E58' },
  pet_restaurant: { icon: faUtensils, color: '#E59560' },
  pet_cafe: { icon: faCoffee, color: '#8C5E58' },
  pharmacy: { icon: faPills, color: '#7A6F9B' },
  default: { icon: faPaw, color: '#325747' }
};

const getIcon = (type) => {
  const { icon: iconFa, color } = iconMap[type] || iconMap.default;
  return L.divIcon({
    html: `<div style="color: ${color}; font-size: 24px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
            <i class="fa fa-${iconFa.iconName}"></i>
          </div>`,
    className: 'custom-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
};

const ExperienceCard = ({ trial }) => {
  return (
    <div className="border border-[#BACEC1] rounded-lg p-4 hover:shadow-md transition-shadow mb-4">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-[#325747] text-[#F6F4E8] flex items-center justify-center mr-3 font-bold">
          {trial.user?.fullName?.charAt(0) || 'U'}
        </div>
        <div>
          <h4 className="font-bold text-[#325747]">
            {trial.user?.fullName || 'Anonymous'}
          </h4>
          <p className="text-gray-500 text-sm">
            {new Date(trial.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      
      <div className="mb-3">
        <span className="font-semibold text-[#E59560]">Rating:</span>
        <div className="inline-flex ml-2">
          {[...Array(5)].map((_, star) => (
            <FontAwesomeIcon 
              key={star} 
              icon={faStar} 
              className={star < trial.rating ? 'text-yellow-400' : 'text-gray-300'} 
              size="sm"
            />
          ))}
        </div>
      </div>
      
      <p className="text-gray-700 mb-3">{trial.experience}</p>
      
      {trial.tips && (
        <div className="bg-[#F6F4E8] p-3 rounded-lg mb-3 border border-[#BACEC1]">
          <h5 className="font-semibold text-[#325747] mb-1">Travel Tips</h5>
          <p className="text-gray-700">{trial.tips}</p>
        </div>
      )}
      
      {trial.photos?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2">
          {trial.photos.map((photo, idx) => (
            <img 
              key={idx} 
              src={photo} 
              alt={`Travel photo ${idx+1}`}
              className="h-24 rounded-lg object-cover border border-[#BACEC1]"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150';
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategorySection = ({ title, icon, color, places, isOpen, onToggle, userTrials }) => {
  return (
    <motion.div className="mb-6 rounded-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onToggle}
        className={`w-full flex justify-between items-center p-4 ${color} text-white cursor-pointer`}
      >
        <div className="flex items-center">
          <FontAwesomeIcon icon={icon} className="mr-3 text-xl" />
          <h3 className="text-xl font-bold">{title} ({places.length})</h3>
        </div>
        <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {places.map((place, i) => {
                // Find experiences for this place
                const placeExperiences = userTrials?.filter(trial => 
                  trial.placeId === place.id || 
                  (trial.placeName && trial.placeName === place.tags?.name)
                ) || [];
                
                return (
                  <motion.div
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#F6F4E8] p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-bold text-[#325747] mb-2">{place.tags?.name || title.slice(0, -1)}</h4>

                    {place.tags?.['addr:street'] && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">Address:</span> {place.tags?.['addr:street']} {place.tags?.['addr:housenumber']}
                      </p>
                    )}
                      {/* Display all available information */}
  {Object.entries(place.tags || {}).map(([key, value]) => {
    // Skip some internal OSM tags and the name we already displayed
    if (key === 'name' || key.startsWith('addr:')) return null;
    
    // Format the key to be more readable
    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return (
      <p key={key} className="text-sm text-gray-600 mb-1">
        <span className="font-semibold">{formattedKey}:</span> {value}
      </p>
    );
  })}
  
  {/* Keep the address display as before */}
  {place.tags?.['addr:street'] && (
    <p className="text-sm text-gray-600 mb-1">
      <span className="font-semibold">Address:</span> {place.tags?.['addr:street']} {place.tags?.['addr:housenumber']}
    </p>
  )}
                    
                    {/* Display experiences for this place */}
                    {placeExperiences.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <h5 className="font-semibold text-[#E59560] mb-2">
                          User Experiences ({placeExperiences.length})
                        </h5>
                        <div className="space-y-3">
                          {placeExperiences.slice(0, 2).map((trial, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="flex items-center mb-1">
                                <div className="text-yellow-400 mr-1">
                                  {[...Array(trial.rating)].map((_, i) => (
                                    <FontAwesomeIcon key={i} icon={faStar} size="xs" />
                                  ))}
                                </div>
                                <span className="text-gray-600 text-xs">
                                  by {trial.user?.fullName || 'Anonymous'}
                                </span>
                              </div>
                              <p className="text-gray-700 line-clamp-2">{trial.experience}</p>
                            </div>
                          ))}
                        </div>
                        {placeExperiences.length > 2 && (
                          <p className="text-xs text-[#E59560] mt-1">
                            +{placeExperiences.length - 2} more experiences
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TravelGuidePage = () => {
  const [location, setLocation] = useState('');
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const navigate = useNavigate();

  const fetchGuide = async () => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    try {
      // First get the Overpass data
      const overpassResponse = await axios.get(
        `http://localhost:5000/api/travel-guide/location?city=${encodeURIComponent(location)}`
      );

      // Then get or create the travel guide entry with populated user data
      const guideResponse = await axios.get(
        `http://localhost:5000/api/travel-guide/location/guide?city=${encodeURIComponent(location)}&lat=${overpassResponse.data.location.coordinates.lat}&lng=${overpassResponse.data.location.coordinates.lng}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Combine the data
      setGuide({
        ...overpassResponse.data,
        ...guideResponse.data,
        _id: guideResponse.data._id
      });

      // Initialize expanded categories
      const categories = getCategories(overpassResponse.data?.overpassData || []);
      const initialExpanded = {};
      categories.forEach(cat => {
        initialExpanded[cat.key] = true;
      });
      setExpandedCategories(initialExpanded);
    } catch (err) {
      console.error('Error fetching guide:', err);
      setError(err.response?.data?.message || 'Failed to fetch travel guide data');
    } finally {
      setLoading(false);
    }
  };

  const getCategories = (overpassData) => {
    if (!overpassData) return [];
    
    return [
      { key: 'veterinary', title: 'Veterinary Clinics', icon: faHospital, color: 'bg-[#E59560]', 
        filter: item => item.tags?.amenity === 'veterinary' },
      { key: 'pet_shops', title: 'Pet Shops', icon: faShoppingCart, color: 'bg-[#325747]', 
        filter: item => item.tags?.shop === 'pet' },
      { key: 'animal_shelters', title: 'Animal Shelters', icon: faHome, color: 'bg-[#8C5E58]', 
        filter: item => item.tags?.amenity === 'animal_shelter' || item.tags?.shop === 'animal_breeding' },
      { key: 'animal_boarding', title: 'Pet Boarding', icon: faBed, color: 'bg-[#4A7C59]', 
        filter: item => item.tags?.amenity === 'animal_boarding' },
      { key: 'pet_grooming', title: 'Pet Grooming', icon: faShower, color: 'bg-[#7A6F9B]', 
        filter: item => item.tags?.shop === 'pet_grooming' },
      { key: 'dog_parks', title: 'Dog Parks', icon: faTree, color: 'bg-[#325747]', 
        filter: item => item.tags?.leisure === 'dog_park' },
      { key: 'pet_friendly_parks', title: 'Pet-Friendly Parks', icon: faTree, color: 'bg-[#325747]', 
        filter: item => item.tags?.leisure === 'park' && item.tags?.dog === 'yes' },
      { key: 'parks', title: 'Parks', icon: faTree, color: 'bg-[#4A7C59]', 
        filter: item => item.tags?.leisure === 'park' && !item.tags?.dog },
      { key: 'hiking_trails', title: 'Pet-Friendly Trails', icon: faHiking, color: 'bg-[#8C5E58]', 
        filter: item => (item.tags?.tourism === 'trail' || item.tags?.route === 'hiking') && item.tags?.dog === 'yes' },
      { key: 'pet_restaurants', title: 'Pet-Friendly Restaurants', icon: faUtensils, color: 'bg-[#E59560]', 
        filter: item => item.tags?.amenity === 'restaurant' && item.tags?.dog === 'yes' },
      { key: 'pet_cafes', title: 'Pet-Friendly Cafes', icon: faCoffee, color: 'bg-[#8C5E58]', 
        filter: item => item.tags?.amenity === 'cafe' && item.tags?.dog === 'yes' },
      { key: 'pharmacies', title: 'Pet Pharmacies', icon: faPills, color: 'bg-[#7A6F9B]', 
        filter: item => item.tags?.amenity === 'pharmacy' && item.tags?.dispensing?.match(/vet|animal/i) }
    ].map(cat => ({
      ...cat,
      places: overpassData.filter(cat.filter)
    })).filter(cat => cat.places.length > 0);
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const handleAddTrial = () => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    setShowTrialModal(true);
  };

  const categories = getCategories(guide?.overpassData || []);

  // Get experiences for the selected place
  const selectedPlaceExperiences = selectedPlace 
    ? guide?.userTrials?.filter(trial => 
        trial.placeId === selectedPlace.id || 
        (trial.placeName && trial.placeName === selectedPlace.tags?.name)
      ) || []
    : [];

  return (
    <div className="min-h-screen bg-[#F6F4E8] font-laila" style={{ paddingTop: '80px' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          className="bg-[#325747] text-white rounded-xl p-8 mb-8 shadow-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4">Pet-Friendly Travel Guide</h1>
          <p className="text-xl mb-6">Discover the best places for you and your furry friend</p>
          
          {/* Search Section */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter city or location..."
              className="flex-grow p-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E59560]"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchGuide()}
            />
            <button
              onClick={fetchGuide}
              disabled={loading}
              className="bg-[#E59560] hover:bg-[#d48550] text-white px-8 py-4 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : 'Find Places'}
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {guide && (
          <>
            {/* Map and Selected Place Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Map Section */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '500px' }}>
                <MapContainer
                  center={[guide.location?.coordinates?.lat || 0, guide.location?.coordinates?.lng || 0]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {guide.overpassData?.filter(place => place.lat && place.lon).map((place, i) => {
                    let type = 'default';
                    if (place.tags?.amenity === 'veterinary') type = 'veterinary';
                    else if (place.tags?.shop === 'pet') type = 'pet_shop';
                    else if (place.tags?.leisure === 'dog_park') type = 'dog_park';
                    else if (place.tags?.leisure === 'park' && place.tags?.dog === 'yes') type = 'pet_friendly_parks';
                    else if (place.tags?.leisure === 'park') type = 'parks';
                    else if ((place.tags?.tourism === 'trail' || place.tags?.route === 'hiking') && place.tags?.dog === 'yes') type = 'hiking_trails';
                    else if (place.tags?.amenity === 'restaurant' && place.tags?.dog === 'yes') type = 'pet_restaurants';
                    else if (place.tags?.amenity === 'cafe' && place.tags?.dog === 'yes') type = 'pet_cafes';
                    else if (place.tags?.amenity === 'pharmacy' && place.tags?.dispensing?.match(/vet|animal/i)) type = 'pharmacies';
                    
                    // Check if this place has experiences
                    const hasExperiences = guide.userTrials?.some(trial => 
                      trial.placeId === place.id || 
                      (trial.placeName && trial.placeName === place.tags?.name)
                    );
                    
                    return (
                      <Marker
                        key={i}
                        position={[place.lat, place.lon]}
                        icon={getIcon(type)}
                        eventHandlers={{
                          click: () => setSelectedPlace(place)
                        }}
                      >
                        <Popup className="custom-popup">
                          <div className="max-w-xs">
                            <h3 className="font-bold text-[#325747]">
                              {place.tags?.name || 
                                (type === 'veterinary' ? 'Veterinary Clinic' : 
                                 type === 'pet_shop' ? 'Pet Shop' : 
                                 type === 'dog_park' ? 'Dog Park' : 'Location')}
                            </h3>
                            {place.tags?.['addr:street'] && (
                              <p className="text-sm">{place.tags?.['addr:street']} {place.tags?.['addr:housenumber']}</p>
                            )}
                            {hasExperiences && (
                              <p className="text-xs text-[#E59560] mt-1">
                                <FontAwesomeIcon icon={faStar} className="mr-1" />
                                Has user experiences
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
              
              {/* Selected Place Details */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {selectedPlace ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-[#325747] mb-4">
                        {selectedPlace.tags?.name || 
                          (selectedPlace.tags?.amenity === 'veterinary' ? 'Veterinary Clinic' : 
                           selectedPlace.tags?.shop === 'pet' ? 'Pet Shop' : 
                           selectedPlace.tags?.leisure === 'dog_park' ? 'Dog Park' : 'Location')}
                      </h2>
                      
                      <div className="space-y-4 mb-6">
                        {selectedPlace.tags?.['addr:street'] && (
                          <div>
                            <h3 className="font-bold text-[#E59560]">Address</h3>
                            <p>
                              {selectedPlace.tags?.['addr:street']} {selectedPlace.tags?.['addr:housenumber']}<br />
                              {selectedPlace.tags?.['addr:city'] || guide.location.city}
                            </p>
                          </div>
                        )}
                        
                        {selectedPlace.tags?.phone && (
                          <div>
                            <h3 className="font-bold text-[#E59560]">Phone</h3>
                            <a href={`tel:${selectedPlace.tags.phone}`} className="text-[#325747] hover:underline">
                              {selectedPlace.tags.phone}
                            </a>
                          </div>
                        )}
                        
                        {selectedPlace.tags?.website && (
                          <div>
                            <h3 className="font-bold text-[#E59560]">Website</h3>
                            <a 
                              href={selectedPlace.tags.website.startsWith('http') ? selectedPlace.tags.website : `https://${selectedPlace.tags.website}`}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[#325747] hover:underline break-words"
                            >
                              {selectedPlace.tags.website}
                            </a>
                          </div>
                        )}
                        
                        <div>
                          <h3 className="font-bold text-[#E59560]">Pet Policies</h3>
                          {selectedPlace.tags?.dog ? (
                            <p>Dogs allowed: <span className="font-semibold">{selectedPlace.tags.dog === 'yes' ? 'Yes' : 'No'}</span></p>
                          ) : (
                            <p>No pet policy information available</p>
                          )}
                        </div>
                        
                        {selectedPlace.tags?.opening_hours && (
                          <div>
                            <h3 className="font-bold text-[#E59560]">Opening Hours</h3>
                            <p>{selectedPlace.tags.opening_hours}</p>
                          </div>
                        )}
                        
                        {selectedPlace.tags?.description && (
                          <div>
                            <h3 className="font-bold text-[#E59560]">Description</h3>
                            <p>{selectedPlace.tags.description}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Experiences for this place */}
                      <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-[#325747]">
                            User Experiences ({selectedPlaceExperiences.length})
                          </h3>
                          <button 
                            onClick={handleAddTrial}
                            className="bg-[#E59560] hover:bg-[#d48550] text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                          >
                            <FontAwesomeIcon icon={faPlus} className="mr-1" />
                            Add Experience
                          </button>
                        </div>
                        
                        {selectedPlaceExperiences.length > 0 ? (
                          <div className="space-y-4">
                            {selectedPlaceExperiences.map((trial, i) => (
                              <ExperienceCard key={i} trial={trial} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-[#F6F4E8] rounded-lg">
                            <FontAwesomeIcon icon={faComment} className="text-2xl text-[#BACEC1] mb-2" />
                            <p className="text-gray-500">No experiences shared yet for this place</p>
                            <button 
                              onClick={handleAddTrial}
                              className="mt-2 text-[#E59560] hover:underline"
                            >
                              Be the first to share your experience
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-6 text-center h-full flex items-center justify-center">
                    <div>
                      <FontAwesomeIcon icon={faPaw} className="text-4xl text-[#BACEC1] mb-4" />
                      <p className="text-gray-500">Select a location on the map to see details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pet-Friendly Places List */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg p-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#325747]">
                  Pet-Friendly Places in {guide.location.city}
                </h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      const allOpen = {};
                      categories.forEach(cat => {
                        allOpen[cat.key] = true;
                      });
                      setExpandedCategories(allOpen);
                    }}
                    className="text-sm bg-[#BACEC1] hover:bg-[#9db8a9] text-[#325747] px-3 py-1 rounded"
                  >
                    Expand All
                  </button>
                  <button 
                    onClick={() => {
                      const allClosed = {};
                      categories.forEach(cat => {
                        allClosed[cat.key] = false;
                      });
                      setExpandedCategories(allClosed);
                    }}
                    className="text-sm bg-[#BACEC1] hover:bg-[#9db8a9] text-[#325747] px-3 py-1 rounded"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {categories.map(category => (
                  <CategorySection
                    key={category.key}
                    title={category.title}
                    icon={category.icon}
                    color={category.color}
                    places={category.places}
                    isOpen={expandedCategories[category.key]}
                    onToggle={() => toggleCategory(category.key)}
                    userTrials={guide.userTrials}
                  />
                ))}
              </div>
            </motion.div>
            
            {/* All User Travel Trials */}
            {guide?.userTrials?.length >= 0 && (
              <motion.div 
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#325747]">All Travel Experiences</h2>
                  <button 
                    onClick={handleAddTrial}
                    className="bg-[#E59560] hover:bg-[#d48550] text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Share Experience
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {guide.userTrials.map((trial, i) => (
                    <ExperienceCard key={i} trial={trial} />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
        
        {/* Trial Modal */}
        {showTrialModal && (
          <TrialModal 
            guideId={guide?._id}
            placeId={selectedPlace?.id}
            placeName={selectedPlace?.tags?.name}
            onClose={() => setShowTrialModal(false)}
            onSuccess={(newTrial) => {
              setGuide(prev => ({
                ...prev,
                userTrials: [...(prev.userTrials || []), newTrial]
              }));
              setShowTrialModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TravelGuidePage;
