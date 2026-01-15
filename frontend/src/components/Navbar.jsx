// frontend/src/components/Navbar.jsx - Fixed to show proper user info
import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Package } from "lucide-react"
import { useCart } from "../context/CartContext"
import logo from "../assets/logo.jpeg"
import "./styles/Navbar.css"

const Navbar = ({ customer, user, onShowLogin, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { getCartCount } = useCart()

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
    onLogout()
    setIsMobileMenuOpen(false)
    navigate('/')
  }

  const cartCount = getCartCount()
  const isAuthenticated = customer || user
  const isAdmin = user?.role === 'admin' || user?.role === 'staff'

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="The Sugar Studio" className="logo-image" />
          <div className="logo-text">
            <span className="studio-name">The Sugar Studio</span>
            <span className="studio-tagline">Homemade Dessert & Bakery</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          {!isAdmin ? (
            <>
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
              
              {/* Customer-only links */}
              {customer && (
                <Link to="/my-orders" className="nav-link">
                  My Orders
                </Link>
              )}
            </>
          ) : (
            <>
              {/* Admin-only links */}
              <Link to="/admin/dashboard" className="nav-link admin-link">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link to="/admin/orders" className="nav-link admin-link">
                <Package size={16} />
                Orders
              </Link>
              <Link to="/" className="nav-link">
                View Store
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
                <span>
                  {customer 
                    ? `${customer.first_name} ${customer.last_name}` 
                    : user?.full_name}
                </span>
                {isAdmin && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {user?.role?.toUpperCase()}
                  </span>
                )}
              </div>
              <button onClick={handleLogout} className="action-btn logout-action">
                <LogOut size={20} />
                <span className="btn-text">Logout</span>
              </button>
            </>
          ) : (
            <button onClick={onShowLogin} className="action-btn profile-btn">
              <User size={20} />
              <span className="btn-text">Login</span>
            </button>
          )}
          
          {/* Show cart only for customers and guests, not for admin */}
          {!isAdmin && (
            <Link to="/checkout" className="action-btn cart-btn">
              <div className="cart-icon-wrapper">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
              <span className="btn-text">Cart</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {!isAdmin ? (
            <>
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
              <Link to="/track-order" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Track Order
              </Link>
              
              {customer && (
                <Link to="/my-orders" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  <Package size={16} />
                  My Orders
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/admin/dashboard" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link to="/admin/orders" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <Package size={16} />
                Orders
              </Link>
              <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                View Store
              </Link>
            </>
          )}

          <div className="mobile-actions">
            {isAuthenticated ? (
              <>
                <div className="mobile-user-info">
                  <User size={16} />
                  {customer ? `${customer.first_name} ${customer.last_name}` : user?.full_name}
                  {isAdmin && (
                    <span style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.7rem'
                    }}>
                      {user?.role?.toUpperCase()}
                    </span>
                  )}
                </div>
                <button onClick={handleLogout} className="mobile-action-btn logout-mobile">
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => { onShowLogin(); setIsMobileMenuOpen(false); }} className="mobile-action-btn">
                <User size={18} />
                Login
              </button>
            )}
            
            {!isAdmin && (
              <Link to="/checkout" className="mobile-action-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <ShoppingCart size={18} />
                Cart ({cartCount})
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar