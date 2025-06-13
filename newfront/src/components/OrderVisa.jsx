import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const OrderVisa = ({ 
  amount, 
  shopId, 
  items, 
  deliveryAddress, 
  appliedCoupons, 
  onPaymentSuccess 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardHolder, setCardHolder] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!cardHolder.trim()) {
      setError('Please enter card holder name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const response = await fetch('http://localhost:5000/api/shop-payment/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shopId,
          items,
          deliveryAddress,
          appliedCoupons,
          paymentMethod: 'credit_card',
          paymentMethodId: 'pm_card_visa' // In a real app, you'd use the actual payment method ID
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment processing failed');
      }

      // Confirm the payment with Stripe
      if (data.success) {
       setPaymentSuccess(true);
       toast.success('Payment successful!');
       onPaymentSuccess(data.order); // whatever your backend returns
     } else {
       throw new Error(data.message || 'Payment failed');
     }


    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-4">
        <FontAwesomeIcon 
          icon={faCheckCircle} 
          className="text-green-500 text-5xl mb-4" 
        />
        <h3 className="text-xl font-bold text-[#325747] mb-2">
          Payment Successful!
        </h3>
        <p className="text-[#607169]">
          Your order has been placed successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#325747] mb-1">
          Card Holder Name
        </label>
        <input
          type="text"
          placeholder="Name on card"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#325747] mb-1">
          Card Details
        </label>
        <div className="border border-[#BACEC1] rounded-lg p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#325747',
                  '::placeholder': {
                    color: '#BACEC1',
                  },
                },
              },
              hidePostalCode: true
            }}
          />
        </div>
      </div>

      <div className="pt-2">
        <motion.button
          type="submit"
          disabled={!stripe || loading}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-lg font-bold ${
            !stripe || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#325747] hover:bg-[#1e3a2b] text-white'
          }`}
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Processing Payment...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default OrderVisa;
