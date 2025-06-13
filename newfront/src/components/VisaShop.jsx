// src/components/ShopPayment.js
import React, { useState } from 'react';
import { CardElement, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ShopPayment = () => {
  const location = useLocation();
  const { shopId, amount, plan } = location.state || {};
  const navigate = useNavigate();
  const elements = useElements();
  
  const [formData, setFormData] = useState({
    cardHolder: '',
    amount: amount ? (amount / 100).toFixed(2) : '0.00'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!shopId || !amount || !plan) {
      setError('Missing payment information. Please start over.');
      return;
    }

    if (!formData.cardHolder) {
      setError('Please enter card holder name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create the payment record
      const response = await fetch('http://localhost:5000/api/shop-payment/create-shop-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          shopId,
          subscriptionPlan: plan
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      // Redirect to login with success message
      navigate('/login', { 
        state: { 
          message: 'Payment successful! Your shop account is now active.' 
        } 
      });
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!shopId || !amount || !plan) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F6F4E8] p-4">
        <div className="text-red-500 text-lg mb-4">
          Missing payment information. Please complete your shop registration first.
        </div>
        <button 
          className="bg-[#E59560] text-white px-6 py-2 rounded-lg hover:bg-[#d48652] transition"
          onClick={() => navigate('/shop-signup')}
        >
          Go to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="text-center mb-6">
          <FontAwesomeIcon icon={faCreditCard} size="3x" className="text-[#E59560] mb-4" />
          <h1 className="text-2xl font-bold text-[#325747]">Complete Your Payment</h1>
          <p className="text-[#E59560] mt-2">
            {plan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription: ${(amount / 100).toFixed(2)}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#325747] font-medium mb-2">Card Holder Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-[#bacec1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
              placeholder="Name on card"
              value={formData.cardHolder}
              onChange={(e) => handleChange('cardHolder', e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#325747] font-medium mb-2">Card Details</label>
            <div className="border border-[#bacec1] rounded-lg p-3">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#325747',
                      '::placeholder': {
                        color: '#bacec1',
                      },
                    },
                  },
                  hidePostalCode: true
                }}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center">
              <span className="text-[#325747]">Total:</span>
              <span className="text-xl font-bold text-[#E59560]">
                ${(amount / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <motion.button
            type="submit"
            className="w-full bg-[#325747] text-white py-3 rounded-lg font-bold hover:bg-[#1d3124] transition"
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Processing...
              </>
            ) : (
              'Complete Payment'
            )}
          </motion.button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Your payment information is securely processed. No actual payment will be taken.
        </p>
      </div>
    </div>
  );
};

export default ShopPayment;
