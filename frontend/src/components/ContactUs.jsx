"use client"

import { MapPin, Phone, Clock, Mail, Send } from "lucide-react"
import { useState } from "react"
import "./styles/ContactUs.css"

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    console.log("Form submitted:", formData)
    alert("Thank you for your message! We'll get back to you soon.")
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    })
  }

  return (
    <div className="contact-us">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-container">
          <h1 className="contact-hero-title">Get in Touch</h1>
          <p className="contact-hero-description">
            We'd love to hear from you! Whether you have questions about our desserts, want to place a custom order, or
            just want to say hello.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="contact-info-section">
        <div className="contact-info-container">
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-icon">
                <MapPin size={32} />
              </div>
              <h3 className="contact-card-title">Visit Our Studio</h3>
              <p className="contact-card-text">
                123 Sweet Street
                <br />
                Bakery District
                <br />
                Sugar City, SC 12345
              </p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Phone size={32} />
              </div>
              <h3 className="contact-card-title">Call Us</h3>
              <p className="contact-card-text">
                Phone: (555) 123-CAKE
                <br />
                WhatsApp: (555) 123-4567
                <br />
                Fax: (555) 123-4568
              </p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Clock size={32} />
              </div>
              <h3 className="contact-card-title">Opening Hours</h3>
              <p className="contact-card-text">
                Mon - Fri: 7:00 AM - 8:00 PM
                <br />
                Saturday: 8:00 AM - 9:00 PM
                <br />
                Sunday: 9:00 AM - 6:00 PM
              </p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Mail size={32} />
              </div>
              <h3 className="contact-card-title">Email Us</h3>
              <p className="contact-card-text">
                info@thesugarstudio.com
                <br />
                orders@thesugarstudio.com
                <br />
                catering@thesugarstudio.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="contact-form-section">
        <div className="contact-form-container">
          <div className="contact-form-content">
            {/* Contact Form */}
            <div className="form-wrapper">
              <h2 className="form-title">Send Us a Message</h2>
              <p className="form-description">
                Have a question or want to place a custom order? Fill out the form below and we'll get back to you
                within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject" className="form-label">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="custom-order">Custom Order</option>
                      <option value="catering">Catering Services</option>
                      <option value="feedback">Feedback</option>
                      <option value="complaint">Complaint</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="form-textarea"
                    placeholder="Tell us about your inquiry, custom order details, or any questions you have..."
                  />
                </div>

                <button type="submit" className="submit-btn">
                  <Send size={20} />
                  Send Message
                </button>
              </form>
            </div>

            {/* Map Placeholder */}
            <div className="map-wrapper">
              <h3 className="map-title">Find Us</h3>
              <div className="map-placeholder">
                <img
                  src="/placeholder.svg?height=400&width=500"
                  alt="Map showing The Sugar Studio location"
                  className="map-image"
                />
                <div className="map-overlay">
                  <div className="map-marker">
                    <MapPin size={24} />
                  </div>
                  <p className="map-text">The Sugar Studio</p>
                </div>
              </div>
              <div className="map-info">
                <p className="map-description">
                  Located in the heart of the Bakery District, we're easily accessible by car or public transport. Free
                  parking is available in front of our studio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">Do you take custom orders?</h3>
              <p className="faq-answer">
                Yes! We love creating custom desserts for special occasions. Please contact us at least 48 hours in
                advance for custom orders.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Do you offer delivery?</h3>
              <p className="faq-answer">
                We offer delivery within a 10-mile radius of our studio. Delivery fees apply based on distance and order
                size.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Can you accommodate dietary restrictions?</h3>
              <p className="faq-answer">
                We offer gluten-free, vegan, and sugar-free options. Please mention your dietary needs when placing an
                order.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">How far in advance should I order?</h3>
              <p className="faq-answer">
                For regular items, same-day orders are usually fine. For custom cakes and large orders, we recommend 2-3
                days advance notice.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactUs
