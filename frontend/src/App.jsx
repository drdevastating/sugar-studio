// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Home from "./components/Home"
import AboutUs from "./components/AboutUs"
import ContactUs from "./components/ContactUs"
import Login from "./components/Login"
import AdminDashboard from "./components/AdminDashboard"
import ProductForm from "./components/ProductForm"
import AdminOrders from "./components/AdminOrders"
import Checkout from "./components/Checkout"
import OrderTracking from "./components/OrderTracking"
import OrderConfirmation from "./components/OrderConfirmation"
import CustomerOrders from "./components/CustomerOrders"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/track-order/:orderNumber" element={<OrderTracking />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/edit/:id" element={<ProductForm />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/track-order/:orderNumber" element={<OrderTracking />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App