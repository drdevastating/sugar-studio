// frontend/src/App.jsx - FIXED: No more flickering
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
  const [authLoading, setAuthLoading] = useState(true);

  // FIXED: Load auth state once on mount - no flickering
  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (savedCustomer && accessToken) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {
        console.error('Error parsing customer:', e);
        localStorage.removeItem('customer');
      }
    }

    if (savedUser && accessToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
        localStorage.removeItem('user');
      }
    }

    setAuthLoading(false);
  }, []);

  // Token refresh - only runs once per hour
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
          handleLogout();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    };

    // Refresh token every 50 minutes
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (data, type) => {
    console.log('Login success:', type, data);
    
    if (type === 'customer') {
      setCustomer(data.customer);
      setShowLogin(false);
    } else if (type === 'admin') {
      setUser(data.user);
      setShowLogin(false);
    }
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    setCustomer(null);
    setUser(null);
    localStorage.removeItem('customer');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // FIXED: Simple protected route - checks once, no re-renders
  const ProtectedRoute = ({ children }) => {
    const accessToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    
    if (!accessToken || !savedUser) {
      return <Navigate to="/login" replace />;
    }

    try {
      const userData = JSON.parse(savedUser);
      if (userData.role !== 'admin' && userData.role !== 'staff') {
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      console.error('Error parsing user for protected route:', e);
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

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
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/track-order/:orderNumber" element={<OrderTracking />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/customer/orders" element={<CustomerOrders customer={customer} />} />
            <Route path="/my-orders" element={<CustomerOrders customer={customer} />} />
            
            {/* Admin Routes - Protected */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products/new" 
              element={
                <ProtectedRoute>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products/edit/:id" 
              element={
                <ProtectedRoute>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute>
                  <AdminOrders />
                </ProtectedRoute>
              } 
            />
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