import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  faBoxOpen, faPlus, faSearch, 
  faFilter, faEdit, faTrash, 
  faChevronLeft, faChevronRight,
  faExclamationTriangle,
  faTimes,faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ShopLayout from './ShopLayout';
import ProductForm from './ProductForm';
import { motion, AnimatePresence } from 'framer-motion';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    petType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
   };
  }, [searchTerm]);


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/product?page=${currentPage}&search=${searchTerm}&category=${filters.category}&petType=${filters.petType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearchTerm, filters, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    setCurrentPage(1); // Reset to first page when filters change
  };

 const handleDelete = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/product/${productToDelete}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    toast.success('Product deleted successfully');
    setProductToDelete(null);
    fetchProducts(); // Refresh the product list
  } catch (error) {
    console.error('Delete error:', error);
    toast.error(error.response?.data?.message || 'Failed to delete product');
  }
};

const handleEditProduct = (product) => {
  setEditingProduct(product);
  setIsFormOpen(true);
};

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchProducts(); // Refresh the product list after form submission
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center">
          {row.images && row.images.length > 0 ? (
            <img 
              src={row.images[0].data} 
              alt={row.name}
              className="w-10 h-10 rounded-md object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
              <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{row.category}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => `$${row.price.toFixed(2)}`
    },
      {
    header: 'Stock',
    accessor: 'stock',
    cell: (row) => (
      <div className="flex items-center">
        <span className={row.stock === 0 ? 'text-red-600 font-medium' : 
                         row.stock <= row.threshold ? 'text-orange-600 font-medium' : ''}>
          {row.stock}
        </span>
        {row.stock === 0 ? (
          <FontAwesomeIcon 
            icon={faTimesCircle} 
            className="ml-2 text-red-500" 
            title="Out of stock"
          />
        ) : row.stock <= row.threshold ? (
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className="ml-2 text-orange-500" 
            title="Low stock"
          />
        ) : null}
      </div>
    )
  },
  {
    header: 'Threshold',
    accessor: 'threshold',
    cell: (row) => row.threshold
  },
    {
      header: 'Pet Types',
      accessor: 'petTypes',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.petTypes.map((type, idx) => (
            <span 
              key={idx}
              className="px-2 py-1 text-xs rounded-full bg-[#BACEC1] text-[#325747]"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditProduct(row)}
            className="p-2 text-[#325747] hover:bg-[#BACEC1] rounded-md transition"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={() => setProductToDelete(row._id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )
    }
  ];

  // DataTable component implementation
  const DataTable = ({ columns, data, onRowClick }) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-gray-50"
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {column.cell ? column.cell(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Pagination component implementation
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
      const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
      
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        
        <div className="flex space-x-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 rounded-md border border-gray-300"
              >
                1
              </button>
              {startPage > 2 && <span className="px-3 py-1">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-[#325747] text-white' : 'border border-gray-300'}`}
            >
              {page}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-3 py-1">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 rounded-md border border-gray-300"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  // FilterModal component implementation
  const FilterModal = ({ isOpen, onClose, filters, onApply }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
      onApply(localFilters);
    };

    const handleReset = () => {
      setLocalFilters({
        category: '',
        petType: ''
      });
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filter Products</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={localFilters.category}
                onChange={(e) => setLocalFilters({...localFilters, category: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                <option value="food">Food</option>
                <option value="toy">Toy</option>
                <option value="accessory">Accessory</option>
                <option value="health">Health</option>
                <option value="grooming">Grooming</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Type</label>
              <select
                value={localFilters.petType}
                onChange={(e) => setLocalFilters({...localFilters, petType: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Pet Types</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="cow">Cow</option>
                <option value="sheep">Sheep</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-[#325747] text-white rounded-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ConfirmModal component implementation
  const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="mb-4">
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
          
          <p className="mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // LoadingSpinner component implementation
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
    </div>
  );

  // EmptyState component implementation
  const EmptyState = ({ title, description, buttonText, onButtonClick }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400 text-2xl" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      <button
        onClick={onButtonClick}
        className="px-4 py-2 bg-[#325747] text-white rounded-md hover:bg-[#28463a]"
      >
        {buttonText}
      </button>
    </div>
  );

  return (
    <ShopLayout activeTab="products">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center ">
          <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-laila text-[#325747] flex items-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mr-3"
              >
                
               </motion.div>
               Products Management
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "20px" }}></div>
          </div>
        </motion.div>
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-3 md:space-y-0 md:space-x-3">
            <div className="relative flex-grow md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[#E59560] focus:border-[#E59560]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
           />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 text-[#325747] border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2 text-[#E59560]" />
              Filters
            </button>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d48753] flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={searchTerm || filters.category || filters.petType 
              ? "Try adjusting your search or filters"
              : "You haven't added any products yet. Click the button below to add your first product."}
            buttonText="Add Product"
            onButtonClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <DataTable 
                columns={columns} 
                data={products}
              />
            </div>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        <FilterModal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onApply={handleFilterChange}
        />

        <ConfirmModal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
        />
    
       <ProductForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)}
          isEdit={!!editingProduct}
          product={editingProduct}
          onSuccess={handleFormSuccess}
       />
      </div>
    </ShopLayout>
  );
};

export default Products;
