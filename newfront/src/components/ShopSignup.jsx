import React, { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSignature, faEnvelope, faPhone, faEye, faEyeSlash, 
  faStore, faClock, faMapMarkerAlt
} from "@fortawesome/free-solid-svg-icons";
import DogImage from "../assets/Dog.jpg";
import BgImage from "../assets/bg.png";
import FirstHeader from "./FirstHeader";
import { Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Owner Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  shopName: Yup.string().required("Shop name is required"),
  city: Yup.string().required("City is required"),
});

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const ShopSignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

// ShopSignupPage.js
const handleSignUp = async (values) => {
  const { 
    fullName, 
    email, 
    phone, 
    password, 
    shopName, 
    city, 
    village,
    workingHours,
    DeliveryProvide
  } = values;

  try {
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('shopName', shopName);
    formData.append('city', city);
    if (village) formData.append('village', village);
    formData.append('workingHours', JSON.stringify(workingHours));
    formData.append('DeliveryProvide', DeliveryProvide);

    const response = await fetch("http://localhost:5000/api/auth/shop/signup", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      if (data.requiresPayment) {
        // Redirect to subscription page with shopId
        navigate('/shop/subscription', { 
          state: { shopId: data.shopId } 
        });
      } else {
        // Fallback in case requiresPayment is missing
        navigate('/login');
      }
    } else {
      alert("Error", data.message || "Signup failed");
    }
  } catch (error) {
    console.error("Signup Error:", error);
    alert("Error", "Something went wrong. Please try again.");
  }
};
  const initialValues = { 
    fullName: "", 
    email: "", 
    phone: "", 
    password: "", 
    shopName: "", 
    city: "",
    village: "",
    workingHours: {
      sunday: { open: '09:00', close: '17:00', closed: false },
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '', close: '', closed: true },
      saturday: { open: '09:00', close: '17:00', closed: false }
    },
    DeliveryProvide: false
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center relative overflow-visible"
      style={{ backgroundColor: "#F6F4E8", backgroundImage: `url(${BgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    >
      <FirstHeader />
      <div className="w-1/2 p-10 mt-12">
        <div style={{marginLeft:"150px"}}>
          <h1 className="text-3xl font-bold mt-4 font-laila text-[#325747]">Register Your Pet Shop!</h1>
          <p className="text-[#325747] mt-2">Join our network of pet product providers</p>
        </div>

        <Formik 
          initialValues={initialValues} 
          validationSchema={validationSchema} 
          onSubmit={handleSignUp}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 w-3/4 mx-auto font-laila">
              {/* Owner Name Field */}
              <div className="flex flex-col relative">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Owner Name:</label>
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

              {/* Shop Name Field */}
              <div className="flex flex-col relative">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Shop Name:</label>
                <div className="relative">
                  <input
                    type="text"
                    name="shopName"
                    placeholder="Enter your shop name"
                    value={values.shopName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                  />
                  <FontAwesomeIcon icon={faStore} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E59560]" />
                </div>
                {touched.shopName && errors.shopName && <div className="text-red-500 text-sm mt-1">{errors.shopName}</div>}
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
                {touched.email && errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
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

              {/* City Field */}
              <div className="flex flex-col">
                <label className="text-[#E59560] font-semibold mb-1 text-left">City</label>
                <select 
                  name="city" 
                  value={values.city} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] text-[#325747]"
                >
                  <option value="">Select a city</option>
                  {["Nablus", "Ramallah", "Hebron", "Jenin", "Bethlehem", "Jericho", "Tulkarm", "Qalqilya", "Salfit", "Tubas", "Jerusalem"].map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {touched.city && errors.city && <div className="text-red-500 text-sm mt-1">{errors.city}</div>}
              </div>

              {/* Village Field */}
              <div className="flex flex-col">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Village (Optional):</label>
                <input 
                  type="text"  
                  name="village" 
                  value={values.village} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                />
              </div>

              {/* Working Hours Section */}
              <div className="mt-6">
                <h3 className="text-[#E59560] font-semibold mb-3 text-left">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  Working Hours
                </h3>
                
                {days.map(day => (
                  <div key={day} className="mb-3 p-3 border border-[#E59560] rounded-lg">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`${day}-closed`}
                        checked={values.workingHours[day].closed}
                        onChange={(e) => {
                          setFieldValue(`workingHours.${day}.closed`, e.target.checked);
                        }}
                        className="mr-2"
                      />
                      <label htmlFor={`${day}-closed`} className="text-[#325747] capitalize">
                        {day} - Closed
                      </label>
                    </div>
                    
                    {!values.workingHours[day].closed && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-[#325747] mb-1">Opening Time</label>
                          <input
                            type="time"
                            value={values.workingHours[day].open}
                            onChange={(e) => setFieldValue(`workingHours.${day}.open`, e.target.value)}
                            className="w-full px-3 py-2 border border-[#E59560] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-[#325747] mb-1">Closing Time</label>
                          <input
                            type="time"
                            value={values.workingHours[day].close}
                            onChange={(e) => setFieldValue(`workingHours.${day}.close`, e.target.value)}
                            className="w-full px-3 py-2 border border-[#E59560] rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center mb-4">
  <input
    type="checkbox"
    id="DeliveryProvide"
    checked={values.DeliveryProvide}
    onChange={(e) => setFieldValue('DeliveryProvide', e.target.checked)}
    className="mr-2 h-5 w-5 text-[#E59560] rounded focus:ring-[#E59560]"
  />
  <label htmlFor="DeliveryProvide" className="text-[#325747]">
    We provide delivery service
  </label>
</div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full bg-[#E59560] text-white py-3 rounded-[20px] font-bold shadow-md hover:bg-[#E59560] transition duration-200 ease-in-out transform hover:scale-105 mt-6"
              >
                Register Shop
              </button>
            </form>
          )}
        </Formik>

        <p className="mt-4 text-gray-600 ml-32 font-laila text-[#325747]">
          Already have an account? <span className="text-[#E59560] cursor-pointer"><a href="/login">Log In</a></span>
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

export default ShopSignupPage;
