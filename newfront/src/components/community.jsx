import React, { useState, useEffect ,useRef,useCallback} from "react";
import axios from "axios";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaImage, FaVideo, FaCheckCircle } from "react-icons/fa";
import { FaRegThumbsUp, FaThumbsUp, FaRegCommentDots, FaCommentDots, FaTrash ,FaHashtag,FaClock,FaCalendarAlt,FaEdit} from "react-icons/fa";
import CommunityHeader from "./CommunityHeader";
const Community = () => {
  const [posts, setPosts] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [isGallerySelected, setIsGallerySelected] = useState(true);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(""); 
  const [showComments, setShowComments] = useState({}); 
  const [expandedComments, setExpandedComments] = useState({}); 
  const [likedPosts, setLikedPosts] = useState({});
  const [content, setContent] = useState("");
  const [showLikes, setShowLikes] = useState({});
  const [likeDetails, setLikeDetails] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedHashtagFilter, setSelectedHashtagFilter] = useState("All");
  const [showEventForm, setShowEventForm] = useState(false);
 const [events, setEvents] = useState([]);
 const [eventForm, setEventForm] = useState({
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  image: null
});
const [showAllEvents, setShowAllEvents] = useState(false);
const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [popularHashtags, setPopularHashtags] = useState(['lost_pet', 'product','general','health','adoption','market','pet_supplies', 'petcare', 'vetadvice']);

  const highlightHashtags = (content) => {
    if (!content) return '';
    return content.replace(/#(\w+)/g, '<span style="color: #E59560;">#$1</span>');
  };

const filterPosts = (posts, selectedFilter, selectedHashtagFilter) => {
  let filteredPosts = posts;

  // Role-based filters
  switch (selectedFilter) {
    case "My":
      filteredPosts = filteredPosts.filter((post) => post.user._id === userProfile._id);
      break;
    case "Vets":
      filteredPosts = filteredPosts.filter((post) => 
        post.user.role === "clinic" || post.user.role === "vet"
      );
      break;
    case "Doctors":
      filteredPosts = filteredPosts.filter((post) => post.user.role === "doctor");
      break;
    case "Shops":
      filteredPosts = filteredPosts.filter((post) => post.user.role === "shop");
      break;
    case "Admins":
      filteredPosts = filteredPosts.filter((post) => post.user.role === "admin");
      break;
    default:
      break;
  }

  // Category-based hashtag filtering
  if (selectedHashtagFilter !== "All") {
    filteredPosts = filteredPosts.filter(post => {
      // Convert post content and hashtags to lowercase for case-insensitive comparison
      const contentLower = post.content ? post.content.toLowerCase() : '';
      const postHashtags = post.hashtags ? post.hashtags.map(tag => tag.toLowerCase()) : [];
      
      switch (selectedHashtagFilter) {
        case "Pet_Supplies":
          // Check for any of the pet supplies hashtags
          return (
            ['product', 'market', 'pet_supplies'].some(hashtag => 
              contentLower.includes(`#${hashtag}`) || 
              postHashtags.includes(hashtag)
            )
          );
        case "Health":
          // Check for health or vetadvice hashtags
          return (
            ['health', 'vetadvice'].some(hashtag => 
              contentLower.includes(`#${hashtag}`) || 
              postHashtags.includes(hashtag)
            )
          );
        case "petCare":
          // Check for petcare hashtag
          return (
            contentLower.includes('#petcare') || 
            postHashtags.includes('petcare')
          );
        default:
          // For other filters, check for the exact hashtag match
          return (
            contentLower.includes(`#${selectedHashtagFilter.toLowerCase()}`) || 
            postHashtags.some(tag => 
              tag.replace(/^#/, '') === selectedHashtagFilter.toLowerCase()
            )
          );
      }
    });
  }

  // Search filtering
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(post => 
      post.content && post.content.toLowerCase().includes(query)
    );
  }

  return filteredPosts;
};



  // Helper function to get display name based on user type
const getDisplayName = (user) => {
  if (!user) return 'Unknown';

  // Get role from user object or from localStorage
  const role = user.role || getCurrentUserRole();

  // Handle shop users
  if (role === 'shop' && (user.shopName || JSON.parse(localStorage.getItem('shop'))?.shopName)) {
    return user.shopName || JSON.parse(localStorage.getItem('shop'))?.shopName;
  }
  
  // Handle clinic users
  if ((role === 'clinic' || role === 'vet') && (user.clinicName || JSON.parse(localStorage.getItem('clinic'))?.clinicName)) {
    return user.clinicName || JSON.parse(localStorage.getItem('clinic'))?.clinicName;
  }
  
    // Handle doctor users
  if ((role === 'doctor' ) && (user.name || JSON.parse(localStorage.getItem('doctor'))?.name)) {
    return user.name || JSON.parse(localStorage.getItem('doctor'))?.name;
  }


  // Handle regular users
  if (user.fullName || JSON.parse(localStorage.getItem('user'))?.fullName) {
    return user.fullName || JSON.parse(localStorage.getItem('user'))?.fullName;
  }
  
  // Fallback
  return 'Unknown';
};

// Helper function to get role badge
const getRoleBadge = (role) => {
  switch(role) {
    case 'clinic': return 'Vet Clinic';
    case 'doctor': return 'Doctor';
    case 'shop': return 'Pet Shop';
    case 'admin': return 'Admin';
    case 'vet': return 'Vet Clinic'; // Handle both 'vet' and 'clinic' for backward compatibility
    default: return 'Pet Owner';
  }
};

const getCurrentUserRole = () => {
  const clinic = JSON.parse(localStorage.getItem('clinic'));
  const doctor = JSON.parse(localStorage.getItem('doctor'));
  const user = JSON.parse(localStorage.getItem('user'));
  const shop = JSON.parse(localStorage.getItem('shop'));
  
  return clinic?.role || user?.role || shop?.role || doctor?.role || 'pet_owner'; // Default fallback
};

  // Helper function to get profile image URL
  const getProfileImage = (image) => {
    if (!image) return "default-profile.png";
    return image.startsWith('data:') ? image : `http://localhost:5000${image}`;
  };
  

      
  const trendingTopics = ["Pet Health", "Adoption Stories", "Training Tips"];

  const adoptionAlerts = [
    { id: 1, petName: "Buddy", details: "Golden Retriever, 2 years old" },
    { id: 2, petName: "Luna", details: "Persian Cat, 3 years old" },
  ];





  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleExpandedComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setFileName(selectedFile.name); // Set the file name for feedback
    } else {
      setFileName(""); // Reset file name if no file is selected
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handlePostSubmit = async () => {
    const token = localStorage.getItem("token");
    // Don't require content if there's a file
    if (!content && !file) {
      alert("Please add either text or a media file");
      return;
    }
    


    const formData = new FormData();
    if (content) formData.append("content", content);
    if (file) {
      formData.append("file", file);
      formData.append("isImage", isGallerySelected);
    }

  try {
      const response = await axios.post("http://localhost:5000/api/community/posts", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
      });
      
      setPosts([response.data, ...posts]);
      setContent("");
      setFile(null);
      setFileName("");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  
  // Add function to handle hashtag selection
  const handleHashtagSelect = (hashtag) => {
    // Check if the hashtag is already in the content
    if (!content.includes(`#${hashtag}`)) {
      setContent(prev => prev ? `${prev} #${hashtag}` : `#${hashtag}`);
    }
    setShowHashtagSuggestions(false);
  };




  const handleCommentSubmit = async (postId) => {
    const token = localStorage.getItem("token");
    const content = commentInputs[postId];
  
    if (!content) {
      alert("Please enter a comment.");
      return;
    }
  
    try {
      const response = await axios.post(
        `http://localhost:5000/api/community/posts/${postId}/comments`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      // Update the posts state with the new comment
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, comments: response.data } // Update the comments array
            : post
        )
      );
  
      // Clear the comment input
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

useEffect(() => {
  const token = localStorage.getItem("token");

  // Fetch complete user profile
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const basicInfo = await axios.get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let profileData = {
      ...basicInfo.data,
      role:getCurrentUserRole()
    };



      // Fetch community stats
      const stats = await axios.get("http://localhost:5000/api/community/user-posts", {
        headers: { Authorization: `Bearer ${token}` },  
      });

      setUserProfile({
        ...profileData,
        posts: stats.data.postCount,
        comments: stats.data.CommentCount,
        likesCount: stats.data.LikeCount
      });

    
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  fetchUserProfile();
  fetchEvents()
  // Fetch posts
  axios.get("http://localhost:5000/api/community/posts")
    .then((response) => {
      setPosts(response.data);
      const initialLikedState = response.data.reduce((acc, post) => {
        acc[post._id] = post.likes.includes(userProfile._id);
        return acc;
      }, {});
      setLikedPosts(initialLikedState);
    })
    .catch((error) => console.log(error));
}, []);


  console.log("userProfile",userProfile);

const handleLike = async (postId) => {
  const token = localStorage.getItem("token");

  try {
    // Optimistically update the UI first
    const isCurrentlyLiked = likedPosts[postId];
    const currentLikesCount = posts.find(p => p._id === postId)?.likes?.length || 0;
    
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !isCurrentlyLiked
    }));

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? {
              ...post,
              likes: isCurrentlyLiked
                ? post.likes.filter(id => id.toString() !== userProfile._id)
                : [...post.likes, userProfile._id],
              likesCount: isCurrentlyLiked ? currentLikesCount - 1 : currentLikesCount + 1
            }
          : post
      )
    );

    // Then make the API call
    const response = await axios.post(
      `http://localhost:5000/api/community/posts/${postId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // If the API call fails, revert the optimistic update
    if (!response.data) {
      setLikedPosts(prev => ({
        ...prev,
        [postId]: isCurrentlyLiked
      }));

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? {
                ...post,
                likes: isCurrentlyLiked
                  ? [...post.likes, userProfile._id]
                  : post.likes.filter(id => id.toString() !== userProfile._id),
                likesCount: isCurrentlyLiked ? currentLikesCount + 1 : currentLikesCount - 1
              }
            : post
        )
      );
    }
  } catch (error) {
    console.error("Error liking post:", error);
    // Revert optimistic update on error
    setLikedPosts(prev => ({
      ...prev,
      [postId]: likedPosts[postId]
    }));
  }
};

  const fetchLikeDetails = async (postId) => {
    if (!postId) {
      console.error("Invalid Post ID:", postId);
      return;
    }
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await axios.get(`http://localhost:5000/api/community/posts/${postId}/likes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("Like Details Response:", response.data); // Debugging: Log the response
  
      // Update the likeDetails state
      setLikeDetails((prev) => ({
        ...prev,
        [postId]: response.data,
      }));
  
      // Toggle the visibility of the likes section AFTER updating likeDetails
      setShowLikes((prev) => ({
        ...prev,
        [postId]: !prev[postId],
      }));
  
      console.log("Updated likeDetails:", likeDetails); // Debugging: Log the updated state
    } catch (error) {
      console.error("Error fetching like details:", error);
    }
  };
  const toggleLikes = (postId) => {
    setShowLikes((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };


  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("token");

    try {
      // Send a DELETE request to the backend
      await axios.delete(`http://localhost:5000/api/community/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update the posts state to remove the deleted post
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete the post. Please try again.");
    }
  };


  const fetchEvents = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get('http://localhost:5000/api/event', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setEvents(response.data);
  } catch (error) {
    console.error("Error fetching events:", error);
  }
};

const handleEditEvent = (event) => {
  setEventForm({
    title: event.title,
    description: event.description,
    date: event.date.split('T')[0], // Format date for input
    time: event.time,
    location: event.location,
    image: event.image
  });
  setEditingEvent(event._id);
  setShowEventForm(true);
};


const handleEventInputChange = useCallback((e) => {
  const { name, value } = e.target;
  setEventForm(prev => ({ 
    ...prev, 
    [name]: value 
  }));
}, []);

const handleEventImageChange = useCallback((e) => {
  if (e.target.files && e.target.files[0]) {
    setEventForm(prev => ({ 
      ...prev, 
      image: e.target.files[0] 
    }));
  }
}, []);

const handleCloseForm = useCallback(() => {
  setShowEventForm(false);
  setEditingEvent(null);
  setEventForm({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: null
  });
}, []);


const handleUpdateEvent = async () => {
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    
    formData.append('title', eventForm.title);
    formData.append('description', eventForm.description);
    formData.append('date', eventForm.date);
    formData.append('time', eventForm.time);
    formData.append('location', eventForm.location);
    if (eventForm.image && typeof eventForm.image !== 'string') {
      formData.append('image', eventForm.image);
    }

    const response = await axios.put(
      `http://localhost:5000/api/event/${editingEvent}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    setEvents(events.map(event => 
      event._id === editingEvent ? response.data : event
    ));
    setShowEventForm(false);
    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      image: null
    });
    setEditingEvent(null);
  } catch (error) {
    console.error("Error updating event:", error);
  }
};

const submitEvent = async () => {
  if (editingEvent) {
    await handleUpdateEvent();
  } else {
    // Original create event logic
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      formData.append('title', eventForm.title);
      formData.append('description', eventForm.description);
      formData.append('date', eventForm.date);
      formData.append('time', eventForm.time);
      formData.append('location', eventForm.location);
      if (eventForm.image) {
        formData.append('image', eventForm.image);
      }

      const response = await axios.post('http://localhost:5000/api/event', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setEvents([response.data, ...events]);
      setShowEventForm(false);
      setEventForm({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        image: null
      });
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }
};

const updateAttendance = async (eventId, status) => {
  try {
    const token = localStorage.getItem("token");
    await axios.put(`http://localhost:5000/api/event/${eventId}/attendance`, 
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setEvents(events.map(event => {
      if (event._id === eventId) {
        const updatedEvent = { ...event };
        // Remove existing attendance if any
        updatedEvent.attendees = updatedEvent.attendees.filter(
          a => a.user.toString() !== userProfile._id
        );
        // Add new attendance
        if (status !== 'not_interested') {
          updatedEvent.attendees.push({
            user: userProfile._id,
            status
          });
        }
        return updatedEvent;
      }
      return event;
    }));
  } catch (error) {
    console.error("Error updating attendance:", error);
  }
};
 //Event form 
const EventForm = React.memo(({ 
  visible, 
  onClose, 
  onSubmit, 
  form, 
  onChange, 
  onImageChange, 
  isEditing 
}) => {
  const fileInputRef = useRef(null);

  if (!visible) return null;

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  // Add this to prevent unnecessary re-renders of inputs
  const getInputProps = (name) => ({
    name,
    value: form[name] || '',
    onChange,
    className: "w-full p-2 border rounded",
    required: true
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? 'Edit Event' : 'Create New Event'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              {...getInputProps('title')}
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-gray-700">Description</label>
            <textarea
              id="description"
              rows="3"
              {...getInputProps('description')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-gray-700">Date</label>
              <input
                type="date"
                id="date"
                {...getInputProps('date')}
              />
            </div>
            
            <div>
              <label htmlFor="time" className="block text-gray-700">Time</label>
              <input
                type="time"
                id="time"
                {...getInputProps('time')}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-gray-700">Location</label>
            <input
              type="text"
              id="location"
              {...getInputProps('location')}
            />
          </div>
          
          <div>
            <label className="block text-gray-700">Event Image</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg, image/png"
              onChange={onImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleImageClick}
              className="w-full p-2 border rounded bg-gray-100 hover:bg-gray-200"
            >
              {form.image ? (typeof form.image === 'string' ? 'Current image' : form.image.name) : "Select Image"}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 bg-[#E59560] text-white rounded"
          >
            {isEditing ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
});

// Add this component for displaying events
const EventCard = ({ event, onAttendanceChange, currentUserId, onEdit }) => {
  const userAttendance = event.attendees.find(a => a.user.toString() === currentUserId);
  const attendingCount = event.attendees.filter(a => a.status === 'attending').length;
  const interestedCount = event.attendees.filter(a => a.status === 'interested').length;

  const handleGoingClick = () => {
    if (userAttendance?.status === 'attending') {
      onAttendanceChange(event._id, 'not_interested');
    } else {
      onAttendanceChange(event._id, 'attending');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-[#325747]">{event.title} event</h3>
          <p className="text-gray-600">Organized by: {event.organizer.clinicName || event.organizer.shopName || event.organizer.fullName}</p>
        </div>
        {event.organizer._id === currentUserId && (
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(event)}
              className="text-[#E59560] "
            >
             <FaEdit />
            </button>
            <button className="text-[#E59560] ">
              <FaTrash />
            </button>
          </div>
        )}
      </div>
      
      {event.image && (
        <img 
          src={event.image.startsWith('data:') ? event.image : `http://localhost:5000/${event.image}`} 
          alt={event.title} 
          className="w-full h-48 object-cover rounded my-2"
        />
      )}
      
      <p className="my-2">{event.description}</p>
      
      <div className="flex items-center text-gray-600 gap-4">
        <span className="flex items-center">
          <FaCalendarAlt className="mr-1" /> {new Date(event.date).toLocaleDateString()}
        </span>
        <span className="flex items-center">
          <FaClock className="mr-1" /> {event.time}
        </span>
        <span className="flex items-center">
          <FaMapMarkerAlt className="mr-1" /> {event.location}
        </span>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <button 
            onClick={handleGoingClick}
            className={`px-3 py-1 rounded-full text-sm ${userAttendance?.status === 'attending' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Going ({attendingCount})
          </button>
          <button 
            onClick={() => onAttendanceChange(event._id, userAttendance?.status === 'interested' ? 'not_interested' : 'interested')}
            className={`px-3 py-1 rounded-full text-sm ${userAttendance?.status === 'interested' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Interested ({interestedCount})
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this new component for the all events modal
const AllEventsModal = ({ events, onClose, onAttendanceChange, currentUserId, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-laila">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#E59560]" style={{marginLeft:"150px"}}>All Upcoming Events</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        
        <div className="space-y-4">
          {events.length === 0 ? (
            <p>No upcoming events</p>
          ) : (
            events.map(event => (
              <EventCard 
                key={event._id}
                event={event}
                onAttendanceChange={onAttendanceChange}
                currentUserId={currentUserId}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};


  return (
    <div className="flex bg-[#F6F4E8] font-laila">
        {/* Header */}
        <CommunityHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={selectedHashtagFilter}
        setFilterCategory={setSelectedHashtagFilter}
      />

    
          {/* Left Sidebar - User Profile Summary */}
      <div className="w-1/5 bg-[#ffff] p-6 rounded-lg shadow-md fixed" style={{ marginTop: "80px", height: "1000px" }}>
        <div className="flex items-center">
          <img 
            src={getProfileImage(userProfile.profileImage)} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-2 border-gray-300" 
          />
          <div>
            <h1 className="ml-4 text-2xl font-bold font-laila text-[#325747]">
              {getDisplayName(userProfile)}
            </h1>
            {userProfile.role && (
              <span className="ml-4 text-xs px-2 py-1 bg-[#E59560] text-white rounded-full">
                {getRoleBadge(userProfile.role)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 text-gray-700 font-laila pb-4 border-b border-gray-400">
          <p className="text-gray-600 mb-2 text-lg">Connect with me:</p>
          <p className="flex items-center text-[16px]">
            <FaPhone className="mr-2 text-green-600" /> {userProfile.phone || 'Not provided'}
          </p>
          <p className="flex items-center text-[16px] mt-1">
            <FaEnvelope className="mr-2 text-blue-600" /> {userProfile.email}
          </p>
          <p className="flex items-center text-[16px] mt-1">
            <FaMapMarkerAlt className="mr-2 text-red-600" /> 
            {userProfile.city || 'Location not specified'}
            {userProfile.village && `, ${userProfile.village}`}
          </p>
        </div>
        <div className="mt-6 space-y-2 text-[16px] text-gray-700 font-laila">
          <p>Role: <span className="capitalize">
            {userProfile.role === 'clinic' && 'Vet Clinic'}
            {userProfile.role === 'doctor' && 'Doctor'}
            {userProfile.role === 'shop' && 'Pet Shop'}
            {userProfile.role === 'admin' && 'Administrator'}
            {userProfile.role === 'pet_owner' && 'Pet Owner'}
          </span></p>
          <p>Total Posts: {userProfile.posts || 0}</p>
          <p>Total Comments: {userProfile.comments || 0}</p>
          <p>Total Likes: {userProfile.likesCount || 0}</p>
        </div>
        
       {/* Events Button */}
        <button 
          onClick={() => setShowEventForm(true)}
          className="mt-6 w-full py-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d48753]"
        >
        Create Event
       </button>
  
      </div>
   
 {/* Main Feed - Posts */}
 <div className="w-1/2 p-6" style={{ marginTop: "85px", marginLeft: "345px" }}>
               {/* Post Creation Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <textarea
            className="w-full p-4 border border-[#E59560] rounded-lg"
            placeholder="Create a new post..."
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
     

          
          {/* Hashtag Suggestions */}
          <div className="relative">
            <button 
              onClick={() => setShowHashtagSuggestions(!showHashtagSuggestions)}
              className="flex items-center underline text-[#325747] text-sm mt-2"
            >
              <FaHashtag className="mr-1" /> Add hashtag
            </button>
            
            {showHashtagSuggestions && (
              <div className="absolute bg-white p-2 rounded shadow-lg z-10 mt-1 border border-gray-200">
                {popularHashtags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleHashtagSelect(tag)}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
              <input
                type="file"
                className="file-input"
                accept={isGallerySelected ? "image/*" : "video/*"}
                onChange={(e) => {
                  const selectedFile = e.target.files[0];
                  setFile(selectedFile);
                  setFileName(selectedFile ? selectedFile.name : "");
                }}
                style={{ display: "none" }}
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className={`flex items-center ${isGallerySelected ? "text-[#E59560]" : "text-gray-500"}`}
                onClick={() => setIsGallerySelected(true)}
                style={{ cursor: "pointer" }}
              >
                <FaImage className="mr-2" />
                Gallery
              </label>
              <label
                htmlFor="file-input"
                className={`flex items-center ${!isGallerySelected ? "text-[#E59560]" : "text-gray-500"}`}
                onClick={() => setIsGallerySelected(false)}
                style={{ cursor: "pointer" }}
              >
                <FaVideo className="mr-2" />
                Video
              </label>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                {isGallerySelected ? "Image" : "Video"} selected: {fileName}
              </p>
            )}
            <button 
              className="px-4 py-2 bg-[#E59560] text-white rounded-full" 
              onClick={handlePostSubmit}
              disabled={!content && !file}
            >
              Post
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-t-lg shadow-md border-b border-gray-200">
          <div className="flex gap-6">
  <span
    className={`cursor-pointer text-lg font-semibold ${
      selectedFilter === "All" ? "text-[#E59560] border-b-2 border-[#E59560]" : "text-gray-600"
    }`}
    onClick={() => setSelectedFilter("All")}
  >
    All
  </span>
  <span
    className={`cursor-pointer text-lg font-semibold ${
      selectedFilter === "My" ? "text-[#E59560] border-b-2 border-[#E59560]" : "text-gray-600"
    }`}
    onClick={() => setSelectedFilter("My")}
  >
    My
  </span>
  <span
    className={`cursor-pointer text-lg font-semibold ${
      selectedFilter === "Vets" ? "text-[#E59560] border-b-2 border-[#E59560]" : "text-gray-600"
    }`}
    onClick={() => setSelectedFilter("Vets")}
  >
    Vets
  </span>
  <span
    className={`cursor-pointer text-lg font-semibold ${
      selectedFilter === "Doctors" ? "text-[#E59560] border-b-2 border-[#E59560]" : "text-gray-600"
    }`}
    onClick={() => setSelectedFilter("Doctors")}
  >
    Doctors
  </span>
  <span
    className={`cursor-pointer text-lg font-semibold ${
      selectedFilter === "Shops" ? "text-[#E59560] border-b-2 border-[#E59560]" : "text-gray-600"
    }`}
    onClick={() => setSelectedFilter("Shops")}
  >
    Shops
  </span>
  {userProfile.role === "admin" && (
    <span
      className={`cursor-pointer text-lg font-semibold ${
        selectedFilter === "Admins" ? "text-[#E59560] border-b-2 border-[#E59560]" : "text-gray-600"
      }`}
      onClick={() => setSelectedFilter("Admins")}
    >
      Admins
    </span>
  )}
</div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
        {filterPosts(posts, selectedFilter, selectedHashtagFilter).map((post, index) => (
  <div
  key={post._id}
  className={`bg-white p-4 shadow-md ${
    index === 0 ? "rounded-b-lg" : "rounded-lg"
  }`}

  >
    {/* Post Header */}
    <div className="flex justify-between items-center">
       <div className="flex items-center gap-2">
                  <img 
                    src={getProfileImage(post.user.profileImage)} 
                    alt="User" 
                    className="w-8 h-8 rounded-full" 
                  />
                  <div>
                    <span className="font-bold">{getDisplayName(post.user)}</span>
                    {post.user.role && post.user.role !== 'pet_owner' && (
                      <span className="text-xs ml-2 px-2 py-1 bg-[#BACEC1] font-bold text-white rounded-full">
                        {getRoleBadge(post.user.role)}
                        {post.user.isVerified && (
                          <FaCheckCircle className="ml-1 inline text-blue-500" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
      {(post.user._id === userProfile._id || userProfile.role === "admin") && (
                  <button onClick={() => handleDeletePost(post._id)} className="text-red-500 hover:text-red-700">
                    <FaTrash className="w-5 h-5 text-[#E59560]" />
                  </button>
                )}
              </div>

    {/* Post Content */}
    <div
  className="mt-2"
  dangerouslySetInnerHTML={{ __html: highlightHashtags(post.content) }}
/>

    {post.img_url && (
      <div className="w-full overflow-hidden mt-2">
        {post.img_url.startsWith('data:') ? ( // Check if it's a Base64 string
          post.img_url.startsWith('data:video') ? ( // Base64 video
            <video controls className="w-full h-auto rounded-lg" style={{ maxHeight: "350px" }}>
              <source src={post.img_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : ( // Base64 image
            <img src={post.img_url} alt="Post Media" className="w-full h-auto rounded-lg" style={{ maxHeight: "350px" }} />
          )
        ) : post.img_url.match(/\.(mp4|mov|avi|mkv)$/i) ? ( // File path video
          <video controls className="w-full h-auto rounded-lg" style={{ maxHeight: "350px" }}>
            <source src={`http://localhost:5000/${post.img_url}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : ( // File path image
          <img src={`http://localhost:5000/${post.img_url}`} alt="Post Media" className="w-full h-auto rounded-lg" style={{ maxHeight: "350px" }} />
        )}
      </div>
    )}

              {/* Likes and Comments Section */}
              <div className="mt-1 flex justify-start gap-8 items-center">
               <div className="flex flex-col items-center">
  <span 
    className={`text-sm flex items-center gap-1 cursor-pointer ${likedPosts[post._id] ? 'text-[#E59560]' : 'text-gray-600'}`} 
    onClick={() => fetchLikeDetails(post._id)}
  >
    {likedPosts[post._id] ? <FaThumbsUp className="text-[#E59560]" /> : <FaRegThumbsUp />}
    {post.likes?.length || 0}
  </span>
  <button 
    className={`flex items-center gap-1 ${likedPosts[post._id] ? 'text-[#E59560]' : 'text-gray-600 hover:text-[#E59560]'}`} 
    onClick={() => handleLike(post._id)}
  >
    {likedPosts[post._id] ? <FaThumbsUp /> : <FaRegThumbsUp />} Like
  </button>
</div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-1 cursor-pointer" onClick={() => toggleComments(post._id)}>
                    <FaCommentDots className="text-[#E59560]" /> {post.comments.length}
                  </span>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-[#E59560]" onClick={() => toggleComments(post._id)}>
                    <FaRegCommentDots /> Comment
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments[post._id] && (
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInputs[post._id] || ""}
                      onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                    <button onClick={() => handleCommentSubmit(post._id)} className="px-4 py-2 bg-[#E59560] text-white rounded-lg">
                      Submit
                    </button>
                  </div>
                  <div className="mt-4 bg-gray-100 p-2 rounded-lg max-h-24 overflow-y-auto">
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex items-start gap-2 mb-2">
                        <img src={comment.user.profileImage || "default-profile.png"} alt="Commenter" className="w-6 h-6 rounded-full" />
                        <div className="bg-white p-2 rounded-lg shadow">
                          <span className="font-bold text-sm">{comment.user.fullName}</span>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                {/* Show the list of users who liked the post */}
                {showLikes[post._id] && likeDetails[post._id] && (
                    <div className="mt-4 bg-gray-100 p-2 rounded-lg max-h-24 overflow-y-auto">
                      <h4 className="text-sm font-bold text-gray-700">Liked by:</h4>
                       {likeDetails[post._id].map((user) => (
                         <div key={user._id} className="flex items-center gap-2 mt-1">
                           <img src={user.profileImage || "default-profile.png"} alt="User" className="w-6 h-6 rounded-full" />
                           <span className="text-sm">{user.fullName}</span>
                         </div>
                       ))}
                    </div>
                  )}
            </div>
          ))}
        </div>
      </div>

{/* Events Section */}
<div className="w-1/4 bg-white px-4 py-6 rounded-lg font-laila shadow-md fixed right-0 top-0" style={{ marginLeft: "75px", height: "100vh" }}>
  <div className="h-full pt-[60px] flex flex-col justify-start gap-4 text-sm overflow-hidden">
    {/* Header */}
    <div className="flex justify-between items-center mt-6">
      <h4 className="font-bold text-lg text-[#325747] font-laila underline">Upcoming Events</h4>
      <div className="flex gap-1">
        {events.length > 0 && (
          <button 
            onClick={() => setShowAllEvents(true)}
            className="text-[#E59560] hover:text-[#325747] text-xs  font-semibold underline"
          >
            See All
          </button>
        )}
      </div>
    </div>

    {/* Event Card */}
    {events.length === 0 ? (
      <p className="text-gray-500 text-xs">No upcoming events</p>
    ) : (
      <EventCard 
        event={events[0]} 
        onAttendanceChange={updateAttendance}
        currentUserId={userProfile._id}
        onEdit={handleEditEvent}
      />
    )}

 {/* Trending Topics + Adoption Alerts in Grid */}
<div className="grid grid-cols-2 gap-4 mt-4">
  {/* Trending Topics */}
  <div>
    <h4 className="font-bold font-laila text-lg text-[#325747]">Trending Topics</h4>
    <ul className="space-y-1 text-xs text-[#E59560] mt-2">
      {trendingTopics.map((topic, index) => (
        <li key={index} className="hover:text-[#E59560] cursor-pointer">#{topic}</li>
      ))}
    </ul>
  </div>

  {/* Adoption Alerts */}
  <div>
    <h4 className="font-bold text-lg font-laila text-[#325747]">Adoption Alerts</h4>
    <ul className="space-y-2 text-xs text-gray-600 mt-2">
      {adoptionAlerts.map((alert) => (
        <li key={alert.id} className="hover:text-[#E59560] cursor-pointer">
          <span className="font-bold text-[#E59560]">{alert.petName}</span>: {alert.details}
        </li>
      ))}
    </ul>
  </div>
</div>

  </div>
</div>



{/* Add this near your other modals */}
{showAllEvents && (
  <AllEventsModal
    events={events}
    onClose={() => setShowAllEvents(false)}
    onAttendanceChange={updateAttendance}
    currentUserId={userProfile._id}
    onEdit={handleEditEvent}
  />
)}

<EventForm 
  visible={showEventForm}
  onClose={handleCloseForm}
  onSubmit={submitEvent}
  form={eventForm}
  onChange={handleEventInputChange}
  onImageChange={handleEventImageChange}
  isEditing={!!editingEvent}
/>
    
    </div>
  );
};

export default Community;

