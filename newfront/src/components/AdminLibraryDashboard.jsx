import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, faVideo, faPuzzlePiece, 
  faPlus, faEdit, faTrash, faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import AdminLayout from './AdminHeader';

const LibraryDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [analytics, setAnalytics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [categoriesRes, itemsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/library/categories', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/admin/library/items', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setCategories(categoriesRes.data);
        setItems(itemsRes.data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load library data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/library/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/admin/library/items/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(items.filter(item => item._id !== id));
        toast.success('Item deleted successfully');
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const getItemIcon = (item) => {
    switch (item.type) {
      case 'video': return faVideo;
      case 'interactive': return faPuzzlePiece;
      default: return faBook;
    }
  };

   const getItemType = (item) => {
    return item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Article';
  };

  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Library Management</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'items' ? 'bg-[#325747] text-white' : 'bg-gray-200'}`}
            >
              Content
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                fetchAnalytics();
              }}
              className={`px-4 py-2 rounded-lg ${activeTab === 'categories' ? 'bg-[#325747] text-white' : 'bg-gray-200'}`}
            >
              Categories
            </button>
            <button 
              onClick={() => {
                setActiveTab('analytics');
                fetchAnalytics();
              }}
              className={`px-4 py-2 rounded-lg ${activeTab === 'analytics' ? 'bg-[#325747] text-white' : 'bg-gray-200'}`}
            >
              Analytics
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
          </div>
        ) : (
          <>
            {activeTab === 'items' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Library Content</h2>
                  <button
                    onClick={() => navigate('/admin/library/form')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d4834a]"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add New Item
                  </button>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet Types</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#BACEC1] text-[#325747]">
                                <FontAwesomeIcon icon={getItemIcon(item)} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                <div className="text-sm text-gray-500">{item.description.substring(0, 50)}...</div>
                              </div>
                            </div>
                          </td>
                            <td className="px-6 py-4 whitespace-nowrap">
    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
      {getItemType(item)}
    </span>
  </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {item.categories.map(cat => (
                                <span key={cat._id} className="px-2 py-1 text-xs rounded-full bg-gray-100">
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {item.petTypes.map(type => (
                                <span key={type} className="px-2 py-1 text-xs rounded-full bg-green-100">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.views}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => navigate(`/admin/library/edit/${item._id}`)}
                              className="text-[#325747] hover:text-[#1e3a2b] mr-3"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => deleteItem(item._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Categories</h2>
                  <button
                    onClick={() => navigate('/admin/library/categories/add')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d4834a]"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Category
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map(category => (
                    <motion.div 
                      key={category._id}
                      whileHover={{ scale: 1.03 }}
                      className="bg-white rounded-lg shadow p-4 border-l-4"
                      style={{ borderLeftColor: category.color || '#325747' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{category.name}</h3>
                          <p className="text-gray-600 text-sm">{category.description}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color || '#BACEC1' }}>
                          <FontAwesomeIcon 
                            icon={category.icon ? ['fas', category.icon] : faBook} 
                            className="text-white"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {category.itemCount || 0} items
                        </span>
                        <div>
                          <button
                            onClick={() => navigate(`/admin/library/categories/edit/${category._id}`)}
                            className="text-[#325747] hover:text-[#1e3a2b] mr-2"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && analytics && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Library Analytics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FontAwesomeIcon icon={faBook} />
                      Total Items
                    </h3>
                    <p className="text-3xl font-bold mt-2">{analytics.totalItems}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FontAwesomeIcon icon={faBook} />
                      Total Categories
                    </h3>
                    <p className="text-3xl font-bold mt-2">{analytics.totalCategories}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FontAwesomeIcon icon={faChartBar} />
                      Most Viewed
                    </h3>
                    <p className="text-3xl font-bold mt-2">
                      {analytics.mostViewed[0]?.views || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {analytics.mostViewed[0]?.title || 'No data'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 mb-6">
                  <h3 className="font-bold text-lg mb-4">Most Popular Categories</h3>
                  <div className="space-y-3">
                    {analytics.popularCategories.map(cat => (
                      <div key={cat._id} className="flex items-center">
                        <div className="w-48 font-medium">{cat.name}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-[#E59560] h-2.5 rounded-full" 
                              style={{ width: `${(cat.itemCount / analytics.totalItems) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-medium">
                          {cat.itemCount} items
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-bold text-lg mb-4">Top Viewed Content</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.mostViewed.map(item => (
                          <tr key={item._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {item.videoUrl ? 'Video' : item.interactiveTool ? 'Interactive' : 'Article'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.views}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default LibraryDashboard;