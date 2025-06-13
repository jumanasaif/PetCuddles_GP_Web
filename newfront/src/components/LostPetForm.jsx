import React, { useState, useRef } from "react";
import axios from "axios";
import { FaMapMarkerAlt, FaCalendar, FaClock, FaInfoCircle, FaMoneyBillAlt } from "react-icons/fa";

const MarkAsLostForm = ({ petId, ownerId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    last_seen_location: "",
    last_seen_date: "",
    last_seen_time: "",
    distinctive_features: "",
    reward: "",
    additional_details: "",
  });

  // Refs for date and time inputs
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/pets/lostpets", {
        pet_id: petId,
        owner_id: ownerId,
        ...formData,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error("Error reporting lost pet:", error);
    }
  };

  // Function to trigger date picker
  const handleDateIconClick = () => {
    dateInputRef.current.showPicker();
  };

  // Function to trigger time picker
  const handleTimeIconClick = () => {
    timeInputRef.current.showPicker();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 font-laila text-[#325747]" style={{ marginLeft: "100px" }}>Report Lost Pet</h2>
        <form onSubmit={handleSubmit}>
          {/* Add CSS to hide default icons */}
          <style>
            {`
              input[type="date"]::-webkit-calendar-picker-indicator,
              input[type="time"]::-webkit-calendar-picker-indicator {
                display: none;
              }

              input[type="date"]::-moz-calendar-picker-indicator,
              input[type="time"]::-moz-calendar-picker-indicator {
                display: none;
              }

              input[type="date"]::-ms-clear,
              input[type="time"]::-ms-clear {
                display: none;
              }

              input[type="date"],
              input[type="time"] {
                background: none;
                padding-right: 0;
              }
            `}
          </style>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 font-laila text-[#325747]">Last Seen Location</label>
            <div className="flex items-center border border-gray-300 rounded px-3 py-2">
              <FaMapMarkerAlt className="text-[#E59560] mr-2 " />
              <input
                type="text"
                name="last_seen_location"
                value={formData.last_seen_location}
                onChange={handleChange}
                className="w-full outline-none"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 font-laila text-[#325747]">Last Seen Date</label>
            <div className="flex items-center border border-gray-300 rounded px-3 py-2">
              <FaCalendar
                className="text-[#E59560] mr-2 cursor-pointer"
                onClick={handleDateIconClick} // Trigger date picker on icon click
              />
              <input
                type="date"
                name="last_seen_date"
                value={formData.last_seen_date}
                onChange={handleChange}
                className="w-full outline-none"
                required
                ref={dateInputRef} // Ref for date input
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 font-laila text-[#325747]">Last Seen Time</label>
            <div className="flex items-center border border-gray-300 rounded px-3 py-2">
              <FaClock
                className="text-[#E59560] mr-2 cursor-pointer"
                onClick={handleTimeIconClick} // Trigger time picker on icon click
              />
              <input
                type="time"
                name="last_seen_time"
                value={formData.last_seen_time}
                onChange={handleChange}
                className="w-full outline-none"
                ref={timeInputRef} // Ref for time input
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 font-laila text-[#325747]">Distinctive Features</label>
            <div className="flex items-center border border-gray-300 rounded px-3 py-2">
              <FaInfoCircle className="text-[#E59560] mr-2" />
              <input
                type="text"
                name="distinctive_features"
                value={formData.distinctive_features}
                onChange={handleChange}
                className="w-full outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 font-laila text-[#325747]">Reward (Optional)</label>
            <div className="flex items-center border border-gray-300 rounded px-3 py-2">
              <FaMoneyBillAlt className="text-[#E59560] mr-2" />
              <input
                type="number"
                name="reward"
                value={formData.reward}
                onChange={handleChange}
                className="w-full outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 font-laila text-[#325747]">Additional Details</label>
            <textarea
              name="additional_details"
              value={formData.additional_details}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 outline-none"
              rows="3"
            ></textarea>
          </div>
          <div className="flex justify-center space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" className="bg-[#E59560] text-white px-4 py-2 rounded-md ">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkAsLostForm;