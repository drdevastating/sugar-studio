"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { ShoppingCart, User, Menu, X } from "lucide-react"
import logo from "../assets/logo.jpeg"
import "./styles/Navbar.css"

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartItems, setCartItems] = useState(3) // Mock cart count
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      // If not on home page, navigate to home first
      window.location.href = `/#${sectionId}`
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
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
        </div>

        {/* Right Side Icons */}
        <div className="navbar-actions">
          <button className="action-btn profile-btn">
            <User size={20} />
            <span className="btn-text">Profile</span>
          </button>
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
          <div className="mobile-actions">
            <button className="mobile-action-btn">
              <User size={18} />
              Profile
            </button>
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
