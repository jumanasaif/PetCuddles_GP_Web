import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSearch, 
  faShoppingCart, 
  faStar, 
  faClock,
  faPhone,
  faCommentDots,
  faMapMarkerAlt,
  faTrash,
  faTimes,
  faTag,
  faChevronLeft,
  faChevronRight,
  faCreditCard,
  faMoneyBillWave,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import ReactStars from 'react-stars';
import ProductModal from './ProductDetails';
import OrderVisa from './OrderVisa';
import { useChat } from './ChatProvider';

const ShopProductsPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { startChat } = useChat();
  // Main state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [currentCouponIndex, setCurrentCouponIndex] = useState(0);
  
  // Cart and checkout state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'address', 'payment'
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    village: ''
  });
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [orderProcessing, setOrderProcessing] = useState(false);


    const handleStartChat = async () => {
    const chatId = await startChat(shopId, 'Shop');
    if (chatId) {
      navigate('/chat');
    }
  };

  
  // Fetch shop data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, shopRes, couponsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/shop/${shopId}/products`),
          axios.get(`http://localhost:5000/api/shop/public-profile/${shopId}`),
          axios.get(`http://localhost:5000/api/coupon/shop/${shopId}`)
        ]);
        
        setProducts(productsRes.data);
        setShopInfo(shopRes.data);
        
        // Filter coupons to show only general ones (not product-specific)
        const filteredCoupons = couponsRes.data.filter(coupon => 
          !coupon.conditions?.specificProducts?.length
        );
        
        // Add Pet Cuddles special coupon if user is logged in (pet owner)
        const isPetOwner = localStorage.getItem('token') && localStorage.getItem('role') === 'pet_owner';
        if (isPetOwner) {
          filteredCoupons.unshift({
            _id: 'pet-cuddles-special',
            code: 'PETLOVE15',
            discountType: 'percentage',
            discountAmount: 15,
            isPetCuddles: true,
            conditions: {
              minPurchase: 0
            },
            description: 'Exclusive discount for Pet Cuddles members!'
          });
        }
        
        setCoupons(filteredCoupons);
        
        // Load cart from localStorage if exists
        const savedCart = localStorage.getItem(`cart_${shopId}`);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        toast.error('Failed to load shop products');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`cart_${shopId}`, JSON.stringify(cart));
  }, [cart, shopId]);

    const nextCoupon = () => {
    setCurrentCouponIndex((prevIndex) => 
      prevIndex === coupons.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevCoupon = () => {
    setCurrentCouponIndex((prevIndex) => 
      prevIndex === 0 ? coupons.length - 1 : prevIndex - 1
    );
  };

  
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };



  const handleSubmitReview = () => {
    // Implement review submission
    toast.success('Review submitted successfully');
    setRating(0);
    setReview('');
  };

  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Product cart handlers
  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    toast.success(`${product.name} added to cart`);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Calculate order totals
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const calculateDiscount = () => {
    return appliedCoupons.reduce((total, coupon) => {
      if (coupon.discountType === 'percentage') {
        return total + (calculateSubtotal() * (coupon.discountAmount / 100));
      } else {
        return total + coupon.discountAmount;
      }
    }, 0);
  };

  

  const calculateDeliveryCost = () => {
    if (!shopInfo?.deliverySettings || !shopInfo.DeliveryProvide) return 0;
    
    const subtotal = calculateSubtotal();
    const freeThreshold = shopInfo.deliverySettings.freeDeliveryThreshold || 0;
    
    if (freeThreshold > 0 && subtotal >= freeThreshold) {
      return 0;
    }
    
    return shopInfo.deliverySettings.cost || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const deliveryCost = calculateDeliveryCost();
    return (subtotal - discount + deliveryCost).toFixed(2);
  };

  // Coupon handling
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    try {
      const token = localStorage.getItem('token');

      const userId = JSON.parse(localStorage.getItem('user')).id?._id;
      
      const response = await axios.post('http://localhost:5000/api/coupon/validate-order-coupons', {
        shopId,
        userId,
        couponCodes: [couponInput],
        orderItems: cart.map(item => ({
          productId: item.product._id,
          priceAtPurchase: item.product.price,
          quantity: item.quantity
        }))
      });

      if (response.data.success && response.data.validCoupons.length > 0) {
        const newCoupon = response.data.validCoupons[0];
        
        // Check if coupon is already applied
        if (appliedCoupons.some(c => c._id === newCoupon._id || c.code === newCoupon.code)) {
          toast.error('This coupon is already applied');
          return;
        }
        
        setAppliedCoupons([...appliedCoupons, newCoupon]);
        setCouponInput('');
        toast.success(`Coupon "${newCoupon.code}" applied successfully!`);
      } else if (response.data.errors.length > 0) {
        toast.error(response.data.errors[0].message);
      } else {
        toast.error('Invalid coupon code');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error applying coupon');
      console.error('Coupon error:', error);
    }
  };

  const handleRemoveCoupon = (couponId) => {
    setAppliedCoupons(appliedCoupons.filter(c => c._id !== couponId));
  };

  // Checkout process
  const handleProceedToCheckout = async () => {
    if (shopInfo?.DeliveryProvide) {
      setCheckoutStep('address');
    } else {
      await preparePayment();
      setCheckoutStep('payment');
    }
  };

  const preparePayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setOrderProcessing(true);
      
      const response = await axios.post(
        'http://localhost:5000/api/shop-payment/create-payment-intent',
        {
          shopId,
          items: cart.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            productName: item.product.name
          })),
          deliveryAddress: shopInfo.DeliveryProvide ? deliveryAddress : null,
          appliedCoupons: appliedCoupons.map(c => c._id)
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setStripeClientSecret(response.data.clientSecret);
      }
    } catch (error) {
      toast.error('Failed to prepare payment');
      console.error('Payment error:', error);
    } finally {
      setOrderProcessing(false);
    }
  };

const handlePlaceOrder = async (stripePaymentId = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setOrderProcessing(true);
    
    // Calculate all required values
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const deliveryCost = calculateDeliveryCost();
    const totalAmount = parseFloat(calculateTotal());

    // Prepare order items with required data
    const orderItems = cart.map(item => ({
      productId: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.price,
      productName: item.product.name
    }));

    const orderData = {
      shopId,
      items: orderItems,
      subtotal,
      discount,
      deliveryCost,
      totalAmount,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      appliedCoupons: appliedCoupons.map(c => c._id),
      estimatedDeliveryDays: shopInfo?.deliverySettings?.estimatedDays || 3,
      deliveryAddress: shopInfo.DeliveryProvide ? deliveryAddress : null,
      stripePaymentId
    };

    console.log('Order data being sent:', orderData); // Debug log

    const response = await axios.post(
      'http://localhost:5000/api/orders',
      orderData,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.data.success) {
      toast.success('Order placed successfully!');
      setCart([]);
      setIsCartOpen(false);
      setCheckoutStep('cart');
      setAppliedCoupons([]);
      setPaymentMethod(null);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to place order');
    console.error('Order error:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
  } finally {
    setOrderProcessing(false);
  }
};

 const handleSuccessfulPayment = (order) => {
   toast.success('Order placed successfully!');
   setCart([]);
   setIsCartOpen(false);
   setCheckoutStep('cart');
   setAppliedCoupons([]);
   setPaymentMethod(null);
 };


  // Format working hours for display
  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return null;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.map(day => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      hours: workingHours[day].closed ? 'Closed' : `${workingHours[day].open} - ${workingHours[day].close}`
    }));
  };

  // Cart sidebar component
  const CartSidebar = () => (
    <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-lg transform ${
      isCartOpen ? 'translate-x-0' : 'translate-x-full'
    } transition-transform duration-300 ease-in-out z-50 `}>
      <div className="p-4 h-full flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold text-[#325747]">
            {checkoutStep === 'cart' ? 'Your Cart' : 
             checkoutStep === 'address' ? 'Delivery Address' : 'Payment Method'}
          </h2>
          <button 
            onClick={() => {
              setIsCartOpen(false);
              setCheckoutStep('cart');
            }} 
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        
        {checkoutStep === 'cart' && (
          <>
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4">
                  {cart.map(item => (
                    <div key={item.product._id} className="flex items-center border-b py-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden mr-4">
                        {item.product.images && item.product.images.length > 0 && (
                          <img 
                            src={item.product.images[0].data} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-[#325747]">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border rounded-l-md"
                        >
                          -
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center border-t border-b">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border rounded-r-md"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => handleRemoveFromCart(item.product._id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Coupon Section */}
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#325747] mb-2">Apply Coupon</label>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-[#BACEC1] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-[#E59560] text-white rounded-r-lg hover:bg-[#d48753]"
                        disabled={!couponInput.trim()}
                      >
                        Apply
                      </button>
                    </div>
                    {appliedCoupons.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-[#325747]">Applied coupons:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {appliedCoupons.map(coupon => (
                            <span key={coupon._id} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                              {coupon.code}
                              <button 
                                onClick={() => handleRemoveCoupon(coupon._id)}
                                className="ml-1 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#325747]">Subtotal:</span>
                      <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {calculateDiscount() > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#325747]">Discount:</span>
                        <span className="font-medium text-green-600">-${calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    {shopInfo?.DeliveryProvide && (
                      <div className="flex justify-between">
                        <span className="text-[#325747]">Delivery:</span>
                        <span className="font-medium">${calculateDeliveryCost().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-[#325747] font-semibold">Total:</span>
                      <span className="font-bold">${calculateTotal()}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={cart.length === 0}
                    className={`w-full py-2 rounded-lg ${
                      cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#E59560] hover:bg-[#d48753] text-white'
                    }`}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {checkoutStep === 'address' && (
          <div className="flex-1 flex flex-col">
            <div className="border-b pb-4 mb-4">
              <button 
                onClick={() => setCheckoutStep('cart')}
                className="text-[#325747] hover:text-[#E59560] flex items-center"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                Back to cart
              </button>
              <h3 className="text-lg font-bold text-[#325747] mt-2">Delivery Address</h3>
            </div>
            
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#325747] mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                  placeholder="Street name and number"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#325747] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                  placeholder="City"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#325747] mb-2">
                  Village (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryAddress.village}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, village: e.target.value})}
                  className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
                  placeholder="Village"
                />
              </div>
              
              <div className="mb-4 bg-[#F6F4E8] p-4 rounded-lg">
                <h4 className="font-medium text-[#325747] mb-2">Delivery Information</h4>
                <p className="text-sm text-[#325747]">
                  Estimated delivery time: {shopInfo?.deliverySettings?.estimatedDays || 3} business days
                </p>
                <p className="text-sm text-[#325747]">
                  Delivery cost: $10
                </p>
              </div>
            </div>
            
            <button
              onClick={async () => {
                await preparePayment();
                setCheckoutStep('payment');
              }}
              disabled={!deliveryAddress.city || orderProcessing}
              className={`w-full py-2 rounded-lg ${
                   !deliveryAddress.city || orderProcessing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#E59560] hover:bg-[#d48753] text-white'
              }`}
            >
              {orderProcessing ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        )}

        {checkoutStep === 'payment' && (
          <div className="flex-1 flex flex-col">
            <div className="border-b pb-4 mb-4">
              <button 
                onClick={() => shopInfo?.DeliveryProvide ? setCheckoutStep('address') : setCheckoutStep('cart')}
                className="text-[#325747] hover:text-[#E59560] flex items-center"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                Back
              </button>
              <h3 className="text-lg font-bold text-[#325747] mt-2">Payment Method</h3>
            </div>
            
            <div className="flex-1">
              <div className="space-y-4 mb-6">
                {/* Credit Card Option */}
                <div 
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    paymentMethod === 'credit_card' ? 'border-[#E59560] bg-[#FFF8E7]' : 'border-[#BACEC1]'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={faCreditCard} 
                      className={`mr-3 ${
                        paymentMethod === 'credit_card' ? 'text-[#E59560]' : 'text-[#325747]'
                      }`} 
                    />
                    <div>
                      <h4 className="font-medium text-[#325747]">Credit/Debit Card</h4>
                      <p className="text-sm text-gray-500">Pay securely with Visa, Mastercard, etc.</p>
                    </div>
                  </div>
                  
                 {paymentMethod === 'credit_card' && stripeClientSecret && (
  <div className="mt-4">
   {paymentMethod === 'credit_card' && stripeClientSecret && (
  <div className="mt-4">
    <OrderVisa 
      amount={parseFloat(calculateTotal())}
      shopId={shopId}
      items={cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: item.product.price,
        productName: item.product.name
      }))}
      deliveryAddress={deliveryAddress}
      appliedCoupons={appliedCoupons.map(c => c._id)}
      onPaymentSuccess={handlePlaceOrder}
    />
  </div>
)}
  </div>
)}
                </div>
                
                {/* Cash on Delivery Option */}
                <div 
                  onClick={() => setPaymentMethod('cash_on_delivery')}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    paymentMethod === 'cash_on_delivery' ? 'border-[#E59560] bg-[#FFF8E7]' : 'border-[#BACEC1]'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={faMoneyBillWave} 
                      className={`mr-3 ${
                        paymentMethod === 'cash_on_delivery' ? 'text-[#E59560]' : 'text-[#325747]'
                      }`} 
                    />
                    <div>
                      <h4 className="font-medium text-[#325747]">Cash on Delivery</h4>
                      <p className="text-sm text-gray-500">Pay when you receive your order</p>
                    </div>
                  </div>
                  
                  {paymentMethod === 'cash_on_delivery' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handlePlaceOrder()}
                        disabled={orderProcessing}
                        className={`w-full py-2 rounded-lg ${
                          orderProcessing ? 'bg-gray-300' : 'bg-[#325747] hover:bg-[#1e3a2b] text-white'
                        }`}
                      >
                        {orderProcessing ? 'Placing Order...' : 'Place Order'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-[#F6F4E8] p-4 rounded-lg">
                <h4 className="font-medium text-[#325747] mb-2">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#325747]">Subtotal:</span>
                    <span className="text-sm">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {calculateDiscount() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[#325747]">Discount:</span>
                      <span className="text-sm text-green-600">-${calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  {shopInfo?.DeliveryProvide && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[#325747]">Delivery:</span>
                      <span className="text-sm">${calculateDeliveryCost().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-[#325747]">Total:</span>
                    <span className="font-bold">${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen pt-20 p-4 md:p-8 bg-[#F6F4E8]" style={{ fontFamily: "'Laila', sans-serif", marginTop:"60px" }}>
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-[#325747] mb-6 hover:text-[#E59560] transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Back to shops
      </button>
            {/* Cart Sidebar */}
       <CartSidebar />

      {/* Cart Floating Button */}
       {/* Cart Floating Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="w-16 h-16 bg-[#E59560] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#d48753] transition-colors relative"
        >
          <FontAwesomeIcon icon={faShoppingCart} size="lg" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Shop Info Section */}
<div className="flex flex-col gap-6 mb-8">
  {/* Shop Info Section - Full width */}
  {shopInfo && (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-5"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Shop Image and Basic Info */}
        <div className="flex flex-col md:flex-row items-start gap-6 flex-1">
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={shopInfo.profileImage || '/default-shop.jpg'}
            alt={shopInfo.shopName}
            className="w-32 h-32 rounded-full object-cover border-4 border-[#BACEC1]"
          />
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#325747] mb-2">{shopInfo.shopName}</h1>
            
            <div className="flex items-center gap-2 text-[#E59560] mb-4">
              <ReactStars
                count={5}
                value={4.5} // Replace with actual rating from your data
                size={24}
                color2={'#E59560'}
                edit={false}
              />
              <span className="font-medium">4.5 (42 reviews)</span>
            </div>
            
            <div className="space-y-2 text-[#325747]">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>{shopInfo.village ? `${shopInfo.village}, ` : ''}{shopInfo.city}</span>
              </div>
              {shopInfo.phone && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{shopInfo.phone}</span>
                </div>
              )}
            </div>
            
            {/* Chat Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartChat}
              className="mt-4 px-6 py-2 bg-[#E59560] text-white rounded-lg flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCommentDots} />
              Chat with Shop
            </motion.button>
          </div>
        </div>
        
        {/* Working Hours */}
        {shopInfo.workingHours && (
          <div className="md:w-1/3 bg-[#F6F4E8] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-[#325747] mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} />
              Working Hours
            </h3>
            <div className="space-y-2">
              {formatWorkingHours(shopInfo.workingHours)?.map((day, index) => (
                <div key={index} className="flex justify-between">
                  <span className="font-medium capitalize">{day.day}:</span>
                  <span>{day.hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Review Section */}
      <div className="mt-6 pt-6 border-t border-[#BACEC1]">
        <h3 className="text-xl font-semibold text-[#325747] mb-4">Leave a Review</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <ReactStars
              count={5}
              value={rating}
              size={24}
              color2={'#E59560'}
              onChange={(newRating) => setRating(newRating)}
            />
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this shop..."
              className="w-full mt-3 p-3 border border-[#BACEC1] rounded-lg focus:border-[#E59560]"
              rows="3"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSubmitReview}
              className="px-6 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#1e3a2b] transition-colors"
              disabled={!rating}
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )}
  
  {/* Coupons Section - Full width below shop info */}
  {coupons.length > 0 && (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-5"
    >
      <h2 className="text-2xl font-bold text-[#325747] mb-4 flex items-center">
        <FontAwesomeIcon icon={faTag} className="mr-2 text-[#E59560]" />
        Special Offers
      </h2>
      
      <div className="relative">
        {/* Coupon Carousel */}
        {coupons.map((coupon, index) => (
          <motion.div
            key={coupon._id}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: index === currentCouponIndex ? 1 : 0,
              scale: index === currentCouponIndex ? 1 : 0.9,
              y: index === currentCouponIndex ? 0 : 10
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut"
            }}
            className={`p-4 ${coupon.isPetCuddles ? 
              'bg-gradient-to-br from-[#E59560] to-[#F6C391]' : 
              'bg-gradient-to-br from-[#BACEC1] to-[#F6F4E8]'} 
              rounded-lg shadow-lg`}
            style={{ 
              display: index === currentCouponIndex ? 'block' : 'none',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Coupon Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-[#325747]">
                      {coupon.isPetCuddles ? 'Pet Cuddles Exclusive' : 'Shop Coupon'}
                    </h3>
                    {coupon.isPetCuddles && (
                      <p className="text-sm text-[#325747]">
                        Special discount for our platform members
                      </p>
                    )}
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm text-[#E59560] px-3 py-1 rounded-full font-bold text-lg">
                    {coupon.discountType === 'percentage' 
                      ? `${coupon.discountAmount}% OFF` 
                      : `$${coupon.discountAmount} OFF`}
                  </div>
                </div>
                
                {/* Coupon Description */}
                {coupon.description && (
                  <p className="text-[#325747] mb-4">{coupon.description}</p>
                )}
                
                {/* Coupon Conditions */}
                <div className="space-y-2 mb-4">
                  {coupon.conditions?.minPurchase > 0 && (
                    <p className="text-sm font-medium text-[#325747]">
                      Minimum purchase: <span className="font-bold">${coupon.conditions.minPurchase}</span>
                    </p>
                  )}
                  
                  {coupon.validUntil && (
                    <p className="text-sm font-medium text-[#325747]">
                      Valid until: <span className="font-bold">
                        {new Date(coupon.validUntil).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Coupon Code */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm text-[#325747] mb-2">Use this code at checkout</p>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/30 rounded-lg transform rotate-1"></div>
                  <div className="relative bg-white border-2 border-dashed border-[#E59560] px-6 py-3 rounded-lg transform -rotate-1">
                    <span className="font-mono font-bold text-2xl text-[#325747] tracking-wider">
                      {coupon.code}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Carousel Controls */}
        {coupons.length > 1 && (
          <div className="flex justify-between mt-4">
            <motion.button 
              onClick={prevCoupon}
              className="px-4 py-2 bg-[#E59560] text-white rounded-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Previous
            </motion.button>
            <motion.button 
              onClick={nextCoupon}
              className="px-4 py-2 bg-[#E59560] text-white rounded-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )}
</div>

      {/* Products Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="pl-10 pr-4 py-2 w-full border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No matching products found" : "No products available"}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? "Try a different search term"
                : "This shop hasn't added any products yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <motion.div
                key={product._id}
                whileHover={{ y: -5 }}
                className="bg-[#F6F4E8] rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
              >
                <div 
                  className="h-48 bg-gray-200 cursor-pointer relative"
                  onClick={() => handleProductClick(product)}
                >
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0].data} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>No Image</span>
                    </div>
                  )}
                  {/* Cart Button - Floating on image */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="absolute bottom-3 right-3 p-2 bg-[#E59560] text-white rounded-full shadow-md hover:bg-[#d48753] transition-colors"
                    title="Add to cart"
                  >
                    <FontAwesomeIcon icon={faShoppingCart} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="font-bold cursor-pointer hover:text-[#E59560] transition-colors"
                      onClick={() => handleProductClick(product)}
                    >
                      {product.name}
                    </h3>
                    <span className="font-bold text-[#325747]">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.petTypes.map((type, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-[#BACEC1] text-[#325747]"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#607169] capitalize">
                      {product.category}
                    </span>
                    <button
                      onClick={() => handleProductClick(product)}
                      className="text-sm text-[#325747] hover:text-[#E59560] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default ShopProductsPage;
