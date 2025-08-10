"use client"

import { useState, useEffect } from "react"
import { Star, Plus, Heart } from "lucide-react"
import logo from "../assets/logo.jpeg"
import "./styles/Home.css"

const Home = () => {
  const [favorites, setFavorites] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?available=true')
        const result = await response.json()
        
        if (result.status === 'success') {
          // Transform backend data to match your frontend format
          const transformedItems = result.data.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: `₹${product.price}`,
            image: product.image_url, // This will be "/uploads/filename.jpg"
            category: product.category_name || 'Uncategorized',
            rating: 4.5 // You can add rating to your DB later
          }))
          setMenuItems(transformedItems)
        } else {
          setError('Failed to fetch products')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const toggleFavorite = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]))
  }

  return (
    <div className="home">
      {/* Hero Section - Keep as is */}
      <section id="home" className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Fresh • Delicious
                <span className="highlight">Sweet • Tasty</span>
              </h1>
              <p className="hero-description">
                Welcome to The Sugar Studio, where every dessert is crafted with love and the finest ingredients. From
                our signature cupcakes to artisanal parfaits, we bring you homemade sweetness that delights every sense.
              </p>
              <div className="hero-buttons">
                <button
                  className="btn-primary"
                  onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Explore Menu
                </button>
                <button className="btn-secondary">Order Online</button>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Happy Customers</span>
                </div>
                <div className="stat">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Sweet Creations</span>
                </div>
                <div className="stat">
                  <span className="stat-number">4.6</span>
                  <span className="stat-label">★ Rating</span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-image-container">
                <img
                  src={logo}
                  alt="Delicious desserts from The Sugar Studio"
                  className="hero-img"
                />
                <div className="floating-card">
                  <div className="card-content">
                    <span className="card-title">Fresh Daily</span>
                    <span className="card-subtitle">Made with ❤️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section - Updated */}
      <section id="menu" className="menu">
        <div className="menu-container">
          <div className="menu-header">
            <h2 className="menu-title">Our Sweet Menu</h2>
            <p className="menu-description">
              Discover our handcrafted desserts made fresh daily with premium ingredients
            </p>
          </div>

          {loading && <div className="loading">Loading delicious treats...</div>}
          {error && <div className="error">Error: {error}</div>}

          <div className="menu-grid">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-item">
                <div className="item-image-container">
                  <img 
                    src={item.image || "/placeholder.svg"} 
                    alt={item.name} 
                    className="item-image" 
                    onError={(e) => {
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                  <button
                    className={`favorite-btn ${favorites.includes(item.id) ? "active" : ""}`}
                    onClick={() => toggleFavorite(item.id)}
                  >
                    <Heart size={16} />
                  </button>
                  <div className="item-category">{item.category}</div>
                </div>

                <div className="item-content">
                  <div className="item-header">
                    <h3 className="item-name">{item.name}</h3>
                    <div className="item-rating">
                      <Star size={14} className="star-icon" />
                      <span>{item.rating}</span>
                    </div>
                  </div>

                  <p className="item-description">{item.description}</p>

                  <div className="item-footer">
                    <span className="item-price">{item.price}</span>
                    <button className="add-to-cart-btn">
                      <Plus size={16} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
