// frontend/src/components/CustomerOrders.jsx - FIXED for production
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Eye, LogIn } from 'lucide-react';
import { getApiUrl } from '../config/api';  // ✅ ADD THIS
import './styles/CustomerOrders.css';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    const accessToken = localStorage.getItem('accessToken');

    if (!savedCustomer || !accessToken) {
      setLoading(false);
      return;
    }

    const customerData = JSON.parse(savedCustomer);
    setCustomer(customerData);
    fetchOrders(customerData.email);
  }, []);

  const fetchOrders = async (customerEmail) => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/orders/customer?email=${encodeURIComponent(customerEmail)}`));  // ✅ FIXED
      const data = await response.json();
      
      if (data.status === 'success') {
        setOrders(data.data);
      } else {
        console.error('Failed to fetch orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#fbbf24',
      'confirmed': '#3b82f6',
      'preparing': '#8b5cf6',
      'ready': '#10b981',
      'out_for_delivery': '#06b6d4',
      'delivered': '#059669',
      'cancelled': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!customer && !loading) {
    return (
      <div className="customer-orders-page">
        <div className="orders-container">
          <div className="not-logged-in">
            <LogIn size={60} color="#d946a6" />
            <h2>Please Login to View Orders</h2>
            <p>You need to be logged in as a customer to view your order history.</p>
            <button 
              onClick={() => navigate('/')}
              className="login-redirect-btn"
            >
              Go to Home & Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>View and track all your orders from {customer?.first_name}'s account</p>
        </div>

        {loading && <div className="loading">Loading your orders...</div>}

        {!loading && orders.length === 0 && (
          <div className="no-orders">
            <Package size={60} />
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet.</p>
            <button 
              onClick={() => navigate('/')}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: '#d946a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#c026d3'}
              onMouseOut={(e) => e.target.style.background = '#d946a6'}
            >
              Start Shopping
            </button>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <h3>Order #{order.order_number}</h3>
                    <p className="order-date">
                      <Clock size={16} />
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span 
                    className="order-status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="order-info">
                    <span className="info-label">Items:</span>
                    <span className="info-value">{order.item_count}</span>
                  </div>
                  <div className="order-info">
                    <span className="info-label">Type:</span>
                    <span className="info-value">
                      {order.order_type === 'pickup' ? '📦 Pickup' : '🚚 Delivery'}
                    </span>
                  </div>
                  <div className="order-info">
                    <span className="info-label">Total:</span>
                    <span className="info-value total">₹{order.total_amount}</span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <button 
                    className="track-btn"
                    onClick={() => navigate(`/track-order/${order.order_number}`)}
                  >
                    <Eye size={18} />
                    Track Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;