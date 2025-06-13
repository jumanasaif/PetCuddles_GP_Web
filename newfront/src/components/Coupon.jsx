import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  faTags, faPlus, faSearch, 
  faFilter, faEdit, faTrash, 
  faChevronLeft, faChevronRight,
  faTimes, faCheckCircle, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ShopLayout from './ShopLayout';
import CouponForm from './CouponForm';
import { motion, AnimatePresence } from 'framer-motion';

const Coupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/coupon?page=${currentPage}&activeOnly=${activeOnly}&search=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCoupons(response.data.coupons);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load coupons');
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, activeOnly, debouncedSearchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/coupon/${couponToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Coupon deleted successfully');
      setCouponToDelete(null);
      fetchCoupons();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchCoupons();
  };

  const statusBadge = (validUntil) => {
    const now = new Date();
    const expiryDate = new Date(validUntil);
    
    if (expiryDate < now) {
      return {
        text: 'Expired',
        class: 'bg-red-100 text-red-800'
      };
    } else if (expiryDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return {
        text: 'Expiring Soon',
        class: 'bg-yellow-100 text-yellow-800'
      };
    } else {
      return {
        text: 'Active',
        class: 'bg-green-100 text-green-800'
      };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

 const columns = [
  {
    header: 'Code',
    accessor: 'code',
    cell: (row) => (
      <div className="font-mono font-bold text-[#325747]">
        {row.code}
        {row.isPetCuddles && (
          <span className="ml-2 text-xs bg-[#E59560] text-white px-2 py-1 rounded-full">
            Pet Cuddles
          </span>
        )}
      </div>
    )
  },
  {
    header: 'Discount',
    accessor: 'discountAmount',
    cell: (row) => (
      row.discountType === 'percentage' 
        ? `${row.discountAmount}%` 
        : `$${row.discountAmount.toFixed(2)}`
    )
  },
    {
      header: 'Min. Purchase',
      accessor: 'conditions.minPurchase',
      cell: (row) => row.conditions.minPurchase > 0 
        ? `$${row.conditions.minPurchase.toFixed(2)}` 
        : 'None'
    },
    {
      header: 'Valid Until',
      accessor: 'conditions.validUntil',
      cell: (row) => formatDate(row.conditions.validUntil)
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        const status = statusBadge(row.conditions.validUntil);
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${status.class}`}>
            {status.text}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditCoupon(row)}
            className="p-2 text-[#325747] hover:bg-[#BACEC1] rounded-md transition"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            onClick={() => setCouponToDelete(row._id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )
    }
  ];

  const DataTable = ({ columns, data }) => {
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
              <motion.tr 
                key={rowIndex} 
                className="hover:bg-gray-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {column.cell ? column.cell(row) : row[column.accessor]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
    </div>
  );

  const EmptyState = ({ title, description, buttonText, onButtonClick }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faTags} className="text-gray-400 text-2xl" />
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
    <ShopLayout activeTab="coupons">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <h1 className="text-2xl md:text-3xl font-bold font-laila text-[#325747]">
              Coupon Management
            </h1>
            <div className="h-1 rounded-full bg-[#E59560]" style={{ width: "130px", marginLeft: "20px" }}></div>
          </motion.div>
          
          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-3 md:space-y-0 md:space-x-3">
            <div className="relative flex-grow md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search coupons..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[#E59560] focus:border-[#E59560]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center bg-white px-3 py-2 border border-gray-300 rounded-lg">
              <label htmlFor="activeOnly" className="mr-2 text-sm text-[#325747]">
                Active Only
              </label>
              <input
                type="checkbox"
                id="activeOnly"
                checked={activeOnly}
                onChange={() => setActiveOnly(!activeOnly)}
                className="h-4 w-4 text-[#E59560] focus:ring-[#E59560] border-[#BACEC1] rounded"
              />
            </div>
            
            <button 
              onClick={() => {
                setEditingCoupon(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d48753] flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Coupon
            </button>
          </div>
        </div>

        {loading && coupons.length === 0 ? (
          <LoadingSpinner />
        ) : coupons.length === 0 ? (
          <EmptyState
            title={activeOnly ? "No active coupons found" : "No coupons found"}
            description={
              activeOnly 
                ? "You don't have any active coupons. Create one to get started!"
                : "You haven't created any coupons yet. Click the button below to add your first coupon."
            }
            buttonText="Add Coupon"
            onButtonClick={() => {
              setEditingCoupon(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <DataTable 
                columns={columns} 
                data={coupons}
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

        <ConfirmModal
          isOpen={!!couponToDelete}
          onClose={() => setCouponToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Coupon"
          message="Are you sure you want to delete this coupon? This action cannot be undone."
        />
    
        <CouponForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)}
          isEdit={!!editingCoupon}
          coupon={editingCoupon}
          onSuccess={handleFormSuccess}
        />
      </div>
    </ShopLayout>
  );
};

export default Coupons;