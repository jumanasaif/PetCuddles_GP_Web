// InventoryDashboard.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  faBoxOpen, faExclamationTriangle, 
  faTimesCircle, faChartLine, faBell
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import ShopLayout from './ShopLayout';

const InventoryDashboard = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
  totalProducts: 0,
  totalStock: 0,
  totalStockValue: 0,  // Ensure this is 0 instead of undefined
  lowStockCount: 0,
  outOfStockCount: 0
});

// InventoryDashboard.js
const fetchInventoryData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Make requests sequentially for better error handling
   try {
  const statsRes = await axios.get('http://localhost:5000/api/product/stats', config);
  setStats({
    totalProducts: statsRes.data.totalProducts || 0,
    totalStock: statsRes.data.totalStock || 0,
    totalStockValue: statsRes.data.totalStockValue || 0,
    lowStockCount: statsRes.data.lowStockCount || 0,
    outOfStockCount: statsRes.data.outOfStockCount || 0
  });
} catch (statsError) {
  console.error('Stats error:', statsError.response?.data || statsError.message);
  toast.error(statsError.response?.data?.message || 'Failed to load statistics');
  // Reset to default values on error
  setStats({
    totalProducts: 0,
    totalStock: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
}

    try {
      const lowStockRes = await axios.get('http://localhost:5000/api/product/low-stock', config);
      setLowStockProducts(lowStockRes.data.products);
    } catch (lowStockError) {
      console.error('Low stock error:', lowStockError.response?.data || lowStockError.message);
      toast.error(lowStockError.response?.data?.message || 'Failed to load low stock products');
    }

    try {
      const outOfStockRes = await axios.get('http://localhost:5000/api/product/out-of-stock', config);
      setOutOfStockProducts(outOfStockRes.data.products);
    } catch (outOfStockError) {
      console.error('Out of stock error:', outOfStockError.response?.data || outOfStockError.message);
      toast.error(outOfStockError.response?.data?.message || 'Failed to load out of stock products');
    }

  } catch (error) {
    console.error('Global error:', error);
    toast.error('Failed to load inventory data');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchInventoryData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#325747]"></div>
      </div>
    );
  }

  return (
    <ShopLayout activeTab="inventory">
      <div className="p-6 font-laila">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#325747]">
            Inventory Dashboard
          </h1>
          <div className="h-1 rounded-full bg-[#E59560] w-24 mt-2"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Products</p>
                <h3 className="text-2xl font-bold text-[#325747]">
                  {stats.totalProducts}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-[#BACEC1] text-[#325747]">
                <FontAwesomeIcon icon={faBoxOpen} size="lg" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Stock Value</p>
                <h3 className="text-2xl font-bold text-[#325747]">
                   ${(stats.totalStockValue || 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-[#BACEC1] text-[#325747]">
                <FontAwesomeIcon icon={faChartLine} size="lg" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Low Stock</p>
                <h3 className="text-2xl font-bold text-[#E59560]">
                  {stats.lowStockCount}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-[#E59560]">
                <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Out of Stock</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {stats.outOfStockCount}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <FontAwesomeIcon icon={faTimesCircle} size="lg" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-[#325747] flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-[#E59560]" />
              Low Stock Products
            </h2>
            <p className="text-gray-500 text-sm">Products below their threshold levels</p>
          </div>
          
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0].data} 
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                              <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.threshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FontAwesomeIcon icon={faBell} className="text-2xl mb-2" />
              <p>No low stock products at this time</p>
            </div>
          )}
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-[#325747] flex items-center">
              <FontAwesomeIcon icon={faTimesCircle} className="mr-2 text-red-600" />
               Out of Stock Products
            </h2>
            <p className="text-gray-500 text-sm">Products that need to be restocked</p>
          </div>
          
          {outOfStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {outOfStockProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0].data} 
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                              <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(product.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.threshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FontAwesomeIcon icon={faBell} className="text-2xl mb-2" />
              <p>No out of stock products at this time</p>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
};

export default InventoryDashboard;