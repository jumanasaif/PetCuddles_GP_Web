// src/components/admin/library/CategoryForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#325747'
  });

  useEffect(() => {
    if (id) {
      const fetchCategory = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://localhost:5000/api/admin/library/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFormData(res.data);
          setLoading(false);
        } catch (error) {
          toast.error('Failed to load category');
          navigate('/admin/library/categories');
        }
      };
      fetchCategory();
    } else {
      setLoading(false);
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (id) {
        await axios.put(`http://localhost:5000/api/admin/library/categories/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/admin/library/categories', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category created successfully');
      }
      
      navigate('/admin/library/categories');
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {id ? 'Edit Category' : 'Create New Category'}
          </h1>
          <button
            onClick={() => navigate('/admin/library/categories')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            <FontAwesomeIcon icon={faTimes} />
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Font Awesome name)</label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g. 'dog' for faDog"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="h-10 w-10 cursor-pointer"
                />
                <span>{formData.color}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d4834a]"
              >
                <FontAwesomeIcon icon={faSave} />
                {id ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CategoryForm;
