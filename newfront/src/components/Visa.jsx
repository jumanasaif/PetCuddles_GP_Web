import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const VisaInformationForm = ({ amount: initialAmountProp }) => {
  const initialAmount = initialAmountProp ? (parseInt(initialAmountProp) / 100).toFixed(2) : '0.00';
  const { vetId } = useParams();

    const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    cardHolder: '',
    amount: initialAmount 
  });
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Stripe elements
  const stripe = useStripe();
  const elements = useElements();
  

  // Handle input changes
  const handleChange = (name, value) => {
    if (name === 'amount') {
      value = value.replace(/[^0-9.]/g, '');
      const decimalCount = value.split('.').length - 1;
      if (decimalCount > 1) {
        value = value.substring(0, value.length - 1);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Flip animation for card when focusing Stripe's CVV field
  useEffect(() => {
    const cardElement = elements?.getElement(CardElement);
    if (!cardElement) return;
  
    const handleFocus = (event) => {
      if (event.elementType === 'cardCvc') {
        setIsFlipped(true);
      } else {
        setIsFlipped(false);
      }
    };
  
    cardElement.on('focus', handleFocus);
    
    return () => {
      cardElement.off('focus', handleFocus);
    };
  }, [elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cardHolder || !formData.amount) {
      alert('Please complete all fields');
      return;
    }
    
    if (!vetId) {
      alert('Veterinarian information missing');
      return;
    }
  
    if (!stripe || !elements) {
      alert('Payment system is not ready. Please wait...');
      return;
    }
  
    setLoading(true);
  
    try {
      // 1. Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card input not found");
      }
  
      // 2. Extract raw card data from the element
      const { error: elementError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.cardHolder,
        },
      });
  
      if (elementError) {
        throw elementError;
      }
  
      // 3. Create payment intent with extracted card data
      const intentResponse = await fetch('http://localhost:5000/api/payment/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(parseFloat(formData.amount) * 100),
          vetId: vetId,
          paymentMethodId: paymentMethod.id // Pass the payment method ID
        }),
      });
  
      const { clientSecret, error: backendError } = await intentResponse.json();
      if (backendError) throw new Error(backendError);
      if (!clientSecret) throw new Error('Failed to create payment intent');
  
      // 4. Confirm payment with the client secret
      const { paymentIntent, error: confirmationError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.cardHolder,
            },
          }
        }
      );
  
      if (confirmationError) throw confirmationError;
      if (paymentIntent.status !== 'succeeded') throw new Error('Payment failed');
  
      alert(`Payment successful! Your payment of $${formData.amount} was completed.`);
      navigate('/login');
  
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.message || 'An error occurred while processing your payment');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f6f4e8] p-5 pt-8 pb-10">
      {/* Card Preview */}
      <div className="relative h-52 mb-12">
        <AnimatePresence>
          {!isFlipped ? (
            <motion.div
              key="front"
              className="absolute w-full h-56 rounded-xl p-5 bg-gradient-to-br from-[#1d3124] via-[#bacec1] to-[#e59560] shadow-lg"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 90 }}
              transition={{ duration: 0.5 }}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white text-xl font-bold tracking-wide drop-shadow">Visa</span>
                <div className="w-10 h-7 bg-white/30 rounded border border-white/50"></div>
              </div>
              
              <div className="my-5">
                <p className="text-white text-xl font-semibold tracking-wider drop-shadow">
                  •••• •••• •••• ••••
                </p>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-white/80 text-xs mb-1 drop-shadow-sm">CARD HOLDER</p>
                  <p className="text-white text-base font-semibold uppercase drop-shadow-sm">
                    {formData.cardHolder || 'YOUR NAME'}
                  </p>
                </div>
                <div>
                  <p className="text-white/80 text-xs mb-1 drop-shadow-sm">EXPIRES</p>
                  <p className="text-white text-base font-semibold drop-shadow-sm">
                    MM/YY
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              className="absolute w-full h-56 rounded-xl p-5 bg-gradient-to-bl from-[#1d3124] via-[#bacec1] to-[#e59560] shadow-lg"
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 180 }}
              exit={{ rotateY: 270 }}
              transition={{ duration: 0.5 }}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="h-10 bg-black/70 -mx-5 mt-5"></div>
              <div className="self-end mt-5 mr-5">
                <p className="text-white/80 text-xs mb-1 drop-shadow-sm">CVV</p>
                <div className="bg-white/90 px-2 py-1 rounded w-14 items-end">
                  <p className="text-[#1d3124] font-semibold">
                    •••
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form Inputs */}
      <motion.form 
        onSubmit={handleSubmit} 
        className="bg-white rounded-xl p-5 shadow-md"
        initial={{ y: 0 }}
        animate={{ y: focusedField ? -20 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-[#1d3124] text-xl font-bold mb-5 text-center">Payment Information</h2>
        
        {/* Payment Amount Field */}
        <label className="text-[#1d3124] text-sm font-semibold mb-2 block">Payment Amount</label>
        <div className="flex items-center mb-5">
          <span className="text-[#1d3124] text-xl font-bold mr-2">$</span>
          <input
            className={`w-full border rounded-lg px-4 py-3 text-base bg-[#FFF8E7] focus:bg-white focus:border-[#e59560] ${
              focusedField === 'amount' ? 'border-[#e59560] bg-white' : 'border-[#bacec1]'
            }`}
            placeholder="0.00"
            type="text"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            onFocus={() => setFocusedField('amount')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <label className="text-[#1d3124] text-sm font-semibold mb-2 block">Card Holder Name</label>
        <input
          className={`w-full border rounded-lg px-4 py-3 text-base bg-[#FFF8E7] mb-5 focus:bg-white focus:border-[#e59560] ${
            focusedField === 'cardHolder' ? 'border-[#e59560] bg-white' : 'border-[#bacec1]'
          }`}
          placeholder="John Doe"
          type="text"
          value={formData.cardHolder}
          onChange={(e) => handleChange('cardHolder', e.target.value)}
          onFocus={() => setFocusedField('cardHolder')}
          onBlur={() => setFocusedField(null)}
        />

        {/* Stripe Card Element - Secure Payment Fields */}
        <div className="mb-5">
          <label className="text-[#1d3124] text-sm font-semibold mb-2 block">Card Details</label>
          <div className="border border-[#bacec1] rounded-lg p-3 bg-[#FFF8E7]">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1d3124',
                    '::placeholder': {
                      color: '#bacec1',
                    },
                  },
                },
                hidePostalCode: true // Hide unnecessary field
              }}
            />
          </div>
        </div>

        <motion.button
          type="submit"
          className={`w-full bg-[#1d3124] rounded-lg py-4 px-5 text-white text-lg font-bold mt-2 ${
            loading ? 'bg-[#bacec1] opacity-70' : ''
          }`}
          
          disabled={!stripe || loading}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Processing...' : `Pay $${formData.amount || '0.00'}`}
        </motion.button>
      </motion.form>
    </div>
  );
};

export default VisaInformationForm;
