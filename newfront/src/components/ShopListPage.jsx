import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faSearch, 
  faFilter, 
  faStar,
  faShoppingCart,
  faArrowRight,
  faRoute,
  faTruck // Added delivery truck icon
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

const ShopListPage = () => {
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    sortBy: 'distance',
    petType: '',
    delivery: 'all' // Added delivery filter
  });
  const [userLocation, setUserLocation] = useState(null);
  const [nearestShop, setNearestShop] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([31.5, 35]); // Default center (Israel)
  const mapRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
  if (userLocation?.lat && userLocation?.lng) {
    setMapCenter([userLocation.lat, userLocation.lng]);
  }
}, [userLocation]);

  // Fetch user location only once on component mount
useEffect(() => {
  const fetchUserLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const userRes = await axios.get('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userCoords = userRes.data.coordinates;
      
      // Validate coordinates before setting
      if (userCoords?.lat && userCoords?.lng) {
        setUserLocation(userCoords);
        setMapCenter([userCoords.lat, userCoords.lng]);
      } else {
        throw new Error('Invalid user coordinates');
      }
    } catch (err) {
      console.error('Error fetching user location:', err);
      // Set default to Tel Aviv coordinates if user location fails
      setMapCenter([32.0853, 34.7818]);
      toast.warning('Using default location');
    }
  };

  fetchUserLocation();
}, []);

  // Fetch shops when userLocation changes
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/shop');
        const shopsWithDistance = response.data.map(shop => ({
          ...shop,
          distance: userLocation?.lat && userLocation?.lng && shop.coordinates?.lat && shop.coordinates?.lng
            ? calculateDistance(
                userLocation.lat,
                userLocation.lng,
                shop.coordinates.lat,
                shop.coordinates.lng
              )
            : null
        }));
        
        setShops(shopsWithDistance);
        
        // Find nearest shop
        if (shopsWithDistance.length > 0) {
          const shopsWithValidDistance = shopsWithDistance.filter(s => s.distance !== null);
          if (shopsWithValidDistance.length > 0) {
            const nearest = shopsWithValidDistance.reduce((prev, current) => 
              (prev.distance < current.distance) ? prev : current
            );
            setNearestShop(nearest);
          }
        }
      } catch (err) {
        console.error('Error fetching shops:', err);
        toast.error('Failed to load shops');
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [userLocation]);

  // Apply filters when searchTerm, filters, shops, or userLocation changes
  useEffect(() => {
    // Apply filters
    let results = [...shops];
    
    // Search filter
    if (searchTerm) {
      results = results.filter(shop => 
        shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shop.village && shop.village.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // City filter
    if (filters.city) {
      results = results.filter(shop => 
        shop.city.toLowerCase() === filters.city.toLowerCase()
      );
    }
    
    // Pet type filter
    if (filters.petType) {
      results = results.filter(shop => 
        shop.petTypes?.includes(filters.petType)
      );
    }
    
    // Delivery filter
    if (filters.delivery === 'yes') {
      results = results.filter(shop => shop.DeliveryProvide);
    } else if (filters.delivery === 'no') {
      results = results.filter(shop => !shop.DeliveryProvide);
    }
    
    // Sorting
    if (filters.sortBy === 'distance' && userLocation) {
      results = results.filter(s => s.distance !== null)
        .sort((a, b) => a.distance - b.distance);
    } else if (filters.sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'name') {
      results.sort((a, b) => a.shopName.localeCompare(b.shopName));
    }
    
    setFilteredShops(results);
  }, [searchTerm, filters, shops, userLocation]);

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

  const handleShowRoute = (shop) => {
    if (userLocation && shop.coordinates) {
      setSelectedRoute({
        start: [userLocation.lat, userLocation.lng],
        end: [shop.coordinates.lat, shop.coordinates.lng]
      });
      // Center map on the route
      mapRef.current?.flyToBounds([
        [userLocation.lat, userLocation.lng],
        [shop.coordinates.lat, shop.coordinates.lng]
      ]);
    } else {
      toast.warning('Cannot show route without your location');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
    </div>
  );

  class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Map Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          Map failed to load. Please try refreshing the page.
        </div>
      );
    }
    return this.props.children;
  }
}

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6" style={{marginTop:"80px"}}>
      {/* Interactive Map Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 mb-8"
        style={{ height: '500px' }}
      >
        <ErrorBoundary>
   {mapCenter && userLocation?.lat && userLocation?.lng ? (
  <MapContainer
    center={mapCenter}
    zoom={12}
    style={{ height: '100%', width: '100%', borderRadius: '12px' }}
    whenCreated={map => {
      mapRef.current = map;
      setMapInitialized(true);
    }}
    key={`map-${mapCenter[0]}-${mapCenter[1]}`}
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
          
          {/* Shop markers */}
         {filteredShops.map(shop => (
  shop.coordinates?.lat && shop.coordinates?.lng && (
    <Marker 
      key={shop._id}
      position={[shop.coordinates.lat, shop.coordinates.lng]}
              icon={L.icon({
                ...L.Icon.Default.prototype.options,
                iconUrl: shop._id === nearestShop?._id 
                  ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'
                  : shop.DeliveryProvide
                    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
                    : L.Icon.Default.prototype.options.iconUrl,
              })}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold">{shop.shopName}</h3>
                  <p>{shop.village ? `${shop.village}, ` : ''}{shop.city}</p>
                  <p className="text-[#E59560] font-medium">
                    {shop.distance?.toFixed(1)} km away
                  </p>
                  {shop.DeliveryProvide && (
                    <div className="flex items-center text-green-600 text-sm mt-1">
                      <FontAwesomeIcon icon={faTruck} className="mr-1" />
                      <span>Provides Delivery</span>
                    </div>
                  )}
                  <button 
                    onClick={() => handleShowRoute(shop)}
                    className="mt-2 text-sm text-blue-500 hover:underline flex items-center"
                  >
                    <FontAwesomeIcon icon={faRoute} className="mr-1" />
                    Show Route
                  </button>
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
) : (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
  </div>
)}
</ErrorBoundary>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              {[...new Set(shops.map(s => s.city))].map(city => (
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

          <div className="relative">
            <select
              className="w-full p-3 pl-10 border border-[#BACEC1] rounded-xl focus:border-[#E59560]"
              value={filters.petType}
              onChange={(e) => setFilters({...filters, petType: e.target.value})}
            >
              <option value="">All Pet Types</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
            </select>
            <FontAwesomeIcon 
              icon={faFilter} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
            />
          </div>

          {/* Delivery filter */}
          <div className="relative">
            <select
              className="w-full p-3 pl-10 border border-[#BACEC1] rounded-xl focus:border-[#E59560]"
              value={filters.delivery}
              onChange={(e) => setFilters({...filters, delivery: e.target.value})}
            >
              <option value="all">All Delivery Options</option>
              <option value="yes">Delivery Available</option>
              <option value="no">No Delivery</option>
            </select>
            <FontAwesomeIcon 
              icon={faFilter} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
            />
          </div>
        </div>
      </motion.div>

      {/* Shops List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.length > 0 ? (
          filteredShops.map((shop, index) => (
            <motion.div
              key={shop._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img 
                      src={shop.profileImage || '/default-shop.jpg'} 
                      alt={shop.shopName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#E59560]"
                    />
                    {shop.DeliveryProvide && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full">
                        <FontAwesomeIcon icon={faTruck} className="text-xs" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#325747]">{shop.shopName}</h3>
                    <div className="flex items-center gap-2 text-[#607169] mt-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>
                        {shop.village ? `${shop.village}, ` : ''}{shop.city}
                      </span>
                    </div>
                  
                    <div className="text-sm text-[#E59560] mt-1">
                      {shop.distance?.toFixed(1)} km away
                      {shop._id === nearestShop?._id && (
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                          Nearest
                        </span>
                      )}
                    </div>
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
                    <span className="text-sm text-[#607169]">(42)</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleShowRoute(shop)}
                      className="p-2 text-[#325747] hover:bg-[#BACEC1] rounded-md"
                      title="Show route"
                    >
                      <FontAwesomeIcon icon={faRoute} />
                    </button>
                    <button 
                      onClick={() => navigate(`/owner/shops/${shop._id}/products`)}
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
              No shops found matching your criteria
            </p>
            <button
              onClick={() => {
                setFilters({
                  city: '',
                  sortBy: 'distance',
                  petType: '',
                  delivery: 'all'
                });
                setSearchTerm('');
              }}
              className="mt-4 px-4 py-2 bg-[#325747] text-white rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopListPage;