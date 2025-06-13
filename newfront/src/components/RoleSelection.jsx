import React from "react";
import { useNavigate } from "react-router-dom";
import DogImage from "../assets/Dog.jpg";
import BgImage from "../assets/bg.png";
import FirstHeader from "./FirstHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw, faUser, faHospital, faStore } from "@fortawesome/free-solid-svg-icons";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center relative overflow-visible"
      style={{ 
        backgroundColor: "#F6F4E8", 
        backgroundImage: `url(${BgImage})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        backgroundRepeat: "no-repeat" 
      }}
    >
      <FirstHeader />
      <div className="w-1/2 p-10 mt-12">
        <div style={{ marginLeft: "150px" }}>
          <h1 className="text-3xl font-bold mt-4 font-laila text-[#325747]">
            Welcome to Pet Cuddles!
          </h1>
          <p className="text-[#325747] mt-2">
            Please select your role to continue
          </p>
        </div>

        <div className="mt-8 space-y-6 w-3/4 mx-auto font-laila">
          {/* Pet Owner Card */}
          <div 
            className="border-2 border-[#E59560] rounded-[20px] p-6 cursor-pointer hover:bg-[#F6F4E8] transition duration-200 transform hover:scale-105"
            onClick={() => navigate("/signup")}
          >
            <div className="flex items-center">
              <div className="bg-[#E59560] rounded-full p-4 mr-4">
                <FontAwesomeIcon 
                  icon={faPaw} 
                  className="text-white text-2xl" 
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#325747]">Pet Owner</h2>
                <p className="text-[#325747]">
                  Join as a pet owner to find veterinary services and connect with other pet lovers
                </p>
              </div>
            </div>
            <button className="mt-4 w-full bg-[#E59560] text-white py-2 rounded-[20px] font-bold shadow-md hover:bg-[#d48753] transition duration-200">
              Continue as Pet Owner
            </button>
          </div>

          {/* Veterinarian Card */}
          <div 
            className="border-2 border-[#E59560] rounded-[20px] p-6 cursor-pointer hover:bg-[#F6F4E8] transition duration-200 transform hover:scale-105"
            onClick={() => navigate("/vet/signup")}
          >
            <div className="flex items-center">
              <div className="bg-[#E59560] rounded-full p-4 mr-4">
                <FontAwesomeIcon 
                  icon={faHospital} 
                  className="text-white text-2xl" 
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#325747]">Veterinarian</h2>
                <p className="text-[#325747]">
                  Join as a veterinarian to offer your services and connect with pet owners
                </p>
              </div>
            </div>
            <button className="mt-4 w-full bg-[#E59560] text-white py-2 rounded-[20px] font-bold shadow-md hover:bg-[#d48753] transition duration-200">
              Continue as Veterinarian
            </button>
          </div>

          {/* Pet Shop Card - New Addition */}
          <div 
            className="border-2 border-[#E59560] rounded-[20px] p-6 cursor-pointer hover:bg-[#F6F4E8] transition duration-200 transform hover:scale-105"
            onClick={() => navigate("/shop/signup")}
          >
            <div className="flex items-center">
              <div className="bg-[#E59560] rounded-full p-4 mr-4">
                <FontAwesomeIcon 
                  icon={faStore} 
                  className="text-white text-2xl" 
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#325747]">Pet Shop</h2>
                <p className="text-[#325747]">
                  Join as a pet shop to sell products and connect with pet owners
                </p>
              </div>
            </div>
            <button className="mt-4 w-full bg-[#E59560] text-white py-2 rounded-[20px] font-bold shadow-md hover:bg-[#d48753] transition duration-200">
              Continue as Pet Shop
            </button>
          </div>

          <p className="mt-6 text-center text-[#325747]">
            Already have an account?{" "}
            <span 
              className="text-[#E59560] cursor-pointer font-bold"
              onClick={() => navigate("/login")}
            >
              Log In
            </span>
          </p>
        </div>
      </div>
      
      {/* Right Side Image Section */}
      <div className="w-1/2 relative flex items-center justify-center overflow-visible">
        <div className="absolute w-96 h-96 bg-[#E59560] rounded-full flex items-center justify-center overflow-visible">
          <img 
            src={DogImage} 
            alt="Happy Dog" 
            className="w-72 h-72 object-cover transform translate-x-4 translate-y-4 overflow-visible" 
          />
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;