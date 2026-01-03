// frontend/src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Upload
} from 'lucide-react';
import './styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout, isStaff, token } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStaff) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isStaff, navigate]);

  const fetchData = async () => {
    try {
      // Fetch products
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      
      if (productsData.status === 'success') {
        setProducts(productsData.data);
        setStats(prev => ({ ...prev, totalProducts: productsData.count }));
      }

      // Fetch orders stats
      const ordersRes = await fetch('/api/orders/stats');
      const ordersData = await ordersRes.json();
      
      if (ordersData.status === 'success') {
        setStats(prev => ({
          ...prev,
          totalOrders: ordersData.data.total_orders || 0,
          totalRevenue: ordersData.data.total_revenue || 0
        }));
      }

      // Fetch customers count
      const customersRes = await fetch('/api/customers');
      const customersData = await customersRes.json();
      
      if (customersData.status === 'success') {
        setStats(prev => ({ ...prev, totalCustomers: customersData.count }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setProducts(products.filter(p => p.id !== id));
        alert('Product deleted successfully');
      } else {
        alert('Failed to delete product: ' + data.message);
      }
    } catch (error) {
      console.error(error);  
      alert('Error deleting product');
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.full_name}!</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customers">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalCustomers}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>₹{parseFloat(stats.totalRevenue || 0).toFixed(2)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Products Management</h2>
          <button className="add-btn" onClick={() => navigate('/admin/products/new')}>
            <Plus size={20} />
            Add Product
          </button>
        </div>

        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.image_url || '/placeholder.svg'} 
                      alt={product.name}
                      className="product-thumb"
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category_name || 'N/A'}</td>
                  <td>₹{product.price}</td>
                  <td>{product.stock_quantity}</td>
                  <td>
                    <span className={`status-badge ${product.is_available ? 'available' : 'unavailable'}`}>
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="no-data">No products found. Add your first product!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;