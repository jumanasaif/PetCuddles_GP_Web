import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMessage("Password reset link has been sent to your email.");
    } catch (error) {
      setMessage("Error: " + (error.response?.data?.message || "Something went wrong"));
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 font-laila">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold text-[#325747]">Forgot Password</h2>
        <p className="text-gray-500 mb-4">Enter your email to reset your password.</p>

        {message && <p className="text-sm text-green-600">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-2"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#E59560] text-white py-2 rounded mt-4"
          >
            Send Reset Link
          </button>
        </form>

        <button
          className="text-sm text-gray-500 mt-4"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;

