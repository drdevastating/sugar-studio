// frontend/src/components/CustomerLogin.jsx
import { useState } from 'react';
import { Phone, Mail, X, LogIn } from 'lucide-react';
import './styles/CustomerLogin.css';

const CustomerLogin = ({ onClose, onSuccess }) => {
  const [loginMethod, setLoginMethod] = useState('google'); // 'google' or 'phone'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [phoneData, setPhoneData] = useState({
    phone: '',
    otp: '',
    firstName: '',
    lastName: ''
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // In production, integrate Google OAuth
      // window.google.accounts.id.initialize({ ... })
      
      // For demo:
      const googleUser = {
        email: 'demo@example.com',
        name: 'Demo User',
        googleId: '123456789',
        picture: 'https://via.placeholder.com/150'
      };
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleUser)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        localStorage.setItem('customerToken', data.data.token);
        localStorage.setItem('customer', JSON.stringify(data.data.customer));
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneData.phone || phoneData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneData.phone })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setOtpSent(true);
        if (data.debug_otp) {
          alert(`Demo OTP: ${data.debug_otp}`);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phoneData)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        localStorage.setItem('customerToken', data.data.token);
        localStorage.setItem('customer', JSON.stringify(data.data.customer));
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Phone login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="login-header">
          <LogIn size={48} className="login-icon" />
          <h2>Welcome Back!</h2>
          <p>Sign in to track orders and get personalized recommendations</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="login-method-tabs">
          <button
            onClick={() => setLoginMethod('google')}
            className={`method-tab ${loginMethod === 'google' ? 'active' : ''}`}
          >
            <Mail size={16} />
            Google
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`method-tab ${loginMethod === 'phone' ? 'active' : ''}`}
          >
            <Phone size={16} />
            Phone
          </button>
        </div>

        {loginMethod === 'google' ? (
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="google-login-btn"
            >
              <Mail size={20} />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>
        ) : (
          <div className="phone-login-form">
            <div className="form-group">
              <label>Phone Number</label>
              <div className="phone-input-group">
                <input
                  type="tel"
                  value={phoneData.phone}
                  onChange={(e) => setPhoneData({ ...phoneData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="phone-input"
                />
                {!otpSent && (
                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="send-otp-btn"
                  >
                    Send OTP
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <>
                <div className="form-group">
                  <label>Enter OTP</label>
                  <input
                    type="text"
                    value={phoneData.otp}
                    onChange={(e) => setPhoneData({ ...phoneData, otp: e.target.value })}
                    placeholder="123456"
                    maxLength={6}
                    className="otp-input"
                  />
                </div>

                <div className="name-inputs">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={phoneData.firstName}
                      onChange={(e) => setPhoneData({ ...phoneData, firstName: e.target.value })}
                      placeholder="John"
                      className="text-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={phoneData.lastName}
                      onChange={(e) => setPhoneData({ ...phoneData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="text-input"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePhoneLogin}
                  disabled={loading}
                  className="verify-btn"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </>
            )}
          </div>
        )}

        <div className="skip-section">
          <button onClick={onClose} className="skip-btn">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;