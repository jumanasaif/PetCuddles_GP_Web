import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShop, faUser, faSearch, faFilter, 
  faChevronUp, faChevronDown, faEye,
  faBan, faCheck, faTrash, faEnvelope, faBox
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';
import { motion } from 'framer-motion';

const AdminShopsManagement = () => {
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    filterAndSortShops();
  }, [shops, searchTerm, sortConfig]);
  

 const fetchShops = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/shops', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Fetch product and order counts for each shop
    const shopsWithStats = await Promise.all(
      response.data.map(async shop => {
        const [productsResponse, ordersResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/admin/shops/${shop._id}/products`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 1 } // Just get count
          }),
          axios.get(`http://localhost:5000/api/orders/admin/shop/${shop._id}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 1 } // Just get count
          })
        ]);
        
        return {
          ...shop,
          productCount: productsResponse.data.total || 0,
          orderCount: ordersResponse.data.total || 0
        };
      })
    );
    
    setShops(shopsWithStats);
  } catch (error) {
    console.error('Error fetching shops:', error);
    alert('Failed to fetch shops');
  } finally {
    setLoading(false);
  }
};

  const filterAndSortShops = () => {
    let result = [...shops];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(shop => 
        shop.shopName.toLowerCase().includes(term) ||
        shop.fullName.toLowerCase().includes(term) ||
        shop.email.toLowerCase().includes(term) ||
        shop.phone.toLowerCase().includes(term) ||
        shop.city?.toLowerCase().includes(term) ||
        shop.village?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredShops(result);
  };

  const getSortValue = (shop, key) => {
    switch(key) {
      case 'name': return shop.shopName.toLowerCase();
      case 'owner': return shop.fullName.toLowerCase();
      case 'email': return shop.email.toLowerCase();
      case 'products': return shop.productCount;
      case 'orders': return shop.orderCount;
      case 'status': return shop.isActive ? 1 : 0;
      case 'createdAt': return new Date(shop.createdAt);
      default: return shop[key] || '';
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSuspend = async (shopId) => {
    if (!window.confirm('Are you sure you want to suspend this pet shop?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/suspend-shop/${shopId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Shop suspended successfully');
      fetchShops();
    } catch (error) {
      console.error('Error suspending shop:', error);
      alert('Failed to suspend shop');
    }
  };

  const handleDelete = async (shopId) => {
    if (!window.confirm('Are you sure you want to delete this pet shop account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/delete-shop/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Shop deleted successfully');
      fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      alert('Failed to delete shop');
    }
  };

const showShopDetails = async (shop) => {
  try {
    const token = localStorage.getItem('token');
    const [shopDetails, productsResponse, ordersResponse] = await Promise.all([
      axios.get(`http://localhost:5000/api/admin/shops/${shop._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`http://localhost:5000/api/admin/shops/${shop._id}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5 }
      }),
      axios.get(`http://localhost:5000/api/orders/admin/shop/${shop._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5 }
      })
    ]);
    
    setSelectedShop({
      ...shopDetails.data,
      recentProducts: productsResponse.data.data,
      recentOrders: ordersResponse.data.data
    });
    setIsModalVisible(true);
  } catch (error) {
    console.error('Error fetching shop details:', error);
    alert('Failed to fetch shop details');
  }
};

  const columns = [
    // In your columns definition where profileImage is rendered:
{
  key: 'name',
  header: 'Shop Name',
  render: (row) => (
    <div className="flex items-center gap-3">
      {row.profileImage ? (
        <img 
          src={row.profileImage.startsWith('http') ? row.profileImage : `http://localhost:5000${row.profileImage}`}
          alt={row.shopName} 
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#325747] flex items-center justify-center text-white">
          <FontAwesomeIcon icon={faShop} />
        </div>
      )}
      <span>{row.shopName}</span>
    </div>
  ),
  sortable: true
},
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => row.fullName,
      sortable: true
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email,
      sortable: true
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <div className="text-sm">
          {row.city && <div>{row.city}</div>}
          {row.village && <div className="text-gray-500">{row.village}</div>}
        </div>
      ),
      sortable: false
    },
    {
      key: 'products',
      header: 'Products',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faShop} className="text-[#325747]" />
          <span>{row.productCount || 0}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="text-[#E59560]" />
          <span>{row.orderCount || 0}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.isActive ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Active</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Suspended</span>
            </>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#325747] text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => showShopDetails(row)}
          >
            <FontAwesomeIcon icon={faEye} />
            View
          </motion.button>
          {row.isActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
              onClick={() => handleSuspend(row._id)}
            >
              <FontAwesomeIcon icon={faBan} />
              Suspend
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
              onClick={() => handleSuspend(row._id)}
            >
              <FontAwesomeIcon icon={faCheck} />
              Activate
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
            onClick={() => handleDelete(row._id)}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </motion.button>
        </div>
      ),
      sortable: false
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1a2e25] to-[#0f1a15] text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Pet Shops Management</h1>
              <p className="text-gray-300 mt-2">
                {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} registered
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search shops..."
                className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
              <select
                className="rounded-lg border border-gray-300 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#325747] focus:border-transparent w-full"
                onChange={(e) => {
                  if (e.target.value === 'active') {
                    setFilteredShops(shops.filter(s => s.isActive));
                  } else if (e.target.value === 'inactive') {
                    setFilteredShops(shops.filter(s => !s.isActive));
                  } else {
                    setFilteredShops(shops);
                  }
                }}
              >
                <option value="all">All Shops</option>
                <option value="active">Active Only</option>
                <option value="inactive">Suspended Only</option>
              </select>
            </div>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setSortConfig({ key: 'createdAt', direction: 'desc' });
                setFilteredShops(shops);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No matching shops found' : 'No shops registered'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#325747]">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-[#2a473b]' : ''}`}
                        onClick={() => column.sortable && requestSort(column.key)}
                      >
                        <div className="flex items-center">
                          {column.header}
                          {column.sortable && (
                            <span className="ml-1">
                              {sortConfig.key === column.key ? (
                                sortConfig.direction === 'asc' ? (
                                  <FontAwesomeIcon icon={faChevronUp} />
                                ) : (
                                  <FontAwesomeIcon icon={faChevronDown} />
                                )
                              ) : (
                                <FontAwesomeIcon icon={faChevronUp} className="opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShops.map((shop) => (
                    <motion.tr 
                      key={shop._id}
                      whileHover={{ backgroundColor: 'rgba(229, 149, 96, 0.05)' }}
                      className="transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render(shop)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Shop Details Modal */}
        {isModalVisible && selectedShop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="bg-[#325747] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Shop Details</h2>
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Shop Info */}
                  <div className="col-span-1">
                    <div className="flex flex-col items-center">
                      {selectedShop.profileImage ? (
                        <img 
          src={selectedShop.profileImage.startsWith('http') ? selectedShop.profileImage : `http://localhost:5000${selectedShop.profileImage}`}
          alt={selectedShop.shopName} 
          className="w-32 h-32 rounded-full object-cover mb-4"
        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-[#E59560] flex items-center justify-center text-white text-4xl mb-4">
                          <FontAwesomeIcon icon={faShop} />
                        </div>
                      )}
                      <h3 className="text-xl font-bold">{selectedShop.shopName}</h3>
                      <p className="text-gray-500">Joined: {new Date(selectedShop.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>{selectedShop.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEnvelope} className="text-[#325747]" />
                        <span>{selectedShop.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>{selectedShop.phone}</span>
                      </div>
                      {selectedShop.city && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                          <span>{selectedShop.city}</span>
                        </div>
                      )}
                      {selectedShop.village && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                          <span>{selectedShop.village}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#325747]" />
                        <span>Status: {selectedShop.isActive ? 'Active' : 'Suspended'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shop Stats */}
                  <div className="col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F6F4E8] p-4 rounded-lg">
  <h4 className="font-bold text-[#325747] mb-2">Recent Products</h4>
  <div className="bg-gray-50 p-4 rounded-lg">
    {selectedShop.recentProducts && selectedShop.recentProducts.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {selectedShop.recentProducts.map(product => (
          <div key={product._id} className="border rounded-lg overflow-hidden">
            {/* Image section */}
            <div className="bg-white p-4 flex justify-center">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0].data}
                  alt={product.name}
                  className="w-full h-48 object-contain rounded"
                />
              ) : (
                <div className="w-full h-48 rounded bg-gray-200 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBox} className="text-gray-500 text-4xl" />
                </div>
              )}
            </div>
            
            {/* Product info section - now below the image */}
            <div className="p-3 bg-white border-t">
              <h5 className="font-bold text-[#325747] truncate">{product.name}</h5>
              <div className="flex justify-between mt-1">
                <span className="font-medium text-gray-800">${product.price}</span>
                <span className="text-sm text-gray-500">{product.stock} in stock</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{product.category}</span>
                {product.weight && <span>{product.weight}g</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 italic">No products listed</p>
    )}
    
    {/* View all products button - only show if there are products */}
    {selectedShop.productCount > 0 && (
      <button 
        className="w-full text-sm text-[#325747] hover:underline mt-3 py-2 bg-[#F6F4E8] rounded-lg"
        onClick={() => {
          console.log("View all products for:", selectedShop._id);
        }}
      >
        View all {selectedShop.productCount} products →
      </button>
    )}
  </div>
</div>
                      
                     <div className="bg-[#BACEC1] p-4 rounded-lg">
  <h4 className="font-bold text-[#325747] mb-2">Recent Orders</h4>
  {selectedShop.recentOrders && selectedShop.recentOrders.length > 0 ? (
    <div className="space-y-2">
      {selectedShop.recentOrders.map(order => (
        <div key={order._id} className="p-2 border rounded-lg bg-white">
          <div className="flex justify-between">
            <span className="font-medium">Order #{order._id.slice(-6)}</span>
            <span className={`text-sm ${
              order.status === 'delivered' ? 'text-green-600' :
              order.status === 'cancelled' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            ${order.totalAmount.toFixed(2)} • {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
      <button 
        className="text-sm text-[#325747] hover:underline mt-2"
        onClick={() => {
          // Navigate to full orders list
          console.log("View all orders for:", selectedShop._id);
        }}
      >
        View all {selectedShop.orderCount} orders →
      </button>
    </div>
  ) : (
    <p className="text-sm text-gray-500">No orders yet</p>
  )}
</div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-bold text-[#325747] mb-2">Shop Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedShop.DeliveryProvide ? (
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Delivery Service: </span>
                              Yes
                            </div>
                            {selectedShop.deliverySettings && (
                              <>
                                <div>
                                  <span className="font-medium">Delivery Cost: </span>
                                  ${selectedShop.deliverySettings.cost}
                                </div>
                                <div>
                                  <span className="font-medium">Estimated Delivery: </span>
                                  {selectedShop.deliverySettings.estimatedDays} days
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No delivery service provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => setIsModalVisible(false)}
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E59560] text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => {
                      // Implement message functionality
                      console.log("Message shop:", selectedShop.email);
                    }}
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                    Send Message
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminShopsManagement;
