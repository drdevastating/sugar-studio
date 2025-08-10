import { Heart, Award, Users, Clock } from "lucide-react"
import "./styles/AboutUs.css"
import chefPhoto from '../assets/chef-photo.jpeg';


const AboutUs = () => {
  const values = [
    {
      icon: <Heart className="value-icon" />,
      title: "Made with Love",
      description:
        "Every dessert is crafted with passion and care, using family recipes passed down through generations.",
    },
    {
      icon: <Award className="value-icon" />,
      title: "Quality Ingredients",
      description: "We source only the finest, freshest ingredients to ensure every bite is a delightful experience.",
    },
    {
      icon: <Users className="value-icon" />,
      title: "Community First",
      description: "We're proud to be part of this community, creating sweet memories for families and friends.",
    },
    {
      icon: <Clock className="value-icon" />,
      title: "Fresh Daily",
      description: "Our bakers start early every morning to ensure everything is fresh and ready for our customers.",
    },
  ]

  return (
    <div className="about-us">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">Our Sweet Story</h1>
            <p className="about-hero-description">
              Welcome to The Sugar Studio, where passion meets perfection in every handcrafted dessert
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="story-container">
          <div className="story-content">
            <div className="story-text">
              <h2 className="story-title">From Dream to Reality</h2>
              <p className="story-paragraph">
               Hi, I’m Samiksha — once a practicing lawyer in Canada, now a passionate baker in India. 
               In 2022, I made a bold decision to return to my roots and follow my heart. 
               Baking had always been a quiet passion, and as soon as I came back, 
               I immersed myself in professional baking courses to master the art and science of it. 
               That’s when The Sugar Studio was born — a fully vegetarian, 
               homegrown bakery specializing in eggless delights. 
               From melt-in-your-mouth brownies and velvety cheesecakes to fresh breads, pastas, Korean cream cheese buns, and festive garlic knots, every product is handcrafted with care. 
               Over time, my creations gained love at local Christmas and Diwali pop-ups, where people returned year after year for their favorite treats. 
               My sugar-free desserts have also found a special place among health-conscious food lovers. 
               Today, I continue to grow The Sugar Studio with a dream to expand into new markets and share the joy of pure, heartfelt baking with many more.
              </p>
              <p className="story-paragraph">
                Founded in 2022, we've been dedicated to bringing you the finest homemade desserts using traditional
                techniques combined with modern creativity. Every cupcake, parfait, and pastry tells a story of
                craftsmanship and care.
              </p>
              <p className="story-paragraph">
                Today, we're proud to serve our community with fresh, delicious, sweet, and tasty creations that bring
                joy to every celebration and everyday moment.
              </p>
            </div>
            <div className="story-image">
              <img
                src={chefPhoto} 
                alt="The Sugar Studio bakery interior"
                className="story-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="values-container">
          <h2 className="values-title">What We Stand For</h2>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon-container">{value.icon}</div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      {/* <section className="team-section">
        <div className="team-container">
          <h2 className="team-title">Meet Our Sweet Team</h2>
          <p className="team-description">The talented bakers and artists behind every delicious creation</p>
          <div className="team-grid">
            {team.map((member, index) => (
              <div key={index} className="team-card">
                <div className="team-image-container">
                  <img src={member.image || "/placeholder.svg"} alt={member.name} className="team-image" />
                </div>
                <div className="team-info">
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  <p className="team-description">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">3+</span>
              <span className="stat-label">Years of Excellence</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Unique Creations</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Made Fresh Daily</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutUs
