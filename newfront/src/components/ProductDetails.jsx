import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faShoppingCart, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const ProductModal = ({ product, onClose, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    // Implement review submission logic
    alert('Review submitted!');
    setReview('');
    setRating(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Product Images */}
          <div className="relative mb-6">
            {product.images && product.images.length > 0 ? (
              <>
                <img 
                  src={product.images[currentImageIndex].data} 
                  alt={product.name}
                  className="w-full h-64 md:h-96 object-contain rounded-lg"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                    <div className="flex justify-center mt-2 space-x-1">
                      {product.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full ${currentImageIndex === index ? 'bg-blue-500' : 'bg-gray-300'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
                <span>No images available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">Description</h3>
                <p className="text-gray-700">
                  {product.description || 'No description available.'}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="capitalize">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pet Types</p>
                    <div className="flex flex-wrap gap-1">
                      {product.petTypes.map((type, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {product.brand && (
                    <div>
                      <p className="text-sm text-gray-500">Brand</p>
                      <p>{product.brand}</p>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p>{product.weight}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div>
                <h3 className="text-lg font-bold mb-2">Reviews</h3>
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {product.reviews.map((review, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex items-center mb-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">
                            by {review.userName || 'Anonymous'}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg sticky top-4">
                <h3 className="text-xl font-bold mb-2">${product.price.toFixed(2)}</h3>
                <p className="text-green-600 mb-4">In Stock: {product.stock}</p>
                
                <button
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 flex items-center justify-center mb-4"
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                  Add to Cart
                </button>

                {/* Add Review Form */}
                <div className="mt-6">
                  <h4 className="font-bold mb-2">Add Your Review</h4>
                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-2">
                      <label className="block text-sm text-gray-700 mb-1">Rating</label>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-2xl focus:outline-none"
                          >
                            {star <= rating ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm text-gray-700 mb-1">Review</label>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="3"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
