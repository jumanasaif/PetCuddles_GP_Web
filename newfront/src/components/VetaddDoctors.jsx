import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserMd, 
  faPlus, 
  faVenusMars, 
  faCalendar, 
  faPhone, 
  faEnvelope, 
  faCamera,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const initialValues = { 
  name: '', 
  gender: 'male',
  birthDate: '',
  phone: '',
  email: '',
  specialty: '',
  profileImage: null
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Doctor name is required'),
  gender: Yup.string().required('Gender is required'),
  birthDate: Yup.date(),
  phone: Yup.string()
    .matches(/^[0-9]{10,15}$/, 'Phone number is not valid')
    .required('Phone number is required'),
  email: Yup.string()
    .email('Invalid email'),

  specialty: Yup.string(),
  profileImage: Yup.mixed()
    .test('fileSize', 'File too large', value => !value || (value && value.size <= 5 * 1024 * 1024))
    .test('fileType', 'Unsupported file format', value => !value || (value && ['image/jpeg', 'image/png'].includes(value.type)))
});

const DoctorForm = ({ onClose, onAddDoctor, onUpdateDoctor, existingDoctor, doctors, setDoctors }) => {
  const [error, setError] = React.useState(null);
  const [clinicName, setClinicName] = React.useState('');

  // Fetch clinic name when component mounts
  React.useEffect(() => {
    const fetchClinicName = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/vet/clinic/name', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClinicName(response.data.clinicName);
      } catch (err) {
        console.error('Error fetching clinic name:', err);
      }
    };
    fetchClinicName();
  }, []);


  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append all fields
      formData.append('name', values.name);
      formData.append('gender', values.gender);
      formData.append('birthDate', values.birthDate);
      formData.append('phone', values.phone);
      formData.append('email', values.email || generateDefaultEmail(values.name));
      formData.append('specialty', values.specialty || 'General');
      
      if (values.profileImage) {
        formData.append('profileImage', values.profileImage);
      }

      let response;
      if (existingDoctor) {
        // Update existing doctor
        response = await axios.put(
          `http://localhost:5000/api/vet/doctors/${existingDoctor._id}`,
          formData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        onUpdateDoctor(response.data);
      } else {
        // Add new doctor
        response = await axios.post(
          'http://localhost:5000/api/vet/doctors',
          formData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        onAddDoctor(response.data);
      }
      
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to save doctor');
    }
  };

    // Generate default email based on clinic name and doctor name
    const generateDefaultEmail = (name) => {
      if (!clinicName || !name) return '';
      const formattedClinicName = clinicName.replace(/\s+/g, '_').toLowerCase();
      const formattedDoctorName = name.replace(/\s+/g, '_').toLowerCase();
      return `${formattedClinicName}_${formattedDoctorName}@gmail.com`;
    };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center bg-[#325747] text-white p-4 rounded-t-xl">
          <h2 className="text-xl font-bold font-laila"style={{marginLeft:"100px"}}>
            <FontAwesomeIcon icon={faUserMd} className="mr-2" />
            Add New Doctor
          </h2>
          <button onClick={onClose} className="text-white hover:text-[#E59560]">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        
        <div className="p-6">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, ...formikProps }) => (
              <form onSubmit={formikProps.handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-[#325747] mb-1">Doctor Name</label>
                  <input
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={formikProps.handleChange}
                    onBlur={formikProps.handleBlur}
                    className="w-full px-4 py-2 border border-[#E59560] rounded-lg"
                  />
                  {formikProps.touched.name && formikProps.errors.name && (
                    <div className="text-red-500 text-sm">{formikProps.errors.name}</div>
                  )}
                </div>

                {/* Gender Field */}
                <div>
                  <label className="block text-[#325747] mb-1">Gender</label>
                  <div className="flex space-x-4">
                    {['male', 'female'].map(gender => (
                      <label key={gender} className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value={gender}
                          checked={values.gender === gender}
                          onChange={formikProps.handleChange}
                          className="mr-2"
                        />
                        <FontAwesomeIcon icon={faVenusMars} className="mr-1" />
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Birth Date Field */}
                <div>
                  <label className="block text-[#325747] mb-1">Birth Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="birthDate"
                      value={values.birthDate}
                      onChange={formikProps.handleChange}
                      onBlur={formikProps.handleBlur}
                      className="w-full px-4 py-2 border border-[#E59560] rounded-lg pr-10"
                    />
                    <FontAwesomeIcon 
                      icon={faCalendar} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#E59560]"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-[#325747] mb-1">Phone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={values.phone}
                      onChange={formikProps.handleChange}
                      onBlur={formikProps.handleBlur}
                      className="w-full px-4 py-2 border border-[#E59560] rounded-lg pr-10"
                    />
                    <FontAwesomeIcon 
                      icon={faPhone} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#E59560]"
                    />
                  </div>
                  {formikProps.touched.phone && formikProps.errors.phone && (
                    <div className="text-red-500 text-sm">{formikProps.errors.phone}</div>
                  )}
                </div>
 {/* Email Field */}
        <div>
          <label className="block text-[#325747] mb-1">Email</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={values.email || generateDefaultEmail(values.name)}
              onChange={(e) => {
                formikProps.handleChange(e);
                // Only update if the field is empty or matches the generated pattern
                if (!values.email || values.email === generateDefaultEmail(values.name)) {
                  setFieldValue('email', generateDefaultEmail(e.target.value));
                }
              }}
              onBlur={formikProps.handleBlur}
              className="w-full px-4 py-2 border border-[#E59560] rounded-lg pr-10"
            />
            <FontAwesomeIcon 
              icon={faEnvelope} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#E59560]"
            />
          </div>
          {formikProps.touched.email && formikProps.errors.email && (
            <div className="text-red-500 text-sm">{formikProps.errors.email}</div>
          )}
        </div>

                {/* Specialty Field */}
                <div>
                  <label className="block text-[#325747] mb-1">Specialty</label>
                  <select
                    name="specialty"
                    value={values.specialty}
                    onChange={formikProps.handleChange}
                    onBlur={formikProps.handleBlur}
                    className="w-full px-4 py-2 border border-[#E59560] rounded-lg"
                  >
                    <option value="">Select specialty</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>

                {/* Image Upload Field */}
                <div>
                  <label className="block text-[#325747] mb-1">Doctor Image</label>
                  <input
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={(e) => {
                      if (e.target.files.length > 0) {
                        setFieldValue('profileImage', e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="doctorImage"
                  />
                  <label 
                    htmlFor="doctorImage" 
                    className="w-full px-4 py-2 border-2 border-dashed border-[#E59560] rounded-lg cursor-pointer flex items-center justify-center"
                  >
                    {values.profileImage ? (
                      <span className="text-[#325747]">
                        <FontAwesomeIcon icon={faCamera} className="mr-2" />
                        {values.profileImage.name}
                      </span>
                    ) : (
                      <span className="text-[#325747]">
                        <FontAwesomeIcon icon={faCamera} className="mr-2" />
                        Upload Image
                      </span>
                    )}
                  </label>
                  {formikProps.touched.profileImage && formikProps.errors.profileImage && (
                    <div className="text-red-500 text-sm">{formikProps.errors.profileImage}</div>
                  )}
                </div>

                {/* Password Display */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold text-[#325747]">Default Password:</p>
                  <p className="text-lg font-mono">doctorpass</p>
                  <p className="text-sm text-gray-600 mt-1">This will be the initial password for the doctor</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#E59560] text-white px-6 py-2 rounded-lg hover:bg-[#d48550] transition flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Doctor
                  </button>
                </div>
              </form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default DoctorForm;