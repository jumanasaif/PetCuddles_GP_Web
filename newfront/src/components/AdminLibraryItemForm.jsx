import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import AdminLayout from './AdminHeader';

const LibraryItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [articleFile, setArticleFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    articleContent: '',
    articleFile: '',
    videoUrl: '',
    videoFile: '',
    interactiveTool: null,
    categories: [],
    petTypes: [],
    difficulty: 'beginner',
    thumbnail: '',
    images: [],
    isFeatured: false,
    author: '',
    duration: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [categoriesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/library/categories', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCategories(categoriesRes.data);

        if (id) {
          const itemRes = await axios.get(`http://localhost:5000/api/admin/library/items/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const itemData = itemRes.data;
          setFormData({
            ...itemData,
            categories: itemData.categories.map(cat => cat._id)
          });
          console.log(itemRes.data);
          if (itemData.images) {
            setExistingImages(itemData.images);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading form data:', error);
        toast.error('Failed to load form data');
        navigate('/admin/library');
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (catId) => {
    setFormData(prev => {
      const newCategories = prev.categories.includes(catId)
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId];
      return { ...prev, categories: newCategories };
    });
  };

  const handlePetTypeChange = (petType) => {
    setFormData(prev => {
      const newPetTypes = prev.petTypes.includes(petType)
        ? prev.petTypes.filter(type => type !== petType)
        : [...prev.petTypes, petType];
      return { ...prev, petTypes: newPetTypes };
    });
  };

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImages([...newImages, ...Array.from(e.target.files)]);
    }
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    setRemovedImages([...removedImages, imageToRemove]);
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'categories' || key === 'petTypes') {
          formData[key].forEach(value => formDataToSend.append(`${key}[]`, value));
        } else if (key === 'images') {
          // We'll handle images separately
        } else if (key !== 'interactiveTool') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Handle interactive tool separately
      if (formData.interactiveTool) {
        formDataToSend.append('interactiveTool', JSON.stringify(formData.interactiveTool));
      }
      
      // Append files with correct field names
      if (articleFile) formDataToSend.append('articleFile', articleFile);
      if (thumbnailFile) formDataToSend.append('thumbnail', thumbnailFile);
      if (videoFile) formDataToSend.append('videoFile', videoFile);
      newImages.forEach(img => formDataToSend.append('images', img));
      
      // Append removed images if any
      removedImages.forEach(img => formDataToSend.append('removedImages[]', img));
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const url = id 
        ? `http://localhost:5000/api/admin/library/items/${id}`
        : 'http://localhost:5000/api/admin/library/items';
        
      const method = id ? 'put' : 'post';
      
      await axios[method](url, formDataToSend, config);
      toast.success(`Item ${id ? 'updated' : 'created'} successfully`);
      navigate('/admin/library');
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(`Failed to ${id ? 'update' : 'create'} item`);
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

  const petTypes = ['dog', 'cat', 'bird', 'rabbit', 'cow', 'sheep'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const contentTypes = ['article', 'video', 'interactive','image'];

return (
  <AdminLayout>
    <div className="p-4 md:p-6 bg-[#F6F4E8] min-h-screen font-laila">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#325747]">
            {id ? 'Edit Library Item' : 'Create New Library Item'}
          </h1>
          <button
            onClick={() => navigate('/admin/library')}
            className="flex items-center gap-2 px-4 py-2 bg-[#BACEC1] text-[#325747] rounded-lg hover:bg-[#a8bdb1] transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-[#BACEC1]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Title */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#325747] mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] outline-none transition-all"
                required
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#325747] mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] outline-none transition-all min-h-[100px]"
                required
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Content Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560] focus:border-[#E59560] outline-none transition-all bg-white"
              >
                {contentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Article Content */}
            {formData.type === 'article' && (
              <div className="col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#325747] mb-1">Article Content</label>
                  <textarea
                    name="articleContent"
                    value={formData.articleContent}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560] min-h-[150px]"
                  />
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <label className="cursor-pointer bg-[#BACEC1] hover:bg-[#a8bdb1] text-[#325747] px-4 py-2 rounded-md border border-[#BACEC1] transition-colors text-center">
                      Choose PDF File
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, setArticleFile)}
                        accept=".pdf"
                        className="hidden"
                      />
                    </label>
                    {(articleFile || formData.articleFile) && (
                      <span className="text-sm text-[#325747] bg-[#F6F4E8] px-3 py-2 rounded-md flex items-center">
                        {articleFile ? articleFile.name : formData.articleFile.split('/').pop()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-[#325747] mb-1">Images</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="cursor-pointer bg-[#BACEC1] hover:bg-[#a8bdb1] text-[#325747] px-4 py-2 rounded-md border border-[#BACEC1] transition-colors text-center">
                      Add Images
                      <input
                        type="file"
                        onChange={handleImageUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* Image Previews */}
                  {(existingImages.length > 0 || newImages.length > 0) && (
                    <div className="mt-3">
                      <div className="text-xs text-[#325747] mb-1">Click × to remove</div>
                      <div className="flex flex-wrap gap-2">
                        {existingImages.map((img, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img 
                              src={img}
                              alt={`Preview ${index}`}
                              className="h-16 w-16 object-cover rounded border border-[#BACEC1]"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute -top-2 -right-2 bg-[#E59560] text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {newImages.map((img, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <img 
                              src={URL.createObjectURL(img)} 
                              alt={`Preview ${index}`}
                              className="h-16 w-16 object-cover rounded border border-[#BACEC1]"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="absolute -top-2 -right-2 bg-[#E59560] text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Video Content */}
            {formData.type === 'video' && (
              <div className="col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#325747] mb-1">Video URL (YouTube or other)</label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560]"
                    placeholder="https://youtu.be/..."
                  />
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <label className="cursor-pointer bg-[#BACEC1] hover:bg-[#a8bdb1] text-[#325747] px-4 py-2 rounded-md border border-[#BACEC1] transition-colors text-center">
                      Choose Video File
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, setVideoFile)}
                        accept="video/*"
                        className="hidden"
                      />
                    </label>
                    {(videoFile || formData.videoFile) && (
                      <span className="text-sm text-[#325747] bg-[#F6F4E8] px-3 py-2 rounded-md flex items-center">
                        {videoFile ? videoFile.name : formData.videoFile.split('/').pop()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Video Preview */}
                {(videoFile || formData.videoFile) && (
                  <div className="mt-2 bg-[#F6F4E8] p-2 rounded-md">
                    <video 
                      controls 
                      src={videoFile ? URL.createObjectURL(videoFile) : `${formData.videoFile}?${new Date().getTime()}`}
                      className="w-full rounded-md"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-[#325747] mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560]"
                    min="0"
                  />
                </div>
              </div>
            )}

            {/* Interactive Content */}
            {formData.type === 'interactive' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[#325747] mb-1">Interactive Tool Configuration</label>
                <textarea
                  name="interactiveTool"
                  value={JSON.stringify(formData.interactiveTool, null, 2)}
                  onChange={(e) => {
                    try {
                      const value = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, interactiveTool: value }));
                    } catch (err) {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="w-full p-2 border border-[#BACEC1] rounded-md font-mono text-sm focus:ring-2 focus:ring-[#E59560] min-h-[200px]"
                />
              </div>
            )}

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Categories</label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border border-[#BACEC1] rounded-md">
                {categories.map(category => (
                  <label key={category._id} className="flex items-center space-x-2 p-1 hover:bg-[#F6F4E8] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category._id)}
                      onChange={() => handleCategoryChange(category._id)}
                      className="rounded text-[#E59560] focus:ring-[#E59560]"
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pet Types */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Pet Types</label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border border-[#BACEC1] rounded-md">
                {petTypes.map(petType => (
                  <label key={petType} className="flex items-center space-x-2 p-1 hover:bg-[#F6F4E8] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.petTypes.includes(petType)}
                      onChange={() => handlePetTypeChange(petType)}
                      className="rounded text-[#E59560] focus:ring-[#E59560]"
                    />
                    <span>{petType.charAt(0).toUpperCase() + petType.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560] outline-none transition-all bg-white"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Item */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="rounded text-[#E59560] focus:ring-[#E59560]"
              />
              <label htmlFor="isFeatured" className="ml-2 text-sm font-medium text-[#325747]">
                Featured Item
              </label>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-[#325747] mb-1">Author</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="w-full p-2 border border-[#BACEC1] rounded-md focus:ring-2 focus:ring-[#E59560]"
              />
            </div>

            {/* Thumbnail */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#325747] mb-1">Thumbnail</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="cursor-pointer bg-[#BACEC1] hover:bg-[#a8bdb1] text-[#325747] px-4 py-2 rounded-md border border-[#BACEC1] transition-colors text-center">
                  Choose Thumbnail
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, setThumbnailFile)}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
                {(thumbnailFile || formData.thumbnail) && (
                  <span className="text-sm text-[#325747] bg-[#F6F4E8] px-3 py-2 rounded-md flex items-center">
                    {thumbnailFile ? thumbnailFile.name : formData.thumbnail.split('/').pop()}
                  </span>
                )}
              </div>
              {(thumbnailFile || formData.thumbnail) && (
                <div className="mt-2">
                  <img 
                    src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : formData.thumbnail}
                    alt="Thumbnail preview"
                    className="h-20 object-contain border border-[#BACEC1] rounded-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-[#E59560] hover:bg-[#d4834a] text-white rounded-lg transition-colors shadow-md"
            >
              <FontAwesomeIcon icon={faSave} />
              {id ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
);
};

export default LibraryItemForm;
