// frontend/src/components/ProductForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Save, X, Upload, ArrowLeft } from 'lucide-react';
import './styles/ProductForm.css';

const ProductForm = () => {
  const { id } = useParams(); // If id exists, we're editing
  const navigate = useNavigate();
  const { token, isStaff } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    ingredients: '',
    stock_quantity: '',
    preparation_time: '',
    is_available: true
  });

  useEffect(() => {
    if (!isStaff) {
      navigate('/login');
      return;
    }
    fetchCategories();
    if (id) {
      fetchProduct();
    }
  }, [id, isStaff, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?is_active=true');
      const data = await response.json();
      if (data.status === 'success') {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const product = data.data;
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price,
          category_id: product.category_id,
          image_url: product.image_url,
          ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : '',
          stock_quantity: product.stock_quantity,
          preparation_time: product.preparation_time || '',
          is_available: product.is_available
        });
        setImagePreview(product.image_url);
      }
    } catch (error) {
      console.log('Error fetching product:', error);
      setError('Failed to load product');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.status === 'success') {
        setFormData(prev => ({
          ...prev,
          image_url: data.data.path
        }));
        setImagePreview(data.data.path);
      } else {
        setError(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        stock_quantity: parseInt(formData.stock_quantity),
        preparation_time: parseInt(formData.preparation_time) || null,
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i)
      };

      const url = id ? `/api/products/${id}` : '/api/products';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        alert(id ? 'Product updated successfully!' : 'Product created successfully!');
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-page">
      <div className="product-form-container">
        <div className="form-header">
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1>{id ? 'Edit Product' : 'Add New Product'}</h1>
          <p>Fill in the details below to {id ? 'update' : 'create'} a product</p>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          {/* Image Upload */}
          <div className="form-section">
            <h3>Product Image</h3>
            <div className="image-upload-area">
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
              <div className="upload-controls">
                <label htmlFor="image-upload" className="upload-btn">
                  <Upload size={20} />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />
                <p className="upload-hint">PNG, JPG, WebP up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Chocolate Cupcake"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category_id">Category *</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (₹) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock_quantity">Stock Quantity *</label>
                <input
                  type="number"
                  id="stock_quantity"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preparation_time">Preparation Time (minutes)</label>
                <input
                  type="number"
                  id="preparation_time"
                  name="preparation_time"
                  value={formData.preparation_time}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="30"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                  />
                  <span>Available for sale</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-section">
            <h3>Description</h3>
            <div className="form-group">
              <label htmlFor="description">Product Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Describe your product..."
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="form-section">
            <h3>Ingredients</h3>
            <div className="form-group">
              <label htmlFor="ingredients">Ingredients (comma-separated)</label>
              <textarea
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                rows={3}
                placeholder="flour, sugar, butter, chocolate"
              />
              <p className="field-hint">Separate ingredients with commas</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="cancel-btn"
            >
              <X size={20} />
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={loading || uploadingImage}
            >
              <Save size={20} />
              {loading ? 'Saving...' : (id ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;