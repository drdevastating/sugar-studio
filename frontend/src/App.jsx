// frontend/src/App.jsx - Fixed Admin Authentication Flow
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

  // Check for existing sessions on mount
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
    console.log('Login success:', type, data);
    
    if (type === 'customer') {
      setCustomer(data.customer);
      setShowLogin(false);
    } else if (type === 'admin') {
      setUser(data.user);
      setShowLogin(false);
      // Navigate to dashboard will be handled by the Login component
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

  // Protected Route Component
  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const accessToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    
    if (!accessToken || !savedUser) {
      return <Navigate to="/login" replace />;
    }

    if (requireAdmin) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.role !== 'admin' && userData.role !== 'staff') {
          return <Navigate to="/" replace />;
        }
      } catch (e) {
        console.error('Error parsing user for protected route:', e);
        return <Navigate to="/login" replace />;
      }
    }

    return children;
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
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products/new" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products/edit/:id" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute requireAdmin={true}>
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