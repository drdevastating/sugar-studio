// frontend/src/components/Checkout.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, User, MapPin, Clock, Trash2, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    order_type: 'pickup',
    delivery_address: '',
    scheduled_time: '',
    payment_method: 'cod',
    notes: ''
  });

  const calculateTotal = () => {
    return getCartTotal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(itemId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare order data
      const orderData = {
        customer: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        },
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || ''
        })),
        order_type: formData.order_type,
        scheduled_time: formData.scheduled_time || null,
        delivery_address: formData.order_type === 'delivery' ? formData.delivery_address : null,
        notes: formData.notes,
        payment_method: formData.payment_method
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Clear cart
        clearCart();
        
        // Navigate to order confirmation
        navigate(`/order-confirmation/${data.data.order_number}`);
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-cart">
          <ShoppingCart size={80} className="empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Add some delicious treats to get started!</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Complete your order in just a few steps</p>
        </div>

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        <div className="checkout-content">
          {/* Order Form */}
          <div className="checkout-form">
            <form onSubmit={handleSubmit}>
              {/* Customer Information */}
              <div className="form-section">
                <div className="section-header">
                  <User size={24} />
                  <h2>Contact Information</h2>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name *</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      placeholder="John"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name *</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Order Type */}
              <div className="form-section">
                <div className="section-header">
                  <MapPin size={24} />
                  <h2>Order Type</h2>
                </div>
                <div className="order-type-options">
                  <label className={`order-type-option ${formData.order_type === 'pickup' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="order_type"
                      value="pickup"
                      checked={formData.order_type === 'pickup'}
                      onChange={handleInputChange}
                    />
                    <div className="option-content">
                      <span className="option-icon">📦</span>
                      <div>
                        <strong>Pickup</strong>
                        <p>Collect from our store</p>
                      </div>
                    </div>
                  </label>
                  <label className={`order-type-option ${formData.order_type === 'delivery' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="order_type"
                      value="delivery"
                      checked={formData.order_type === 'delivery'}
                      onChange={handleInputChange}
                    />
                    <div className="option-content">
                      <span className="option-icon">🚚</span>
                      <div>
                        <strong>Delivery</strong>
                        <p>Deliver to your address</p>
                      </div>
                    </div>
                  </label>
                </div>

                {formData.order_type === 'delivery' && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label htmlFor="delivery_address">Delivery Address *</label>
                    <textarea
                      id="delivery_address"
                      name="delivery_address"
                      value={formData.delivery_address}
                      onChange={handleInputChange}
                      required={formData.order_type === 'delivery'}
                      rows={3}
                      placeholder="Enter your complete delivery address"
                    />
                  </div>
                )}
              </div>

              {/* Schedule & Payment */}
              <div className="form-section">
                <div className="section-header">
                  <Clock size={24} />
                  <h2>Schedule & Payment</h2>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="scheduled_time">Preferred Time (Optional)</label>
                    <input
                      type="datetime-local"
                      id="scheduled_time"
                      name="scheduled_time"
                      value={formData.scheduled_time}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="payment_method">Payment Method *</label>
                    <select
                      id="payment_method"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="cod">Cash on Delivery</option>
                      <option value="upi">UPI Payment</option>
                      <option value="card">Card Payment</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Special Instructions (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Any special requests or instructions for your order"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="place-order-btn"
                disabled={loading}
              >
                {loading ? (
                  'Placing Order...'
                ) : (
                  <>
                    <Check size={20} />
                    Place Order (₹{(calculateTotal() + (formData.order_type === 'delivery' ? 50 : 0)).toFixed(2)})
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <img src={item.image || '/placeholder.svg'} alt={item.name} />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <div className="quantity-controls">
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="qty-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="qty-btn"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="item-actions">
                    <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="remove-btn"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Delivery Fee</span>
                <span>{formData.order_type === 'delivery' ? '₹50.00' : '₹0.00'}</span>
              </div>
              <div className="total-row final-total">
                <span>Total</span>
                <span>₹{(calculateTotal() + (formData.order_type === 'delivery' ? 50 : 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;