import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ShopLayout from './ShopLayout';

import { 
  faTimes, faPlus, faTrash, 
  faImage, faSpinner, faArrowLeft,
  faCheckCircle, faExclamationCircle,faSearch
} from '@fortawesome/free-solid-svg-icons';
import Modal from './ProductModal';

const ProductForm = ({ isEdit = false, isOpen, onClose, product }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Initialize form data with product prop or empty values
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    subcategory: '',
    stock: 0,
    threshold: 5, 
    petTypes: [],
    brand: '',
    weight: '',
    isPrescriptionRequired: false,
    images: []
  });

  // Update form data when product prop changes
useEffect(() => {
  if (product) {
    // Transform images to consistent format
    const formattedImages = product.images.map(img => {
      if (typeof img === 'string') {
        return {
          data: img.startsWith('http') ? img : `http://localhost:5000${img}`,
          contentType: 'image/jpeg'
        };
      }
      return img; // if it's already an object
    });

    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      category: product.category || '',
      subcategory: product.subcategory || '',
      stock: product.stock || 0,
      threshold: product.threshold || 5,
      petTypes: product.petTypes || [],
      brand: product.brand || '',
      weight: product.weight || '',
      isPrescriptionRequired: product.isPrescriptionRequired || false,
      images: formattedImages
    });
  } else {
    // Reset form when no product (for create mode)
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      subcategory: '',
      stock: 0,
      threshold: 5,
      petTypes: [],
      brand: '',
      weight: '',
      isPrescriptionRequired: false,
      images: []
    });
  }
}, [product]);

  // Options
  const petTypes = ['dog', 'cat', 'bird', 'rabbit', 'cow', 'sheep'];
  const categories = [
    { value: 'food', label: 'Food' },
    { value: 'toy', label: 'Toy' },
    { value: 'accessory', label: 'Accessory' },
    { value: 'health', label: 'Health' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'other', label: 'Other' }
  ];



  // Form validation
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.price || formData.price < 0) newErrors.price = 'Price must be positive';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.stock || formData.stock < 0) newErrors.stock = 'Stock must be positive';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle image upload

const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length + formData.images.length > 5) {
    toast.error('You can upload a maximum of 5 images');
    return;
  }

  setUploading(true);
  
  try {
    const processedImages = await Promise.all(
      files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64String = reader.result;
            // Extract content type from the Base64 string
            const contentType = base64String.match(/^data:(.*);base64/)[1];
            resolve({
              data: base64String,
              contentType
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...processedImages]
    }));
  } catch (error) {
    console.error('Image conversion error:', error);
    toast.error('Failed to process images');
  } finally {
    setUploading(false);
  }
};

  // Handle image removal
 const handleRemoveImage = (index) => {
  const imageToRemove = formData.images[index];
  
  // Check if image is a string URL or an object with data property
  if (typeof imageToRemove === 'string' || 
      (typeof imageToRemove === 'object' && imageToRemove.data)) {
    
    const imageUrl = typeof imageToRemove === 'string' 
      ? imageToRemove 
      : imageToRemove.data;
    
    if (imageUrl.startsWith('http')) {
      setImagesToDelete(prev => [...prev, imageUrl]);
    }
  }
  
  setFormData(prev => ({
    ...prev,
    images: prev.images.filter((_, i) => i !== index)
  }));
};

  // Toggle pet type selection
  const togglePetType = (type) => {
    setFormData(prev => ({
      ...prev,
      petTypes: prev.petTypes.includes(type)
        ? prev.petTypes.filter(t => t !== type)
        : [...prev.petTypes, type]
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  setSubmitting(true);
  try {
    const token = localStorage.getItem('token');
    
    // Prepare the data to send
    const productData = {
      ...formData,
      images: formData.images,
      imagesToDelete,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      threshold: parseInt(formData.threshold),
    };

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Debug: Check if we have an ID when in edit mode
    console.log('Edit mode:', isEdit, 'Product ID:', product?._id);

    const endpoint = isEdit 
      ? `http://localhost:5000/api/product/${product?._id}` // Use product._id instead of id from params
      : 'http://localhost:5000/api/product';

    const method = isEdit ? 'put' : 'post';
    
    await axios[method](endpoint, productData, config);
    toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
    onClose();
  } catch (error) {
    console.error('Submission error:', error);
    toast.error(error.response?.data?.message || 'Failed to save product');
  } finally {
    setSubmitting(false);
  }
};

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully');
      onClose(); // Close the modal on success
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
      </div>
    );
  }

 return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add New Product'}
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
          Back to Products
        </button>

      
        <h2 className="text-2xl font-bold text-[#325747] mb-6">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#325747] mb-1">
                Product Name *
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition ${
                    errors.name ? 'border-red-500' : 'border-[#BACEC1]'
                  }`}
                  value={formData.name}
                  onChange={handleChange}
                />
                <AnimatePresence>
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-1 text-sm text-red-600 flex items-center"
                    >
                      <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#325747] mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-[#325747] mb-1">
                  Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition ${
                      errors.price ? 'border-red-500' : 'border-[#BACEC1]'
                    }`}
                    value={formData.price}
                    onChange={handleChange}
                  />
                  <AnimatePresence>
                    {errors.price && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1 text-sm text-red-600 flex items-center"
                      >
                        <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                        {errors.price}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
    <label htmlFor="threshold" className="block text-sm font-medium text-[#325747] mb-1">
      Low Stock Threshold *
    </label>
    <div className="relative">
      <input
        type="number"
        id="threshold"
        name="threshold"
        min="0"
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition ${
          errors.threshold ? 'border-red-500' : 'border-[#BACEC1]'
        }`}
        value={formData.threshold}
        onChange={handleChange}
      />
      <AnimatePresence>
        {errors.threshold && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 text-sm text-red-600 flex items-center"
          >
            <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
            {errors.threshold}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-[#325747] mb-1">
                  Stock *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    min="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition ${
                      errors.stock ? 'border-red-500' : 'border-[#BACEC1]'
                    }`}
                    value={formData.stock}
                    onChange={handleChange}
                  />
                  <AnimatePresence>
                    {errors.stock && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1 text-sm text-red-600 flex items-center"
                      >
                        <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                        {errors.stock}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-2">
                Images (Max 5)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <AnimatePresence>
    
{formData.images.map((image, index) => {
  // Handle both string URLs and File objects
  let imageUrl;
  if (typeof image === 'string') {
    imageUrl = image.startsWith('http') ? image : `http://localhost:5000${image}`;
  } else if (image && image.data) {
    imageUrl = image.data; // For Base64 images
  }

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Product ${index}`}
          className="w-full h-24 object-cover rounded-lg shadow-sm"
          onError={(e) => {
            console.error('Failed to load image:', imageUrl);
            e.target.src = '/placeholder-image.png';
          }}
        />
      )}
      <button
        type="button"
        onClick={() => handleRemoveImage(index)}
        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
      >
        <FontAwesomeIcon icon={faTimes} size="xs" />
      </button>
    </motion.div>
  );
})}
                </AnimatePresence>
                
                {formData.images.length < 5 && (
                  <motion.label
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-[#BACEC1] rounded-lg cursor-pointer hover:border-[#E59560] transition"
                  >
                    {uploading ? (
                      <FontAwesomeIcon icon={faSpinner} spin className="text-[#325747]" />
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPlus} className="text-[#325747] mb-1" />
                        <span className="text-xs text-[#325747]">Add Image</span>
                      </>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </motion.label>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[#325747] mb-1">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition ${
                    errors.category ? 'border-red-500' : 'border-[#BACEC1]'
                  }`}
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <AnimatePresence>
                  {errors.category && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-1 text-sm text-red-600 flex items-center"
                    >
                      <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                      {errors.category}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-[#325747] mb-1">
                Subcategory
              </label>
              <input
                id="subcategory"
                name="subcategory"
                type="text"
                className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition"
                value={formData.subcategory}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#325747] mb-2">
                Pet Types
              </label>
              <div className="flex flex-wrap gap-2">
                {petTypes.map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    onClick={() => togglePetType(type)}
                    className={`px-3 py-1 text-sm rounded-full transition ${
                      formData.petTypes.includes(type)
                        ? 'bg-[#E59560] text-white shadow-md'
                        : 'bg-[#BACEC1] text-[#325747] hover:bg-[#E59560] hover:text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-[#325747] mb-1">
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition"
              value={formData.brand}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-[#325747] mb-1">
              Weight/Size
            </label>
            <input
              id="weight"
              name="weight"
              type="text"
              className="w-full px-4 py-2 border border-[#BACEC1] rounded-lg focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] transition"
              value={formData.weight}
              onChange={handleChange}
            />
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
              Delete Product
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
            {isEdit ? 'Update Product' : 'Save Product'}
          </motion.button>
        </div>
      </motion.form>
     </Modal>
  );
};

export default ProductForm;