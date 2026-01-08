// frontend/src/components/CustomerOrders.jsx
import { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Eye } from 'lucide-react';
import './styles/CustomerOrders.css';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);

  const fetchOrders = async (customerEmail) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/customer?email=${encodeURIComponent(customerEmail)}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setOrders(data.data);
        setSearched(true);
      } else {
        alert(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (email.trim()) {
      fetchOrders(email.trim());
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

  return (
    <div className="customer-orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>Track and view your order history</p>
        </div>

        {/* Email Search Form */}
        <form onSubmit={handleSearch} className="email-search-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to view orders"
            className="email-input"
            required
          />
          <button type="submit" className="search-btn">
            View My Orders
          </button>
        </form>

        {loading && <div className="loading">Loading your orders...</div>}

        {!loading && searched && orders.length === 0 && (
          <div className="no-orders">
            <Package size={60} />
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet with this email.</p>
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