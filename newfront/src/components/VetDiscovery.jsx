import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faSearch, 
  faFilter, 
  faStar,
  faUserMd,
  faArrowRight,
  faHome,
  faRoute
} from '@fortawesome/free-solid-svg-icons';
import ReactStars from 'react-stars';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const VetDiscovery = () => {
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    sortBy: 'distance',
    temporaryCareOnly: false
  });
  const [userLocation, setUserLocation] = useState(null);
  const [nearestClinic, setNearestClinic] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([31.5, 35]); // Default center 
  const mapRef = useRef();
  const navigate = useNavigate();
  useEffect(() => {
  if (userLocation?.lat && userLocation?.lng) {
    setMapCenter([userLocation.lat, userLocation.lng]);
  }
}, [userLocation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Get user location
        const userRes = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userCoords = userRes.data.coordinates;
        setUserLocation(userCoords);
        setMapCenter([userCoords.lat, userCoords.lng]);
        
        // Get all clinics
        const clinicsRes = await axios.get('http://localhost:5000/api/vet/public-clinics');
        const clinicsWithDistance = clinicsRes.data.map(clinic => ({
          ...clinic,
          distance: calculateDistance(
            userCoords.lat,
            userCoords.lng,
            clinic.coordinates.lat,
            clinic.coordinates.lng
          )
        }));
        
        setClinics(clinicsWithDistance);
        setFilteredClinics(clinicsWithDistance);
        
        // Find nearest clinic
        if (clinicsWithDistance.length > 0) {
          const nearest = clinicsWithDistance.reduce((prev, current) => 
            (prev.distance < current.distance) ? prev : current
          );
          setNearestClinic(nearest);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Apply filters
    let results = [...clinics];
    
    // Search filter
    if (searchTerm) {
      results = results.filter(clinic => 
        clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (clinic.village && clinic.village.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // City filter
    if (filters.city) {
      results = results.filter(clinic => 
        clinic.city.toLowerCase() === filters.city.toLowerCase()
      );
    }
    
    // Temporary care filter
    if (filters.temporaryCareOnly) {
      results = results.filter(clinic => 
        clinic.temporaryCareSettings?.providesTemporaryCare
      );
    }
    
    // Sorting
    if (filters.sortBy === 'distance') {
      results.sort((a, b) => a.distance - b.distance);
    } else if (filters.sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'name') {
      results.sort((a, b) => a.clinicName.localeCompare(b.clinicName));
    }
    
    setFilteredClinics(results);
  }, [searchTerm, filters, clinics]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance between two coordinates
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };



  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6" style={{marginTop:"80px"}}>
      {/* Interactive Map Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 mb-8"
        style={{ height: '400px' }}
      >
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          whenCreated={map => { mapRef.current = map }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* User location marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>
                <div className="font-bold">Your Location</div>
              </Popup>
            </Marker>
          )}
          
          {/* Clinic markers */}
          {filteredClinics.map(clinic => (
  clinic.coordinates?.lat && clinic.coordinates?.lng && (
    <Marker 
      key={clinic._id}
      position={[clinic.coordinates.lat, clinic.coordinates.lng]}
              icon={L.icon({
                ...L.Icon.Default.prototype.options,
                iconUrl: clinic._id === nearestClinic?._id 
                  ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'
                  : clinic.temporaryCareSettings?.providesTemporaryCare
                    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png'
                    : L.Icon.Default.prototype.options.iconUrl,
              })}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold">{clinic.clinicName}</h3>
                  <p>{clinic.village ? `${clinic.village}, ` : ''}{clinic.city}</p>
                  <p className="text-[#E59560] font-medium">
                    {clinic.distance?.toFixed(1)} km away
                  </p>
                  {clinic.temporaryCareSettings?.providesTemporaryCare && (
                    <p className="text-sm text-green-600">
                      <FontAwesomeIcon icon={faHome} className="mr-1" />
                      Offers Temporary Care
                    </p>
                  )}
                  
                </div>
              </Popup>
            </Marker>
           )
))}
          
          {/* Route visualization */}
          {selectedRoute && (
            <Polyline
              positions={[
                [selectedRoute.start[0], selectedRoute.start[1]],
                [selectedRoute.end[0], selectedRoute.end[1]]
              ]}
              color="#E59560"
              weight={3}
              dashArray="5, 5"
            />
          )}
        </MapContainer>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or location..."
              className="w-full p-3 pl-10 border border-[#BACEC1] rounded-xl focus:border-[#E59560]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
            />
          </div>
          
          <div className="relative">
            <select
              className="w-full p-3 pl-10 border border-[#BACEC1] rounded-xl focus:border-[#E59560]"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
            >
              <option value="">All Cities</option>
              {[...new Set(clinics.map(c => c.city))].map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <FontAwesomeIcon 
              icon={faFilter} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
            />
          </div>
          
          <div className="relative">
            <select
              className="w-full p-3 pl-10 border border-[#BACEC1] rounded-xl focus:border-[#E59560]"
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              <option value="distance">Nearest First</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Alphabetical</option>
            </select>
            <FontAwesomeIcon 
              icon={faFilter} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={filters.temporaryCareOnly}
                  onChange={() => setFilters({...filters, temporaryCareOnly: !filters.temporaryCareOnly})}
                />
                <div className={`block w-14 h-8 rounded-full ${filters.temporaryCareOnly ? 'bg-[#325747]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${filters.temporaryCareOnly ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <div className="ml-3 text-gray-700 font-medium flex items-center">
                <FontAwesomeIcon icon={faHome} className="mr-2 text-[#E59560]" />
                Temporary Care Only
              </div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Clinics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClinics.length > 0 ? (
          filteredClinics.map((clinic, index) => (
            <motion.div
              key={clinic._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <img 
                    src={`http://localhost:5000${clinic.profileImage}`} 
                    alt={clinic.clinicName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#E59560]"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-[#325747]">{clinic.clinicName}</h3>
                    <div className="flex items-center gap-2 text-[#607169] mt-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>
                        {clinic.village ? `${clinic.village}, ` : ''}{clinic.city}
                      </span>
                    </div>
                  
                    <div className="text-sm text-[#E59560] mt-1">
                      {clinic.distance?.toFixed(1)} km away
                      {clinic._id === nearestClinic?._id && (
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                          Nearest
                        </span>
                      )}
                    </div>
                    {clinic.temporaryCareSettings?.providesTemporaryCare && (
                      <div className="inline-block text-[#E59560] text-xs py-1 rounded-full mb-2">
                        <FontAwesomeIcon icon={faHome} className="mr-1" />
                        Offers Temporary Care
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <ReactStars
                      count={5}
                      value={4.5} // Replace with actual rating from your data
                      size={20}
                      color2={'#E59560'}
                      edit={false}
                    />
                    <span className="text-sm text-[#607169]">(128)</span>
                  </div>
                  
                  <div className="flex gap-2">
                  
                    <button 
                      onClick={() => navigate(`/vet-profile/${clinic._id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#1e3a2b]"
                    >
                      View
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 text-lg">
              No clinics found matching your criteria
            </p>
            {filters.temporaryCareOnly && (
              <button
                onClick={() => setFilters({...filters, temporaryCareOnly: false})}
                className="mt-4 px-4 py-2 bg-[#325747] text-white rounded-lg"
              >
                Show All Clinics
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VetDiscovery;
