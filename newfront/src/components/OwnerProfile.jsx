import React, { useState, useEffect } from "react";
import Header from "./header";
import { motion } from "framer-motion";
import axios from "axios";
import "@fontsource/laila";
import { FaPaw, FaUserEdit, FaCommentAlt, FaComments, FaCamera, FaSave, FaPaperPlane } from "react-icons/fa";
import { useChat } from "./ChatProvider";
import { useNavigate } from 'react-router-dom';

const cities = ["Nablus", "Ramallah", "Hebron", "Jenin", "Bethlehem", "Jericho", "Tulkarm", "Qalqilya", "Salfit", "Tubas"];

const OwnerProfile = () => {
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    city: "",
    phone: "",
    password: "",
    profileImage: "",
    village: "",
  });
  const [feedback, setFeedback] = useState("");  
  const { startChat } = useChat();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
  
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUserData({
        fullName: parsedUser.fullName,
        email: parsedUser.email,
        city: parsedUser.city || "",
        phone: parsedUser.phone || "",
        village: parsedUser.village || "",
        password: "",   
        profileImage: parsedUser.profileImage || "",
      });
      setUserName(parsedUser.fullName);
    }
  }, []);
  
  const handleChatWithAdmin = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/get-admin');
      const adminId = response.data.admin._id;
      await startChat(adminId, 'Admin');
      navigate('/chat');
    } catch (error) {
      console.error('Error starting chat with admin:', error);
      alert('Failed to start chat with admin');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
  
      const updatedProfile = {
        ...userData,
        profileImage: base64Image
      };
  
      try {
        const token = localStorage.getItem("token");
        const response = await axios.put("http://localhost:5000/api/UpdateOwnerProfile", updatedProfile, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
  
        if (response.data.success) {
          setUserData((prev) => ({ ...prev, profileImage: response.data.profileImage }));
          localStorage.setItem("user", JSON.stringify({ ...userData, profileImage: response.data.profileImage }));
          alert("Profile image updated successfully!");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Error uploading image");
      }
    };
    reader.onerror = (error) => {
      console.error("Error converting image:", error);
    };
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put("http://localhost:5000/api/UpdateOwnerProfile", userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        localStorage.setItem("user", JSON.stringify({
          fullName: userData.fullName,
          email: userData.email,
          role: "pet_owner",
          city: userData.city,
          village: userData.village,
          phone: userData.phone,
          profileImage: userData.profileImage,
        }));
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Update failed:", error);
      alert("Error updating profile");
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/api/submitFeedback", {
        userId: userData.email,
        feedback,
      });
      alert("Feedback submitted successfully!");
      setFeedback("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback");
    }
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F6F4E8" , marginTop:"80px"}}>
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          {/* Profile Image */}
          <div className="relative mb-4">
            {userData.profileImage ? (
              <img 
                src={userData.profileImage} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#BACEC1] flex items-center justify-center border-4 border-white shadow-lg">
                <FaUserEdit className="text-4xl text-[#325747]" />
              </div>
            )}
            <label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 bg-[#E59560] text-white rounded-full p-2 cursor-pointer shadow-md hover:bg-[#d4834a] transition">
              <input type="file" id="profile-image-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <FaCamera className="text-lg" />
            </label>
          </div>
          
          <h1 className="text-3xl font-bold text-[#325747] font-laila mb-2">
            {userName}
          </h1>
          
          {/* Navigation Tabs */}
          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-2 rounded-full font-medium flex items-center gap-2 ${activeTab === "profile" ? "bg-[#E59560] text-white" : "bg-[#BACEC1] text-[#325747]"}`}
            >
              <FaUserEdit /> My Profile
            </button>
            <button 
              onClick={() => setActiveTab("feedback")}
              className={`px-6 py-2 rounded-full font-medium flex items-center gap-2 ${activeTab === "feedback" ? "bg-[#E59560] text-white" : "bg-[#BACEC1] text-[#325747]"}`}
            >
              <FaCommentAlt /> Feedback
            </button>
            <button 
              onClick={handleChatWithAdmin}
              className="px-6 py-2 rounded-full font-medium bg-[#BACEC1] text-[#325747] flex items-center gap-2 hover:bg-[#E59560] hover:text-white transition"
            >
              <FaComments /> Chat with Admin
            </button>
          </div>
        </div>

        {/* Profile Content */}
        {activeTab === "profile" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-[#325747] font-laila mb-6 flex items-center gap-2">
              <FaUserEdit /> Profile Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={userData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  readOnly
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg bg-gray-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">City</label>
                <select
                  name="city"
                  value={userData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">Village</label>
                <input
                  type="text"
                  name="village"
                  value={userData.village}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#325747] mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={userData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <button
              onClick={handleUpdate}
              className="mt-6 w-full bg-[#E59560] hover:bg-[#d4834a] text-white py-3 font-medium rounded-lg flex items-center justify-center gap-2 transition"
            >
              <FaSave /> Update Profile
            </button>
          </motion.div>
        )}

        {/* Feedback Content */}
        {activeTab === "feedback" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-[#325747] font-laila mb-6 flex items-center gap-2">
              <FaCommentAlt /> Share Your Feedback
            </h2>

            <div className="mb-6">
              <p className="text-[#325747] mb-4">
                We value your input! Please let us know about your experience or any suggestions you might have.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback helps us improve..."
                className="w-full h-40 px-4 py-3 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
              ></textarea>
            </div>

            <button
              onClick={handleFeedbackSubmit}
              className="w-full bg-[#325747] hover:bg-[#244535] text-white py-3 font-medium rounded-lg flex items-center justify-center gap-2 transition"
            >
              <FaPaperPlane /> Submit Feedback
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OwnerProfile;