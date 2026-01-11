// ============================================
// frontend/src/components/RecommendedProducts.jsx
import { useState, useEffect } from 'react';
import { Star, Plus, TrendingUp } from 'lucide-react';
import './styles/RecommendedProducts.css';

const RecommendedProducts = ({ customerId, onAddToCart }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchRecommendations();
    }
  }, [customerId]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations/${customerId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setRecommendations(data.data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!customerId || loading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="recommendations-section">
      <div className="recommendations-header">
        <TrendingUp size={28} className="recommendations-icon" />
        <div>
          <h2>Recommended Just For You</h2>
          <p>Based on your previous orders and preferences</p>
        </div>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((product) => (
          <div key={product.product_id} className="recommendation-card">
            <div className="recommendation-badge">
              <span>✨ Recommended</span>
            </div>
            
            <img 
              src={product.image_url || '/placeholder.svg'} 
              alt={product.product_name}
              className="recommendation-image"
            />
            
            <div className="recommendation-content">
              <span className="recommendation-category">{product.category_name}</span>
              <h3>{product.product_name}</h3>
              <p className="recommendation-reason">{product.recommendation_reason}</p>
              
              <div className="recommendation-footer">
                <span className="recommendation-price">₹{product.price}</span>
                <button 
                  onClick={() => onAddToCart(product)}
                  className="add-recommendation-btn"
                >
                  <Plus size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProducts;
