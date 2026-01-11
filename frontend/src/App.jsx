// frontend/src/App.jsx - Updated with JWT Auth
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import AboutUs from "./components/AboutUs";
import ContactUs from "./components/ContactUs";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import ProductForm from "./components/ProductForm";
import AdminOrders from "./components/AdminOrders";
import Checkout from "./components/Checkout";
import OrderTracking from "./components/OrderTracking";
import OrderConfirmation from "./components/OrderConfirmation";
import CustomerOrders from "./components/CustomerOrders";
import UnifiedLoginModal from './components/UnifiedLoginModal';
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [user, setUser] = useState(null);

  // Check for existing sessions on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (savedCustomer && accessToken) {
      setCustomer(JSON.parse(savedCustomer));
    }

    if (savedUser && accessToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Refresh token mechanism
  useEffect(() => {
    const refreshToken = async () => {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) return;

      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refreshTokenValue })
        });

        const data = await response.json();

        if (data.status === 'success') {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
        } else {
          // Token refresh failed, logout
          handleLogout();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        handleLogout();
      }
    };

    // Refresh token every 50 minutes (tokens expire in 1 hour)
    const interval = setInterval(refreshToken, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (data, type) => {
    if (type === 'customer') {
      setCustomer(data.customer);
    } else if (type === 'admin') {
      setUser(data.user);
    }
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    // Clear all auth data
    setCustomer(null);
    setUser(null);
    localStorage.removeItem('customer');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar 
            customer={customer}
            user={user}
            onShowLogin={() => setShowLogin(true)}
            onLogout={handleLogout}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/track-order/:orderNumber" element={<OrderTracking />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/customer/orders" element={<CustomerOrders customer={customer} />} />
            <Route path="/my-orders" element={<CustomerOrders customer={customer} />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/edit/:id" element={<ProductForm />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Routes>
          
          {showLogin && (
            <UnifiedLoginModal
              onClose={() => setShowLogin(false)}
              onSuccess={handleLoginSuccess}
            />
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;