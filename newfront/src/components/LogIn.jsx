import React, { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import DogImage from "../assets/dog2.png";
import BgImage from "../assets/bg.png";
import FirstHeader from "./FirstHeader";

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", values, {
          withCredentials: true,
           headers: {
            'Content-Type': 'application/json'
           }
      });
      
      localStorage.clear();
  
   
  
      localStorage.setItem("token", response.data.token);
      
      const storageKey = response.data.userType; 
      localStorage.setItem(response.data.userType, JSON.stringify({
        ...response.data.userData,
        userType: response.data.userType
      }));
      
  
      // Redirect based on user type
      const redirectPaths = {
        admin: '/admin/dashboard',
        clinic: '/clinic',
        user: '/home',
        shop:'/shop',
        doctor:'/doctor-dashboard'
      };
      navigate(redirectPaths[response.data.userType]);
  
    } catch (error) {
      setSubmitting(false);
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            setErrors({ 
              email: "Invalid email",
              password: "Invalid password" 
            });
            break;
          case 403:
            if (error.response.data.requiresVerification) {
              navigate('/vet-pending');
            } else {
              alert('Account is inactive. Please contact support.');
            }
            break;
          case 500:
            alert('Server error. Please try again later.');
            break;
          default:
            alert('Login failed. Please try again.');
        }
      } else {
        alert('Network error. Please check your connection.');
      }
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center relative overflow-visible"
      style={{ backgroundColor: "#F6F4E8", backgroundImage: `url(${BgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    >
      <FirstHeader />
      <div className="w-1/2 p-10 mt-12 ml-24">
        <h1 className="text-5xl font-bold  font-laila text-[#325747]" style={{marginLeft:"230px"}}>Welcome Back!</h1>
        <p className="text-[#325747] mt-4  font-laila" style={{marginLeft:"260px"}}>Log in to access your account.</p>

        <Formik initialValues={{ email: "", password: "" }} validationSchema={validationSchema} onSubmit={handleLogin}>
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 w-3/4 mx-auto ml-32 font-laila">
              {/* Email Field */}
              <div className="flex flex-col relative">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Email:</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                  />
                  <FontAwesomeIcon icon={faEnvelope} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E59560]" />
                </div>
                {touched.email && errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
              </div>

              {/* Password Field */}
              <div className="flex flex-col relative">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Password:</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEye : faEyeSlash}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E59560] cursor-pointer"
                    onClick={togglePasswordVisibility}
                  />
                </div>
                {touched.password && errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right text-[#E59560] text-sm cursor-pointer" onClick={() => navigate("/forgot-password")}>
                Forgot Password?
              </div>

              {/* Submit Button */}
              <button type="submit" className="w-full bg-[#E59560] text-white py-3 rounded-[20px] font-bold shadow-md hover:bg-[#E59560] transition duration-200 ease-in-out transform hover:scale-105">
                Log In
              </button>
            </form>
          )}
        </Formik>

        <p className="mt-4  ml-32 font-laila text-[#325747]">
          Don't have an account?{" "}
          <span className="text-[#E59560] cursor-pointer" onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>
      </div>

      {/* Dog Image Section */}
      <div className="w-1/2 relative flex items-center justify-center overflow-visible" style={{marginRight:"60px"}}>
        <div className="absolute w-96 h-96 bg-[#E59560] rounded-full flex items-center justify-center overflow-visible">
          <img src={DogImage} alt="Happy Dog" className="w-72 h-72 object-cover transform translate-x-4 translate-y-4 overflow-visible" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

