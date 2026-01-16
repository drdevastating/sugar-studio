// frontend/src/components/AdminOrders.jsx - FIXED: Working order management
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Filter, Eye, Check, X, ArrowLeft } from 'lucide-react';
import './styles/AdminOrders.css';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // FIXED: Only check auth once on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (!accessToken || !savedUser) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      if (userData.role !== 'admin' && userData.role !== 'staff') {
        navigate('/login', { replace: true });
        return;
      }
    } catch (e) {
      console.error('Error parsing user:', e);
      navigate('/login', { replace: true });
      return;
    }

    fetchOrders();
  }, [statusFilter]); // Re-fetch when filter changes

  const fetchOrders = async () => {
    const token = localStorage.getItem('accessToken');
    
    try {
      setError('');
      const url = statusFilter === 'all' 
        ? '/api/orders' 
        : `/api/orders?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setOrders(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
        console.error('Failed to fetch orders:', data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setSelectedOrder(data.data);
      } else {
        alert('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to fetch order details');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('accessToken');
    setUpdating(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Update order in list
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Update selected order
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        alert('✅ Order status updated successfully! Customer has been notified via email.');
      } else {
        alert('❌ Failed to update: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('❌ Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'preparing': 'status-preparing',
      'ready': 'status-ready',
      'out_for_delivery': 'status-delivery',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return colors[status] || 'status-default';
  };

  const getNextStatus = (currentStatus, orderType) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': orderType === 'delivery' ? 'out_for_delivery' : 'delivered',
      'out_for_delivery': 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="orders-container">
          <div className="loading">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <div>
            <button 
              onClick={() => navigate('/admin/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'white',
                border: '1px solid #e5e7eb',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '1rem',
                color: '#374151'
              }}
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1>Order Management</h1>
            <p>Manage and track all customer orders</p>
          </div>
          <div className="header-actions">
            <div className="filter-group">
              <Filter size={20} />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Orders Grid */}
        <div className="orders-content">
          {/* Orders List */}
          <div className="orders-list">
            {orders.length === 0 ? (
              <div className="no-orders">
                <Package size={60} />
                <p>No orders found</p>
                {statusFilter !== 'all' && (
                  <button 
                    onClick={() => setStatusFilter('all')}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: '#ec4899',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Show All Orders
                  </button>
                )}
              </div>
            ) : (
              orders.map(order => (
                <div 
                  key={order.id} 
                  className={`order-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
                  onClick={() => fetchOrderDetails(order.id)}
                >
                  <div className="order-card-header">
                    <div>
                      <h3>#{order.order_number}</h3>
                      <p className="order-customer">{order.first_name} {order.last_name}</p>
                    </div>
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="order-card-body">
                    <div className="order-info-item">
                      <Package size={16} />
                      <span>{order.item_count} items</span>
                    </div>
                    <div className="order-info-item">
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    <div className="order-info-item">
                      <span className="order-type-badge">
                        {order.order_type === 'pickup' ? '📦 Pickup' : '🚚 Delivery'}
                      </span>
                    </div>
                  </div>
                  <div className="order-card-footer">
                    <span className="order-total">₹{order.total_amount}</span>
                    <button className="view-btn">
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Details Panel */}
          {selectedOrder && (
            <div className="order-details-panel">
              <div className="panel-header">
                <h2>Order Details</h2>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="panel-content">
                {/* Order Info */}
                <div className="detail-section">
                  <h3>Order Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Order Number</span>
                      <span className="value">{selectedOrder.order_number}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Status</span>
                      <span className={`value status-badge ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Order Type</span>
                      <span className="value">
                        {selectedOrder.order_type === 'pickup' ? '📦 Pickup' : '🚚 Delivery'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Payment Method</span>
                      <span className="value">{selectedOrder.payment_method?.toUpperCase() || 'COD'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Total Amount</span>
                      <span className="value amount">₹{selectedOrder.total_amount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Order Date</span>
                      <span className="value">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div className="special-notes">
                      <strong>Special Notes:</strong>
                      <p>{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Name</span>
                      <span className="value">{selectedOrder.first_name} {selectedOrder.last_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email</span>
                      <span className="value">{selectedOrder.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Phone</span>
                      <span className="value">{selectedOrder.phone}</span>
                    </div>
                    {selectedOrder.delivery_address && (
                      <div className="detail-item full-width">
                        <span className="label">Delivery Address</span>
                        <span className="value">{selectedOrder.delivery_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="detail-section">
                  <h3>Order Items</h3>
                  <div className="items-list">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="item-row">
                        <img src={item.image_url || '/placeholder.svg'} alt={item.product_name} />
                        <div className="item-info">
                          <h4>{item.product_name}</h4>
                          <p>₹{item.unit_price} × {item.quantity}</p>
                          {item.special_instructions && (
                            <p className="item-instructions">Note: {item.special_instructions}</p>
                          )}
                        </div>
                        <span className="item-total">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Actions */}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <div className="detail-section">
                    <h3>Update Order Status</h3>
                    <div className="status-actions">
                      {getNextStatus(selectedOrder.status, selectedOrder.order_type) && (
                        <button
                          className="status-action-btn advance"
                          onClick={() => updateOrderStatus(
                            selectedOrder.id, 
                            getNextStatus(selectedOrder.status, selectedOrder.order_type)
                          )}
                          disabled={updating}
                        >
                          <Check size={20} />
                          {updating ? 'Updating...' : `Mark as ${getNextStatus(selectedOrder.status, selectedOrder.order_type).replace('_', ' ')}`}
                        </button>
                      )}
                      {selectedOrder.status !== 'cancelled' && (
                        <button
                          className="status-action-btn cancel"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this order?')) {
                              updateOrderStatus(selectedOrder.id, 'cancelled');
                            }
                          }}
                          disabled={updating}
                        >
                          <X size={20} />
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;