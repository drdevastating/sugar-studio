// frontend/src/components/OrderConfirmation.jsx - FIXED for production
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { getApiUrl } from '../config/api';  // ✅ ADD THIS
import './styles/OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/orders/track/${orderNumber}`));  // ✅ FIXED
      const data = await response.json();
      
      if (data.status === 'success') {
        setOrder(data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="success-animation">
          <CheckCircle size={100} className="success-icon" />
        </div>

        <h1>Order Placed Successfully!</h1>
        <p className="confirmation-subtitle">
          Thank you for your order! We've received it and will start preparing your delicious treats shortly.
        </p>

        {order && (
          <div className="order-summary-card">
            <div className="summary-header">
              <h2>Order Summary</h2>
              <span className="order-number">#{order.order_number}</span>
            </div>

            <div className="summary-details">
              <div className="detail-row">
                <span className="label">Total Amount:</span>
                <span className="value">₹{order.total_amount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Order Type:</span>
                <span className="value">{order.order_type === 'pickup' ? '📦 Pickup' : '🚚 Delivery'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{order.email}</span>
              </div>
            </div>

            <div className="info-boxes">
              <div className="info-box">
                <Mail size={24} />
                <p>A confirmation email has been sent to <strong>{order.email}</strong></p>
              </div>
              <div className="info-box">
                <Package size={24} />
                <p>Use order number <strong>{order.order_number}</strong> to track your order</p>
              </div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="track-btn"
            onClick={() => navigate(`/track-order/${orderNumber}`)}
          >
            Track Order
            <ArrowRight size={20} />
          </button>
          <button 
            className="home-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>

        <div className="contact-info">
          <p>Questions about your order? Contact us at:</p>
          <p><strong>info@thesugarstudio.com</strong> or <strong>(555) 123-CAKE</strong></p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;