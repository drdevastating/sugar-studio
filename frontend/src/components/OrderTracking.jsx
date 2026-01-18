// frontend/src/components/OrderTracking.jsx - FIXED for production
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { getApiUrl } from '../config/api';  // ✅ ADD THIS
import './styles/OrderTracking.css';

const OrderTracking = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchNumber, setSearchNumber] = useState(orderNumber || '');

  useEffect(() => {
    if (orderNumber) {
      fetchOrder(orderNumber);
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  const fetchOrder = async (num) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(getApiUrl(`/api/orders/track/${num}`));  // ✅ FIXED
      const data = await response.json();

      if (data.status === 'success') {
        setOrder(data.data);
      } else {
        setError(data.message || 'Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchNumber.trim()) {
      navigate(`/track-order/${searchNumber.trim()}`);
      fetchOrder(searchNumber.trim());
    }
  };

  const getStatusSteps = () => {
    const allSteps = [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: Clock },
      { key: 'ready', label: 'Ready', icon: CheckCircle },
    ];

    if (order?.order_type === 'delivery') {
      allSteps.push({ key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck });
    }

    allSteps.push({ key: 'delivered', label: order?.order_type === 'pickup' ? 'Picked Up' : 'Delivered', icon: CheckCircle });

    return allSteps;
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const steps = getStatusSteps();
    const currentIndex = steps.findIndex(step => step.key === order.status);
    return currentIndex >= 0 ? currentIndex : 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="order-tracking-page">
        <div className="tracking-container">
          <div className="loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking-page">
      <div className="tracking-container">
        <div className="tracking-header">
          <h1>Track Your Order</h1>
          <p>Enter your order number to track your delicious treats</p>
        </div>

        <form onSubmit={handleSearch} className="tracking-search">
          <input
            type="text"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            placeholder="Enter order number (e.g., BK123456789)"
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Track Order
          </button>
        </form>

        {error && (
          <div className="tracking-error">
            {error}
          </div>
        )}

        {order && (
          <>
            <div className="order-info-card">
              <div className="order-header-info">
                <div>
                  <h2>Order #{order.order_number}</h2>
                  <p className="order-date">Placed on {formatDate(order.created_at)}</p>
                </div>
                <div className="order-status-badge">
                  <span className={`status-indicator ${order.status}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="order-details-grid">
                <div className="detail-item">
                  <Package size={20} />
                  <div>
                    <span className="detail-label">Order Type</span>
                    <span className="detail-value">{order.order_type === 'pickup' ? '📦 Pickup' : '🚚 Delivery'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Calendar size={20} />
                  <div>
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value">₹{order.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="progress-tracker">
              <h3>Order Status</h3>
              <div className="progress-steps">
                {getStatusSteps().map((step, index) => {
                  const currentStep = getCurrentStepIndex();
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="step-icon">
                        <Icon size={24} />
                      </div>
                      <div className="step-info">
                        <span className="step-label">{step.label}</span>
                        {isCurrent && (
                          <span className="step-status">In Progress</span>
                        )}
                      </div>
                      {index < getStatusSteps().length - 1 && (
                        <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="order-items-card">
              <h3>Order Items</h3>
              <div className="items-list">
                {order.items?.map((item, index) => (
                  <div key={index} className="order-item">
                    <img src={item.image_url || '/placeholder.svg'} alt={item.product_name} />
                    <div className="item-info">
                      <h4>{item.product_name}</h4>
                      <p>Quantity: {item.quantity}</p>
                    </div>
                    <span className="item-price">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="contact-card">
              <h3>Need Help?</h3>
              <p>Contact us if you have any questions about your order</p>
              <div className="contact-info">
                <div className="contact-item">
                  <Phone size={18} />
                  <span>(555) 123-CAKE</span>
                </div>
                <div className="contact-item">
                  <Mail size={18} />
                  <span>info@thesugarstudio.com</span>
                </div>
                <div className="contact-item">
                  <MapPin size={18} />
                  <span>123 Sweet Street, Sugar City</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;