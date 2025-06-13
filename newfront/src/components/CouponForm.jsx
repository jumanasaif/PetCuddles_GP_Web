import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faPlus, faTrash, 
  faSpinner, faArrowLeft, faCheckCircle, 
  faExclamationCircle, faCalendarAlt, faTag,faSearch
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './ProductModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CouponForm = ({ isEdit = false, isOpen, onClose, coupon, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

    // Get unique categories and subcategories from products
  const categories = [...new Set(products.map(p => p.category))];
  const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
 // Filter products based on search and category filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

 const [formData, setFormData] = useState({
   discountType: 'amount',
   discountAmount: 0,
   isPetCuddles: false,
   isActive: true,
   conditions: {
     minPurchase: 0,
     validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
     firstOrderOnly: false,
     specificProducts: [],
     categories: [],
     subcategories: []
   }
});

  useEffect(() => {
    if (coupon) {
      setFormData({
        discountAmount: coupon.discountAmount,
        isActive: coupon.isActive,
        conditions: {
          minPurchase: coupon.conditions.minPurchase || 0,
          validUntil: new Date(coupon.conditions.validUntil),
          firstOrderOnly: coupon.conditions.firstOrderOnly || false,
          specificProducts: coupon.conditions.specificProducts || []
        }
      });
      setSelectedProducts(coupon.conditions.specificProducts || []);
    } else {
      setFormData({
        discountAmount: 0,
        isActive: true,
        conditions: {
          minPurchase: 0,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          firstOrderOnly: false,
          specificProducts: []
        }
      });
      setSelectedProducts([]);
    }
  }, [coupon]);

useEffect(() => {
  if (coupon) {
    setFormData({
      discountType: coupon.discountType || 'amount',
      discountAmount: coupon.discountAmount || 0,
      isPetCuddles: coupon.isPetCuddles || false,
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      conditions: {
        minPurchase: coupon.conditions?.minPurchase || 0,
        validUntil: coupon.conditions?.validUntil ? new Date(coupon.conditions.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        firstOrderOnly: coupon.conditions?.firstOrderOnly || false,
        specificProducts: coupon.conditions?.specificProducts || [],
        categories: coupon.conditions?.categories || [],
        subcategories: coupon.conditions?.subcategories || []
      }
    });
    setSelectedProducts(coupon.conditions?.specificProducts || []);
    setSelectedCategories(coupon.conditions?.categories || []);
    setSelectedSubcategories(coupon.conditions?.subcategories || []);
  } else {
    setFormData({
      discountType: 'amount',
      discountAmount: 0,
      isPetCuddles: false,
      isActive: true,
      conditions: {
        minPurchase: 0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        firstOrderOnly: false,
        specificProducts: [],
        categories: [],
        subcategories: []
      }
    });
    setSelectedProducts([]);
    setSelectedCategories([]);
    setSelectedSubcategories([]);
  }
}, [coupon]);


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/product', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.discountAmount || formData.discountAmount <= 0) {
      newErrors.discountAmount = 'Discount amount must be greater than 0';
    }
    
    if (formData.conditions.validUntil < new Date()) {
      newErrors.validUntil = 'Expiry date must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('conditions.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        validUntil: date
      }
    }));
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  setSubmitting(true);
  try {
    const token = localStorage.getItem('token');
    const endpoint = isEdit 
      ? `http://localhost:5000/api/coupon/${coupon._id}`
      : 'http://localhost:5000/api/coupon';
    
    const method = isEdit ? 'put' : 'post';
    
    const data = {
      ...formData,
      conditions: {
        ...formData.conditions,
        specificProducts: selectedProducts,
        categories: selectedCategories,
        subcategories: selectedSubcategories
      }
    };
    
    await axios[method](endpoint, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    toast.success(`Coupon ${isEdit ? 'updated' : 'created'} successfully`);
    onSuccess();
    onClose();
  } catch (error) {
    console.error('Submission error:', error);
    toast.error(error.response?.data?.message || 'Failed to save coupon');
  } finally {
    setSubmitting(false);
  }
};

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/coupon/${coupon._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Coupon deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEdit ? 'Edit Coupon' : 'Create New Coupon'}
      width="max-w-2xl"
    >
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center text-[#325747] hover:text-[#E59560] mb-6 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Coupons
        </button>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">
                Discount Type *
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="discountType"
                    value="amount"
                    checked={formData.discountType === 'amount'}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1]"
                  />
                  <span className="ml-2 text-sm text-[#325747]">Fixed Amount</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="discountType"
                    value="percentage"
                    checked={formData.discountType === 'percentage'}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1]"
                  />
                  <span className="ml-2 text-sm text-[#325747]">Percentage</span>
                </label>
              </div>
            </div>

            {/* Discount Amount */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">
                {formData.discountType === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
              </label>
              <div className="relative">
                {formData.discountType === 'percentage' ? (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                ) : (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                )}
                <input
                  type="number"
                  name="discountAmount"
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  step={formData.discountType === 'percentage' ? 1 : 0.01}
                  className={`w-full ${formData.discountType === 'percentage' ? 'pr-8' : 'pl-8'} py-2 border rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition ${
                    errors.discountAmount ? 'border-red-500' : 'border-[#BACEC1]'
                  }`}
                  value={formData.discountAmount}
                  onChange={handleChange}
                />
                {/* ... error message ... */}
              </div>
            </div>

            {/* Pet Cuddles Coupon */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPetCuddles"
                name="isPetCuddles"
                checked={formData.isPetCuddles}
                onChange={handleChange}
                className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded"
              />
              <label htmlFor="isPetCuddles" className="ml-2 block text-sm text-[#325747]">
                Pet Cuddles Platform Coupon (15% off for registered users)
              </label>
            </div>

            {/* Only show these fields if not a Pet Cuddles coupon */}
            {!formData.isPetCuddles && (
              <>
                {/* Minimum Purchase */}
                <div>
                  <label className="block text-sm font-medium text-[#325747] mb-1">
                    Minimum Purchase Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      name="conditions.minPurchase"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition"
                      value={formData.conditions.minPurchase}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-[#325747] mb-1">
                    Expiry Date *
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={formData.conditions.validUntil}
                      onChange={handleDateChange}
                      minDate={new Date()}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition ${
                        errors.validUntil ? 'border-red-500' : 'border-[#BACEC1]'
                      }`}
                      dateFormat="MMMM d, yyyy"
                    />
                    {/* ... calendar icon and error message ... */}
                  </div>
                </div>
              </>
            )}

            {/* First Order Only */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="firstOrderOnly"
                name="conditions.firstOrderOnly"
                checked={formData.conditions.firstOrderOnly}
                onChange={handleChange}
                disabled={formData.isPetCuddles}
                className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded disabled:opacity-50"
              />
              <label htmlFor="firstOrderOnly" className="ml-2 block text-sm text-[#325747]">
                First order only
              </label>
            </div>

            {/* Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-[#325747]">
                Active
              </label>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-2">
                Apply to Specific Products/Categories
              </label>
              
              {/* Search and Filter */}
              <div className="mb-3 flex space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2 w-full border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-[#BACEC1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560]"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category/Subcategory Selection */}
              <div className="mb-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-[#325747] mb-1">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(category) 
                              ? prev.filter(c => c !== category) 
                              : [...prev, category]
                          );
                        }}
                        className={`px-2 py-1 text-xs rounded-full ${
                          selectedCategories.includes(category)
                            ? 'bg-[#E59560] text-white'
                            : 'bg-[#BACEC1] text-[#325747]'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {subcategories.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-[#325747] mb-1">Subcategories</label>
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map(subcategory => (
                        <button
                          key={subcategory}
                          type="button"
                          onClick={() => {
                            setSelectedSubcategories(prev => 
                              prev.includes(subcategory) 
                                ? prev.filter(s => s !== subcategory) 
                                : [...prev, subcategory]
                            );
                          }}
                          className={`px-2 py-1 text-xs rounded-full ${
                            selectedSubcategories.includes(subcategory)
                              ? 'bg-[#E59560] text-white'
                              : 'bg-[#BACEC1] text-[#325747]'
                          }`}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product List */}
              <div className="h-64 overflow-y-auto border border-[#BACEC1] rounded-lg p-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No products found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map(product => (
                      <div 
                        key={product._id}
                        className={`p-2 rounded-md cursor-pointer transition ${
                          selectedProducts.includes(product._id) 
                            ? 'bg-[#E59560] bg-opacity-20 border border-[#E59560]' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleProductSelection(product._id)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => toggleProductSelection(product._id)}
                            className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded"
                          />
                          <div className="ml-3 flex items-center">
                            {product.images && product.images.length > 0 && (
                              <img 
                                src={product.images[0].data} 
                                alt={product.name}
                                className="w-10 h-10 rounded-md object-cover mr-3"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-[#325747]">{product.name}</p>
                              <p className="text-xs text-gray-500">
                                ${product.price.toFixed(2)} • {product.category}
                                {product.subcategory && ` • ${product.subcategory}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-[#BACEC1]">
          {isEdit && (
            <motion.button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={deleting}
            >
              {deleting ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : (
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
              )}
              Delete Coupon
            </motion.button>
          )}
          <motion.button
            type="submit"
            className="px-6 py-2 bg-[#325747] text-white rounded-lg hover:bg-[#28463a] focus:outline-none focus:ring-2 focus:ring-[#325747] focus:ring-offset-2 transition"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
          >
            {submitting ? (
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
            ) : (
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            )}
            {isEdit ? 'Update Coupon' : 'Create Coupon'}
          </motion.button>
        </div>
      </motion.form>
    </Modal>
  );
};

export default CouponForm;
