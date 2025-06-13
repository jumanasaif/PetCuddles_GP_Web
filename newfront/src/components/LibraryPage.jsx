import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faVideo, faPuzzlePiece, 
  faBookmark, faSearch, faFilter,
  faStar, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const LibraryPage = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    category: '',
    petType: '',
    difficulty: '',
    type: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch categories and items in parallel
        const [categoriesRes, itemsRes, bookmarksRes] = await Promise.all([
          axios.get('http://localhost:5000/api/library/categories', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/library/items', {
            headers: { Authorization: `Bearer ${token}` },
            params: filters
          }),
          axios.get('http://localhost:5000/api/library/bookmarks', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setCategories(categoriesRes.data);
        setItems(itemsRes.data);
        setBookmarkedItems(bookmarksRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading library data:', error);
        toast.error('Failed to load library content');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);

  const toggleBookmark = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/library/items/${itemId}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update UI state
      if (bookmarkedItems.some(item => item._id === itemId)) {
        setBookmarkedItems(bookmarkedItems.filter(item => item._id !== itemId));
      } else {
        const itemToAdd = items.find(item => item._id === itemId);
        if (itemToAdd) {
          setBookmarkedItems([...bookmarkedItems, itemToAdd]);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      petType: '',
      difficulty: '',
      type: '',
      search: ''
    });
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'video': return faVideo;
      case 'interactive': return faPuzzlePiece;
      default: return faBook;
    }
  };

  const getItemType = (type) => {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Article';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    const itemsToDisplay = activeTab === 'bookmarks' ? bookmarkedItems : items;
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
        </div>
      );
    }

    if (itemsToDisplay.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">
            {activeTab === 'bookmarks' 
              ? 'You have no bookmarked items yet' 
              : 'No items found matching your criteria'}
          </p>
          {activeTab !== 'bookmarks' && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-[#325747] text-white rounded-lg"
            >
              Reset Filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itemsToDisplay.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
          >
            <div className="relative">
              {item.thumbnail ? (
                <img 
                  src={`http://localhost:5000${item.thumbnail}` }
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <FontAwesomeIcon 
                    icon={getItemIcon(item.type)} 
                    className="text-4xl text-gray-400" 
                  />
                </div>
              )}
              
              <button
                onClick={() => toggleBookmark(item._id)}
                className={`absolute top-2 right-2 p-2 rounded-full ${bookmarkedItems.some(bi => bi._id === item._id) ? 'text-yellow-500 bg-white' : 'text-gray-400 bg-white'}`}
              >
                <FontAwesomeIcon icon={faBookmark} />
              </button>
              
              {item.isFeatured && (
                <div className="absolute top-2 left-2 bg-[#E59560] text-white px-2 py-1 rounded-full text-xs">
                  Featured
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-[#325747]">{item.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {getItemType(item.type)}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {item.categories.map(cat => (
                  <span key={cat._id} className="px-2 py-1 text-xs rounded-full bg-gray-100">
                    {cat.name}
                  </span>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex flex-wrap gap-1">
                  {item.petTypes.map(type => (
                    <span key={type} className="px-2 py-1 text-xs rounded-full bg-green-100">
                      {type}
                    </span>
                  ))}
                </div>
                
                <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(item.difficulty)}`}>
                  {item.difficulty}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faStar} className="text-yellow-400 mr-1" />
                  <span className="text-sm text-gray-600">{item.views} views</span>
                </div>
                
                <button
                  onClick={() => navigate(`/owner/library/${item._id}`)}
                  className="px-3 py-1 bg-[#325747] text-white rounded-lg text-sm hover:bg-[#1e3a2b]"
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
<div className="p-8 font-laila bg-[#F6F4E8] " style={{ marginTop: "80px" }}>
        {/* Header and Tabs */}
 <motion.div  
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
>
  <div>
     <h1 className="text-2xl md:text-3xl font-bold text-[#325747] flex items-center">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
         className="mr-3"
      >
        <FontAwesomeIcon icon={faBook} className="text-[#325747]" />
    </motion.div>
     Educational Librara
   </h1>
    <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "40px" }}></div>
 </div>

  <div className="flex space-x-2">
    <button 
      onClick={() => setActiveTab('all')}
      className={`px-4 py-2 rounded-lg ${activeTab === 'all' ? 'bg-[#325747] text-white' : 'bg-gray-200'}`}
    >
      All Content
    </button>
    <button 
      onClick={() => setActiveTab('bookmarks')}
      className={`px-4 py-2 rounded-lg ${activeTab === 'bookmarks' ? 'bg-[#325747] text-white' : 'bg-gray-200'}`}
    >
      My Bookmarks
    </button>
  </div>
</motion.div>
 
        
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search library..."
                className="w-full p-3 pl-10 border border-[#BACEC1] rounded-xl focus:border-[#E59560]"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#BACEC1]"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              <FontAwesomeIcon icon={faFilter} />
              Filters
              <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
            </button>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full p-2 border border-[#BACEC1] rounded-xl"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet Type</label>
                <select
                  className="w-full p-2 border border-[#BACEC1] rounded-xl"
                  value={filters.petType}
                  onChange={(e) => handleFilterChange('petType', e.target.value)}
                >
                  <option value="">All Pets</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="cow">Cow</option>
                  <option value="sheep">Sheep</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  className="w-full p-2 border border-[#BACEC1] rounded-xl"
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  className="w-full p-2 border border-[#BACEC1] rounded-xl"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="interactive">Interactive</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        {renderContent()}
      </div>
  );
};

export default LibraryPage;
