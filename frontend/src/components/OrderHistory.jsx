// frontend/src/components/OrderHistory.jsx
import { useState, useEffect } from 'react';
import { Package, Clock, ChevronRight } from 'lucide-react';
import './styles/OrderHistory.css';

const OrderHistory = ({ customerId, onNavigateToOrder }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchOrderHistory();
    }
  }, [customerId]);

  const fetchOrderHistory = async () => {
    try {
      const response = await fetch(`/api/recommendations/${customerId}/history`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!customerId || loading || orders.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'delivered': '#10b981',
      'cancelled': '#dc2626',
      'pending': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="order-history-dropdown">
      <div className="history-header">
        <Package size={20} />
        <h3>Recent Orders</h3>
      </div>

      <div className="history-list">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="history-item"
            onClick={() => onNavigateToOrder(order.order_number)}
          >
            <div className="history-item-header">
              <span className="order-num">#{order.order_number}</span>
              <span 
                className="order-status"
                style={{ color: getStatusColor(order.status) }}
              >
                {order.status}
              </span>
            </div>
            
            <div className="history-item-details">
              <Clock size={14} />
              <span>{formatDate(order.created_at)}</span>
              <span className="order-amount">₹{order.total_amount}</span>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="history-item-products">
                {order.items.slice(0, 2).map((item, idx) => (
                  <span key={idx}>{item.product_name}</span>
                ))}
                {order.items.length > 2 && (
                  <span>+{order.items.length - 2} more</span>
                )}
              </div>
            )}

            <ChevronRight size={16} className="history-arrow" />
          </div>
        ))}
      </div>

      <button 
        className="view-all-btn"
        onClick={() => onNavigateToOrder()}
      >
        View All Orders
      </button>
    </div>
  );
};

export default OrderHistory;