import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, LogIn, ArrowLeft } from 'lucide-react';

const UnifiedLoginModal = ({ onClose, onSuccess }) => {
  const [userType, setUserType] = useState(null);
  const [loginMethod, setLoginMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const googleInitialized = useRef(false);
  const googleButtonRef = useRef(null);

  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  // Cleanup Google button when component unmounts or method changes
  useEffect(() => {
    return () => {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
      googleInitialized.current = false;
    };
  }, [loginMethod]);

  const handleAdminLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailData.email,
          password: emailData.password
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        onSuccess(data.data, 'admin');
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerEmailAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/customer/register' : '/api/auth/customer/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('customer', JSON.stringify(data.data.customer));
        onSuccess(data.data, 'customer');
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleButton = () => {
    // Prevent multiple initializations
    if (googleInitialized.current || !googleButtonRef.current) {
      return;
    }

    if (!window.google) {
      setError('Google Sign-In is loading. Please wait and try again.');
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      setError('Google Sign-In is not configured.');
      console.error('Google Client ID is missing. Add VITE_GOOGLE_CLIENT_ID to your .env file');
      return;
    }

    try {
      googleInitialized.current = true;

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: false
      });

      // Clear any existing content
      googleButtonRef.current.innerHTML = '';

      // Render the button
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        { 
          theme: "outline", 
          size: "large",
          width: 350,
          text: "continue_with",
          shape: "rectangular"
        }
      );
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError('Failed to initialize Google Sign-In.');
      googleInitialized.current = false;
    }
  };

  // Initialize Google button when loginMethod becomes 'google'
  useEffect(() => {
    if (userType === 'customer' && loginMethod === null) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeGoogleButton();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userType, loginMethod]);

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError('');

    try {
      const userObject = JSON.parse(atob(response.credential.split('.')[1]));

      const authResponse = await fetch('/api/auth/customer/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userObject.email,
          name: userObject.name,
          googleId: userObject.sub,
          picture: userObject.picture
        })
      });

      const data = await authResponse.json();

      if (data.status === 'success') {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('customer', JSON.stringify(data.data.customer));
        onSuccess(data.data, 'customer');
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Google authentication error:', err);
      setError('Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUserType(null);
    setLoginMethod(null);
    setIsRegister(false);
    setError('');
    setEmailData({ email: '', password: '', first_name: '', last_name: '', phone: '' });
    googleInitialized.current = false;
    if (googleButtonRef.current) {
      googleButtonRef.current.innerHTML = '';
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      padding: '2rem',
      maxWidth: '500px',
      width: '100%',
      position: 'relative',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    closeBtn: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '0.5rem',
      borderRadius: '50%'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#6b7280'
    },
    userTypeButtons: {
      display: 'grid',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    userTypeBtn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1.5rem',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    methodBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem 1.5rem',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '1rem',
      fontWeight: '500',
      width: '100%'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.5rem',
      fontSize: '0.9rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem'
    },
    submitBtn: {
      width: '100%',
      background: 'linear-gradient(135deg, #d946a6, #c026d3)',
      color: 'white',
      border: 'none',
      padding: '1rem',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '1rem'
    },
    error: {
      background: '#fee2e2',
      color: '#dc2626',
      padding: '0.75rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '0.9rem'
    },
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      marginBottom: '1rem',
      padding: '0.5rem'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'center',
      margin: '1.5rem 0',
      color: '#6b7280'
    },
    googleButtonContainer: {
      display: 'flex',
      justifyContent: 'center',
      margin: '1rem 0'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        {/* Step 1: Select User Type */}
        {!userType && (
          <div>
            <div style={styles.header}>
              <LogIn size={48} style={{color: '#d946a6', margin: '0 auto 1rem'}} />
              <h2 style={styles.title}>Welcome to Sugar Studio</h2>
              <p style={styles.subtitle}>Please select how you'd like to continue</p>
            </div>

            <div style={styles.userTypeButtons}>
              <button
                style={{...styles.userTypeBtn, borderColor: '#d946a6'}}
                onClick={() => setUserType('customer')}
              >
                <User size={32} color="#d946a6" />
                <span style={{fontSize: '1.2rem', fontWeight: '600'}}>Customer Login</span>
                <small style={{color: '#6b7280'}}>Place orders & track deliveries</small>
              </button>

              <button
                style={{...styles.userTypeBtn, borderColor: '#3b82f6'}}
                onClick={() => { setUserType('admin'); setLoginMethod('email'); }}
              >
                <LogIn size={32} color="#3b82f6" />
                <span style={{fontSize: '1.2rem', fontWeight: '600'}}>Admin Login</span>
                <small style={{color: '#6b7280'}}>Manage store & orders</small>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Customer - Select Login Method */}
        {userType === 'customer' && !loginMethod && (
          <div>
            <button style={styles.backBtn} onClick={resetForm}>
              <ArrowLeft size={20} />
              Back
            </button>
            
            <div style={styles.header}>
              <h2 style={styles.title}>Customer Login</h2>
              <p style={styles.subtitle}>Choose your preferred login method</p>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {/* Google Sign-In Button Container */}
              <div 
                ref={googleButtonRef}
                style={styles.googleButtonContainer}
              />

              <div style={styles.divider}>
                <div style={{flex: 1, borderTop: '1px solid #e5e7eb'}}></div>
                <span style={{padding: '0 1rem'}}>OR</span>
                <div style={{flex: 1, borderTop: '1px solid #e5e7eb'}}></div>
              </div>

              <button style={styles.methodBtn} onClick={() => setLoginMethod('email')}>
                <Mail size={24} color="#d946a6" />
                <span>Email & Password</span>
              </button>
            </div>
          </div>
        )}

        {/* Admin Login Form */}
        {userType === 'admin' && (
          <div>
            <button style={styles.backBtn} onClick={resetForm}>
              <ArrowLeft size={20} />
              Back
            </button>

            <div style={styles.header}>
              <h2 style={styles.title}>Admin Login</h2>
              <p style={styles.subtitle}>Enter your credentials</p>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={emailData.password}
                onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <button style={styles.submitBtn} onClick={handleAdminLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        )}

        {/* Customer Email Login/Register */}
        {userType === 'customer' && loginMethod === 'email' && (
          <div>
            <button style={styles.backBtn} onClick={() => setLoginMethod(null)}>
              <ArrowLeft size={20} />
              Back
            </button>

            <div style={styles.header}>
              <h2 style={styles.title}>{isRegister ? 'Create Account' : 'Customer Login'}</h2>
              <p style={styles.subtitle}>{isRegister ? 'Register with email' : 'Login with your email'}</p>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {isRegister && (
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={emailData.first_name}
                    onChange={(e) => setEmailData({ ...emailData, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={emailData.last_name}
                    onChange={(e) => setEmailData({ ...emailData, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={emailData.password}
                onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone (Optional)</label>
                <input
                  style={styles.input}
                  type="tel"
                  value={emailData.phone}
                  onChange={(e) => setEmailData({ ...emailData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            )}

            <button style={styles.submitBtn} onClick={handleCustomerEmailAuth} disabled={loading}>
              {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Login')}
            </button>

            <div style={{textAlign: 'center', marginTop: '1rem', color: '#6b7280'}}>
              {isRegister ? (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setIsRegister(false)} style={{color: '#d946a6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'}}>
                    Login
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => setIsRegister(true)} style={{color: '#d946a6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'}}>
                    Register
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedLoginModal;