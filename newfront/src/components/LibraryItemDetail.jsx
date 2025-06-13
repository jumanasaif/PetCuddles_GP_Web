import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { 
  faBook, faVideo, faPuzzlePiece, 
  faBookmark, faArrowLeft, faStar,
  faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';

const LibraryItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const token = localStorage.getItem('token');
        const [itemRes, bookmarksRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/library/items/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/library/bookmarks', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setItem(itemRes.data);
        setIsBookmarked(bookmarksRes.data.some(bi => bi._id === id));
         console.log(itemRes.data);
        // Fetch related items
        if (itemRes.data.categories.length > 0) {
          const relatedRes = await axios.get('http://localhost:5000/api/library/items', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              category: itemRes.data.categories[0]._id,
              limit: 4
            }
          });
          setRelatedItems(relatedRes.data.filter(ri => ri._id !== id));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading item:', error);
        toast.error('Failed to load item details');
        navigate('/owner/library');
      }
    };
   
    fetchItem();
  }, [id, navigate]);

  const toggleBookmark = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/library/items/${id}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const navigateImage = (direction) => {
    if (!item.images || item.images.length === 0) return;
    
    if (direction === 'prev') {
      setCurrentImageIndex(prev => 
        prev === 0 ? item.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex(prev => 
        prev === item.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (loading) {
    return (
   
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
        </div>
    
    );
  }

  if (!item) {
    return (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">Item not found</p>
          <button
            onClick={() => navigate('/owner/library')}
            className="mt-4 px-4 py-2 bg-[#325747] text-white rounded-lg"
          >
            Back to Library
          </button>
        </div>
    );
  }

  const getItemIcon = (type) => {
    switch (type) {
      case 'video': return faVideo;
      case 'interactive': return faPuzzlePiece;
      default: return faBook;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
      <div className="p-9 font-laila bg-[#F6F4E8]" style={{ marginTop: "80px" }}>
        <button
          onClick={() => navigate('/owner/library')}
          className="flex items-center gap-2 text-[#325747] mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Library
        </button>
        
      <div className="flex justify-center">
        <div className="bg-white w-full md:w-3/4 lg:w-2/3 rounded-3xl shadow-lg overflow-hidden">

          {/* Header with thumbnail */}
          <div className="relative">
            {item.thumbnail ? (
              <img 
                src={`http://localhost:5000${item.thumbnail}` }
                alt={item.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            ) : (
              <div className={`w-full h-64 md:h-80 flex items-center justify-center ${
                item.type === 'article' ? 'bg-red-50' : item.type === 'video' ? 'bg-green-50' : 'bg-gray-200'
                }`}>
                <FontAwesomeIcon  icon={getItemIcon(item.type)} className="text-6xl text-gray-400" />
             </div>

            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {item.title}
                  </h1>
                  <p className="text-gray-200">
                    {item.author || 'PetCuddles'} • {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={toggleBookmark}
                  className={`p-3 rounded-full ${isBookmarked ? 'text-yellow-500 bg-white' : 'text-gray-200 bg-black bg-opacity-50'}`}
                >
                  <FontAwesomeIcon icon={faBookmark} size="lg" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={getItemIcon(item.type)} className="text-[#325747]" />
                <span className="text-sm font-medium">
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                <span className="text-sm font-medium">
                  {item.views} views
                </span>
              </div>
              
              <span className={`px-3 py-1 text-sm rounded-full ${getDifficultyColor(item.difficulty)}`}>
                {item.difficulty}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {item.categories.map(cat => (
                <span key={cat._id} className="px-3 py-1 text-sm rounded-full bg-gray-100">
                  {cat.name}
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {item.petTypes.map(type => (
                <span key={type} className="px-3 py-1 text-sm rounded-full bg-green-100">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              ))}
            </div>
            
            {/* Content based on type */}
            <div className="mb-8">
           {item.type === 'article' && (
  <>
    
    {item.articleContent && (
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: item.articleContent }} />
    )}
    
    {/* PDF File Display */}
    {item.articleFile && (
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">PDF Document</h3>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <FontAwesomeIcon icon={faFilePdf} className="text-red-500 text-2xl" />
            </div>
            <div>
              <p className="font-medium">{item.articleFile.split('/').pop()}</p>
              <div className="flex gap-2 mt-2">
                <a 
                  href={`http://localhost:5000${item.articleFile}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  View PDF
                </a>
                <a 
                  href={`http://localhost:5000${item.articleFile}`} 
                  download
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
          
          {/* PDF Preview (using iframe) */}
          <div className="mt-4 h-[500px] border rounded-lg overflow-hidden">
            <iframe
              src={`http://localhost:5000${item.articleFile}#view=fitH`}
              className="w-full h-full"
              title="PDF Preview"
            >
              <p>Your browser does not support PDFs. 
                <a href={item.articleFile}>Download the PDF</a> instead.
              </p>
            </iframe>
          </div>
        </div>
      </div>
    )}
    
    {/* Images Gallery */}
    {item.images && item.images.length > 0 && (
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Gallery</h3>
        <div className="relative">
          <img 
            src={item.images[currentImageIndex]} 
            alt={`Gallery ${currentImageIndex + 1}`}
            className="w-full h-64 md:h-96 object-contain bg-gray-100 rounded-lg"
          />
          
          {item.images.length > 1 && (
            <>
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              <button
                onClick={() => navigateImage('next')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                  {currentImageIndex + 1} / {item.images.length}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </>
)}
              
              {item.type === 'video' && (
  <div className="aspect-w-16 aspect-h-9">
    {item.videoUrl ? (
      <iframe
        src={item.videoUrl}
        className="w-full h-96"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={item.title}
      ></iframe>
    ) : (
      <video controls className="w-full h-96">
        <source 
          src={`http://localhost:5000${item.videoFile}?${new Date().getTime()}`} // Add cache buster
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
    )}
  </div>
)}
              {item.type === 'interactive' && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-bold mb-2">Interactive Tool</h3>
                  <div className="p-4 bg-white rounded border">
                    {JSON.stringify(item.interactiveTool, null, 2)}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    This interactive tool helps you {item.description.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 text-[#325747]">Related Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedItems.map(relatedItem => (
                <div 
                  key={relatedItem._id} 
                  className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/owner/library/${relatedItem._id}`)}
                >
                  <div className={` h-40 flex items-center justify-center ${
                    relatedItem.type === 'article' ? 'bg-red-50' : relatedItem.type === 'video' ? 'bg-green-50' : 'bg-gray-200'
                  }`}>
                    {relatedItem.thumbnail ? (
                      <img 
                        src={`http://localhost:5000${item.thumbnail}` } 
                        alt={relatedItem.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FontAwesomeIcon 
                        icon={getItemIcon(relatedItem.type)} 
                        className="text-4xl text-gray-400" 
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-400 line-clamp-2">{relatedItem.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {relatedItem.type.charAt(0).toUpperCase() + relatedItem.type.slice(1)}
                      </span>
                      <span className="text-xs text-yellow-500">
                        {relatedItem.views} views
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
};

export default LibraryItemDetail;