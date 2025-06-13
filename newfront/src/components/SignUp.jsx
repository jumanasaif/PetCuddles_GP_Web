import React, { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature, faEnvelope, faPhone, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import DogImage from "../assets/Dog.jpg";
import BgImage from "../assets/bg.png";
import FirstHeader from "./FirstHeader";
import { Alert } from "@mui/material";
import { toast } from "react-toastify";

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Full Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  city: Yup.string().required("City is required"),
});

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSignUp = async (values) => {
    const { fullName, email, phone, password, city ,village} = values;

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password, city,village }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully.");
      } else {
        toast.error("Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      toast.alert("Error", "Something went wrong. Please try again.");
  
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center relative overflow-visible"
      style={{ backgroundColor: "#F6F4E8", backgroundImage: `url(${BgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    >
      <FirstHeader />
      <div className="w-1/2 p-10 mt-12">
        <div style={{marginLeft:"150px"}}>
          <h1 className="text-3xl font-bold  mt-4 font-laila text-[#325747]">Welcome to Pet Cuddles!</h1>
        </div>

        <Formik initialValues={{ fullName: "", email: "", phone: "", password: "", city: "" ,village:""}} validationSchema={validationSchema} onSubmit={handleSignUp}>
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 w-3/4 mx-auto font-laila">
              {/* Full Name Field */}
              <div className="flex flex-col relative ">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Full Name:</label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={values.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                  />
                  <FontAwesomeIcon icon={faSignature} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E59560]" />
                </div>
                {touched.fullName && errors.fullName && <div className="text-red-500 text-sm mt-1">{errors.fullName}</div>}
              </div>

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
                 <div className="text-red-500 text-sm mt-1">The email is already exist</div>
              </div>

              {/* Phone Field */}
              <div className="flex flex-col relative">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Phone:</label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                  />
                  <FontAwesomeIcon icon={faPhone} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E59560]" />
                </div>
                {touched.phone && errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
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
              <div className="flex flex-col">
                <label className="text-[#E59560] font-semibold mb-1 text-left">City</label>
                <select name="city" value={values.city} onChange={handleChange} onBlur={handleBlur}
                  className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] text-[#325747]"
                >
                 <option value="">Select a city</option>
                 {["Nablus", "Ramallah", "Hebron", "Jenin", "Bethlehem", "Jericho", "Tulkarm", "Qalqilya", "Salfit", "Tubas", "Jerusalem"].map((city) => (
                  <option key={city} value={city}>{city}</option>
                   ))}
                </select>

                {touched.city && errors.city && <div className="text-red-500 text-sm mt-1">{errors.city}</div>}
              </div>
              <div className="flex flex-col">
                  <label className="text-[#E59560] font-semibold mb-1 text-left">Village (Optional):</label>
                  <input type="text"  name="village" value={values.village} onChange={handleChange} className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                  />
              </div>
              {/* Submit Button */}
              <button type="submit" className="w-full bg-[#E59560] text-white py-3 rounded-[20px] font-bold shadow-md hover:bg-[#E59560] transition duration-200 ease-in-out transform hover:scale-105">
                Sign Up
              </button>
            </form>
          )}
        </Formik>
        <p className="mt-4 text-gray-600 ml-32 font-laila text-[#325747]">
          Already have an account? <span className="text-[#E59560] cursor-pointer" ><a href="/login">Log In</a></span>
        </p>
      </div>
      {/* Right Side Image Section */}
      <div className="w-1/2 relative flex items-center justify-center overflow-visible">
        <div className="absolute w-96 h-96 bg-[#E59560] rounded-full flex items-center justify-center overflow-visible">
          <img src={DogImage} alt="Happy Dog" className="w-72 h-72 object-cover transform translate-x-4 translate-y-4 overflow-visible" />
        </div>
      </div>        
    </div>
  );
};

export default SignupPage;

