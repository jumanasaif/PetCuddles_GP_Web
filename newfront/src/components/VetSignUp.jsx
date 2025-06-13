import React, { useState, useRef } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSignature, faEnvelope, faPhone, faEye, faEyeSlash, 
  faHospital, faIdCard, faUpload, faSpinner,faClock
} from "@fortawesome/free-solid-svg-icons";
import DogImage from "../assets/vet2.png";
import BgImage from "../assets/bg.png";
import FirstHeader from "./FirstHeader";
import { Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Full Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  clinicName: Yup.string().required("Clinic name is required"),
  clinicLicenseImage: Yup.mixed()
    .required("License image is required")
    .test("fileSize", "File too large", value => value && value.size <= 5 * 1024 * 1024)
    .test("fileType", "Unsupported file format", value => value && ["image/jpeg", "image/png"].includes(value.type)),
  city: Yup.string().required("City is required"),
});

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];


const VetSignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [licensePreview, setLicensePreview] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLicenseUpload = async (event, setFieldValue) => {
    const file = event.target.files[0];
    if (!file) return;
  
    // Client-side validation
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setVerificationResult({
        isValid: false,
        message: 'Only JPEG and PNG images are allowed'
      });
      return;
    }
  
    if (file.size > 5 * 1024 * 1024) {
      setVerificationResult({
        isValid: false,
        message: 'File size must be less than 5MB'
      });
      return;
    }
  
    setIsUploading(true);
    setVerificationResult(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setLicensePreview(e.target.result);
    reader.readAsDataURL(file);
  
    try {
      const formData = new FormData();
      formData.append('licenseImage', file);
      
      const response = await fetch('http://localhost:5000/api/auth/verify-license', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      
      setFieldValue('clinicLicenseImage', file);
      setVerificationResult(result);
      
    } catch (error) {
      console.error("Verification Error:", error);
      setVerificationResult({
        isValid: false,
        message: error.message || 'Error during verification'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignUp = async (values) => {
    const { 
      fullName, 
      email, 
      phone, 
      password, 
      clinicName, 
      clinicLicenseImage, 
      city, 
      village,
      workingHours 
    } = values;
  
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('password', password);
      formData.append('clinicName', clinicName);
      formData.append('clinicLicenseImage', clinicLicenseImage);
      formData.append('city', city);
      if (village) formData.append('village', village);
      
      // Add working hours in the correct format
      Object.entries(workingHours).forEach(([day, hours]) => {
        formData.append(`workingHours[${day}][closed]`, hours.closed);
        formData.append(`workingHours[${day}][open]`, hours.open);
        formData.append(`workingHours[${day}][close]`, hours.close);
      });
  
      const response = await fetch("http://localhost:5000/api/auth/vet/signup", {
        method: "POST",
        body: formData
      });
  
      if (!response.ok) throw new Error('Signup failed');
      
      const data = await response.json();
      alert("Success", "Registration submitted for approval");
      navigate('/');
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Error", error.message || "Signup failed");
    }
  };
    // Initialize working hours with default values
    const initialValues = { 
      fullName: "", 
      email: "", 
      phone: "", 
      password: "", 
      clinicName: "", 
      clinicLicenseImage: null, 
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
          <h1 className="text-3xl font-bold mt-4 font-laila text-[#325747]">Welcome Veterinarians!</h1>
          <p className="text-[#325747] mt-2">Join our platform to connect with pet owners</p>
        </div>

        <Formik 
          initialValues={initialValues} 
          validationSchema={validationSchema} 
          onSubmit={handleSignUp}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 w-3/4 mx-auto font-laila"> 
              <div className="flex flex-col relative ">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Full Name:</label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter Clinic owner name or manager name"
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

              {/* Clinic Name Field */}
              <div className="flex flex-col relative">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Clinic Name:</label>
                <div className="relative">
                  <input
                    type="text"
                    name="clinicName"
                    placeholder="Enter your clinic name"
                    value={values.clinicName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-[#E59560] rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E59560] pr-12"
                  />
                  <FontAwesomeIcon icon={faHospital} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E59560]" />
                </div>
                {touched.clinicName && errors.clinicName && <div className="text-red-500 text-sm mt-1">{errors.clinicName}</div>}
              </div>

 {/* Clinic License Image Field */}
 <div className="flex flex-col relative">
                <label className="text-[#E59560] font-semibold mb-1 text-left">Clinic License Image:</label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg, image/png"
                  onChange={(e) => handleLicenseUpload(e, setFieldValue)}
                  className="hidden"
                />
                
                <div 
                  className="w-full px-4 py-3 border-2 border-dashed border-[#E59560] rounded-[20px] cursor-pointer flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current.click()}
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-[#E59560] mr-2" />
                      <span>Verifying license...</span>
                    </div>
                  ) : licensePreview ? (
                    <div className="text-center">
                      <img 
                        src={licensePreview} 
                        alt="License Preview" 
                        className="max-h-40 mx-auto mb-2 rounded-lg"
                      />
                      <span className="text-sm text-gray-600">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUpload} className="text-[#E59560] mr-2" />
                      <span>Upload License Image</span>
                    </div>
                  )}
                </div>
                
                {verificationResult && (
                  <div className={`mt-2 text-sm ${verificationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {verificationResult.message}
                  </div>
                )}
                
                {touched.clinicLicenseImage && errors.clinicLicenseImage && (
                  <div className="text-red-500 text-sm mt-1">{errors.clinicLicenseImage}</div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  Upload a clear image of your clinic license with the official seal visible.
                  The seal must be circular and contain the text "STATE OF PALESTINE" and "Ministry of Agriculture".
                </div>
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


               {/* Submit Button */}
                            <button 
                              type="submit" 
                              className="w-full bg-[#E59560] text-white py-3 rounded-[20px] font-bold shadow-md hover:bg-[#E59560] transition duration-200 ease-in-out transform hover:scale-105 mt-6"
                              disabled={isUploading || (verificationResult && !verificationResult.isValid)}
                            >
                              Submit for Approval
                            </button>
                          </form>
                        )}
                      </Formik>
                      <p className="mt-4 text-gray-600 ml-32 font-laila text-[#325747]">
                        Already have an account? <span className="text-[#E59560] cursor-pointer" ><a href="/login">Log In</a></span>
                      </p>
                    </div>
                    {/* Right Side Image Section */}
                    <div className="w-1/2 relative flex items-center justify-center overflow-visible"style={{marginLeft:"-50px"}}>
                      <div className="  bg-[#E59560] rounded-full flex items-center justify-center overflow-visible" style={{marginTop:"-1150px",width:"450px",height:"450px"}}>
                        <img src={DogImage} alt="Happy Dog" className="w-72 h-72 object-cover transform translate-x-[-6]  overflow-visible" style={{marginBottom:"-39px"}}/>
                      </div>
                    </div>        
                  </div>
                );
              };
              
 export default VetSignUp;
