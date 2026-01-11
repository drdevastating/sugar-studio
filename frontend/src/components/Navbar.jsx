// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import logo from "../assets/logo.jpeg"
import "./styles/Navbar.css"
import OrderHistory from './OrderHistory';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isStaff, logout } = useAuth()
  const { getCartCount } = useCart()
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const customer = JSON.parse(localStorage.getItem('customer') || 'null');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/")
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const cartCount = getCartCount()

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src={logo || "/placeholder.svg"} alt="The Sugar Studio" className="logo-image" />
          <div className="logo-text">
            <span className="studio-name">The Sugar Studio</span>
            <span className="studio-tagline">Homemade Dessert & Bakery</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          <button onClick={() => scrollToSection("home")} className="nav-link">
            Home
          </button>
          <button onClick={() => scrollToSection("menu")} className="nav-link">
            Menu
          </button>
          <Link to="/about" className="nav-link">
            About Us
          </Link>
          <Link to="/contact" className="nav-link">
            Contact Us
          </Link>
          <Link to="/track-order" className="nav-link">
            Track Order
          </Link>
          {isAuthenticated && isStaff && (
            <>
              <Link to="/admin/dashboard" className="nav-link admin-link">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link to="/admin/orders" className="nav-link admin-link">
                Orders
              </Link>
            </>
          )}
        </div>

        {/* Right Side Icons */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <div className="user-info">
                <User size={18} />
                <span>{user?.full_name}</span>
              </div>
              <button onClick={handleLogout} className="action-btn logout-action">
                <LogOut size={20} />
                <span className="btn-text">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="action-btn profile-btn">
              <User size={20} />
              <span className="btn-text">Login</span>
            </Link>
          )}
          <Link to="/checkout" className="action-btn cart-btn">
            <div className="cart-icon-wrapper">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
            <span className="btn-text">Cart</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <button onClick={() => scrollToSection("home")} className="mobile-nav-link">
            Home
          </button>
          <button onClick={() => scrollToSection("menu")} className="mobile-nav-link">
            Menu
          </button>
          <Link to="/about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            About Us
          </Link>
          <Link to="/contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Contact Us
          </Link>
          <Link to="/my-orders" className="nav-link">
            My Orders
          </Link>
          <Link to="/track-order" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Track Order
          </Link>
          {isAuthenticated && isStaff && (
            <>
              <Link to="/admin/dashboard" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/admin/orders" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Orders
              </Link>
            </>
          )}
          <div className="mobile-actions">
            {isAuthenticated ? (
              <>
                <div className="mobile-user-info">
                  <User size={16} />
                  {user?.full_name}
                </div>
                <button onClick={handleLogout} className="mobile-action-btn logout-mobile">
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="mobile-action-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <User size={18} />
                Login
              </Link>
            )}
            <Link to="/checkout" className="mobile-action-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <ShoppingCart size={18} />
              Cart ({cartCount})
            </Link>
          </div>
          {customer && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowOrderHistory(!showOrderHistory)}
                className="action-btn"
              >
                <Package size={20} />
                <span className="btn-text">My Orders</span>
              </button>
              
              {showOrderHistory && (
                <OrderHistory 
                  customerId={customer.id}
                  onNavigateToOrder={(orderNum) => {
                    if (orderNum) {
                      navigate(`/track-order/${orderNum}`);
                    } else {
                      navigate('/my-orders');
                    }
                    setShowOrderHistory(false);
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar