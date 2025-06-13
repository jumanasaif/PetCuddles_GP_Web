import React from "react";
import { FaSearch, FaSignOutAlt, FaBell } from "react-icons/fa";
import LogiImg from "../assets/petLogo.png";

const CommunityHeader = ({ searchQuery, setSearchQuery, filterCategory, setFilterCategory }) => {
  return (
    <header className="w-full bg-[#F6F4E8] shadow-md fixed top-0 z-50 h-20 flex items-center">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Left Side - Title */}
        <div className="flex items-center overflow-visible" style={{ height: "60px" }}>
          <img
            src={LogiImg}
            alt="PetCuddles Logo"
            style={{
              transform: "scale(3)",
              transformOrigin: "center",
              height: "40px",
              width: "auto",
            }}
          />
          <span className="text-3xl font-bold text-[#E59560] ml-6">Community</span>
        </div>

        {/* Middle - Navigation Buttons */}
        <div style={{width:"600px"}}>
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for posts, users"
              className="p-2  w-full border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute top-3 right-3 text-[#E59560]" />
          </div>
        </div>

        {/* Right Side - Search & Filter & Leave Icon */}
        <div className="flex items-center gap-4">
         

          {/* Category Filter */}
          <select
            className="p-2 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] font-laila text-[#325747] font-bold"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option>All</option>
            <option>General</option>
            <option>Lost_Pet</option>
            <option>Health</option>
            <option>adoption</option>
            <option>petCare</option>
            <option>Training</option>
            <option>Pet_Supplies</option>

          
          </select>


          {/* Leave Icon (Logout/Exit) */}
          <a className="text-[#E59560] text-xl" href="/home">
            <FaSignOutAlt />
          </a>
        </div>
      </div>
    </header>
  );
};

export default CommunityHeader;