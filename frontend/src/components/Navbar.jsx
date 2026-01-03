// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import logo from "../assets/logo.jpeg"
import "./styles/Navbar.css"

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartItems, setCartItems] = useState(3) // Mock cart count
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      window.location.href = `/#${sectionId}`
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
          {isAuthenticated && (
            <Link to="/admin/dashboard" className="nav-link admin-link">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
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
          <button className="action-btn cart-btn">
            <div className="cart-icon-wrapper">
              <ShoppingCart size={20} />
              {cartItems > 0 && <span className="cart-badge">{cartItems}</span>}
            </div>
            <span className="btn-text">Cart</span>
          </button>
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
          {isAuthenticated && (
            <Link to="/admin/dashboard" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Dashboard
            </Link>
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
            <button className="mobile-action-btn">
              <ShoppingCart size={18} />
              Cart ({cartItems})
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar