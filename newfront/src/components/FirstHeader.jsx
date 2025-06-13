import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faPaw } from '@fortawesome/free-solid-svg-icons';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { ClipboardDocumentListIcon, BellAlertIcon, MapPinIcon, MagnifyingGlassIcon ,QrCodeIcon,ShoppingBagIcon,CpuChipIcon, LightBulbIcon }from "@heroicons/react/24/outline";
import LogiImg from "../assets/petLogo.png"; 
import pawImg from "../assets/paw.png"; 
import food from "../assets/dog-food.png"; 

import { Link } from "react-router-dom";
const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Function to close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest("#dropdown-menu") && !event.target.closest("#dropdown-button")) {
      setDropdownOpen(false);
    }
  };

  // Attach event listener to close dropdown when clicking outside
  React.useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <header className="w-full bg-[#F6F4E8] shadow-md fixed top-0 z-50 h-20 flex items-center">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo and Branding */}
        <div className="flex items-center overflow-visible" style={{ height: "60px" }}>
             <img src={LogiImg} alt="PetCuddles Logo"
               style={{
             transform: "scale(3)",
             transformOrigin: "center",
              height: "40px",
              width: "auto",
              }}
            />
            <span className="text-3xl font-bold text-[#E59560] ml-6">Pet Cuddles</span> {/* Increased margin */}
        </div>

     
            

        {/* Navigation Menu */}
        <nav className="flex items-center space-x-6 relative font-laila text-[#325747]  font-semibold">
          <a href="/" className="hover:text-[#E59560] ">Home</a>
           
          {/* Dropdown */}
          <div className="relative">
            <button
              id="dropdown-button"
              className="flex items-center  hover:text-[#E59560] focus:outline-none"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Services <ChevronDownIcon className="w-4 h-4 ml-1" />
            </button>

            {dropdownOpen && (
              <div
                id="dropdown-menu"
                className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-md p-2"
              >
                

                <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-blue-500" /> Health & Veterinary Services
                </a>
                <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                  <MapPinIcon className="w-5 h-5 mr-2 text-green-500" /> Pet-Friendly Locations
                </a>
                <a href="/ai-health-check" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                   <CpuChipIcon className="w-5 h-5 mr-2 text-indigo-500" /> AI Pet Health Check
               </a>
                <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                   <LightBulbIcon className="w-5 h-5 mr-2 text-purple-500" /> Training & Behavior
                </a>
                <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                  <img src={food} alt="Search" className="w-5 h-5 mr-2" />
                      Pet Nutrition
                </a>
               <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                 <QrCodeIcon className="w-5 h-5 mr-2 text-blue-500" /> Digital Pet ID
               </a>
               <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                  <ShoppingBagIcon className="w-5 h-5 mr-2 text-teal-500" /> Pet Supply Stores
              </a>
            </div>
              
            )}
          </div>
          <a href="/" className="hover:text-[#E59560] " >Community</a>
          <a href="/" className="hover:text-[#E59560] ">Adoption</a>
          <a href="/" className="hover:text-[#E59560] " >About Us</a>    
        </nav>

        {/* Call-to-Action Buttons */}
        <div className="flex items-center space-x-4 font-laila ">
          <Link to="/signup" className="bg-[#E59560] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#E59560] transition">
             Sign Up
          </Link>
          <Link to="/login" className="bg-[#E59560] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#E59560] transition">
             Sign in
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
