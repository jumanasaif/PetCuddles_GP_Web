// src/components/ShopSubscription.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ShopSubscription = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const shopId = location.state?.shopId;

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/shop-payment/shop-subscription-plans');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPlans(data);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    if (!shopId) {
      alert('Shop information missing. Please start the registration process again.');
      navigate('/shop-signup');
      return;
    }

    try {
      const amount = plans[selectedPlan].price;
      
      navigate('/shop-payment', { 
        state: { 
          shopId,
          amount,
          plan: selectedPlan 
        } 
      });
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Failed to proceed to payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F6F4E8]">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-[#E59560]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#F6F4E8] p-4">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button 
          className="bg-[#E59560] text-white px-6 py-2 rounded-lg hover:bg-[#d48652] transition"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="text-center mb-8">
          <FontAwesomeIcon icon={faStore} size="3x" className="text-[#E59560] mb-4" />
          <h1 className="text-3xl font-bold text-[#325747]">Choose Your Shop Plan</h1>
          <p className="text-[#E59560] mt-2">Select a subscription to activate your shop</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[#bacec1] rounded-full p-1">
            <button
              className={`px-6 py-2 rounded-full ${selectedPlan === 'monthly' ? 'bg-[#325747] text-white' : 'text-[#325747]'}`}
              onClick={() => handlePlanSelect('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-full ${selectedPlan === 'yearly' ? 'bg-[#325747] text-white' : 'text-[#325747]'}`}
              onClick={() => handlePlanSelect('yearly')}
            >
              Yearly
              {selectedPlan === 'yearly' && plans.yearly?.savings && (
                <span className="ml-2 bg-[#E59560] text-white text-xs px-2 py-1 rounded-full">
                  {plans.yearly.savings}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={`bg-white border-2 ${selectedPlan === 'monthly' ? 'border-[#E59560]' : 'border-[#bacec1]'} rounded-xl p-6`}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#325747]">Monthly</h2>
              <p className="text-4xl font-bold text-[#E59560] my-3">
                ${(plans.monthly.price / 100).toFixed(2)}
              </p>
              <p className="text-[#325747]">per month</p>
            </div>
            <ul className="space-y-3 mb-6">
              {plans.monthly.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mt-1 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 rounded-lg font-bold ${selectedPlan === 'monthly' ? 'bg-[#E59560] text-white' : 'bg-[#bacec1] text-[#325747]'}`}
              onClick={() => handlePlanSelect('monthly')}
            >
              {selectedPlan === 'monthly' ? 'Selected' : 'Select'}
            </button>
          </div>

          <div className={`bg-white border-2 ${selectedPlan === 'yearly' ? 'border-[#E59560]' : 'border-[#bacec1]'} rounded-xl p-6`}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#325747]">Yearly</h2>
              <p className="text-4xl font-bold text-[#E59560] my-3">
                ${(plans.yearly.price / 100).toFixed(2)}
              </p>
              <p className="text-[#325747]">per year</p>
            </div>
            <ul className="space-y-3 mb-6">
              {plans.yearly.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mt-1 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 rounded-lg font-bold ${selectedPlan === 'yearly' ? 'bg-[#E59560] text-white' : 'bg-[#bacec1] text-[#325747]'}`}
              onClick={() => handlePlanSelect('yearly')}
            >
              {selectedPlan === 'yearly' ? 'Selected' : 'Select'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            className="bg-[#325747] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#1d3124] transition"
            onClick={handleSubscribe}
          >
            Continue to Payment
          </button>
          <p className="text-sm text-gray-500 mt-4">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopSubscription;
