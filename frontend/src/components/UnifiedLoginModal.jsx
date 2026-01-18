// frontend/src/components/UnifiedLoginModal.jsx - FIXED for Production Google Auth
import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, LogIn, ArrowLeft } from 'lucide-react';
import { getApiUrl } from '../config/api';

const UnifiedLoginModal = ({ onClose, onSuccess }) => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
      googleInitialized.current = false;
    };
  }, []);

  const handleCustomerEmailAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/customer/register' : '/api/auth/customer/login';
      const response = await fetch(getApiUrl(endpoint), {
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
      console.error('Email auth error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCallback = async (response) => {
    console.log('🔵 Google callback triggered');
    setLoading(true);
    setError('');

    try {
      // Decode JWT token to get user info
      const userObject = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('📧 User email:', userObject.email);

      const authResponse = await fetch(getApiUrl('/api/auth/customer/google'), {
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
      console.log('✅ Backend response:', data);

      if (data.status === 'success') {
        // Store auth data
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('customer', JSON.stringify(data.data.customer));
        
        console.log('✅ Auth data stored, calling onSuccess');
        
        // Call success callback
        onSuccess(data.data, 'customer');
        
        // Close modal
        onClose();
      } else {
        console.error('❌ Backend error:', data.message);
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('❌ Google authentication error:', err);
      setError('Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleButton = () => {
    if (googleInitialized.current || !googleButtonRef.current) {
      console.log('⚠️ Google already initialized or ref not ready');
      return;
    }

    if (!window.google) {
      console.log('⚠️ Google SDK not loaded yet');
      setError('Google Sign-In is loading. Please wait...');
      
      // Retry after 1 second
      setTimeout(() => {
        if (window.google && !googleInitialized.current) {
          initializeGoogleButton();
        }
      }, 1000);
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    console.log('🔑 Client ID:', clientId ? '✅ Set' : '❌ Missing');

    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      setError('Google Sign-In is not configured. Please contact support.');
      console.error('❌ VITE_GOOGLE_CLIENT_ID is missing in environment variables');
      return;
    }

    try {
      console.log('🔧 Initializing Google Sign-In...');
      googleInitialized.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup' // Use popup mode for better reliability
      });

      // Clear any existing content
      googleButtonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        { 
          theme: "outline", 
          size: "large",
          width: 350,
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left"
        }
      );

      console.log('✅ Google button rendered successfully');
    } catch (err) {
      console.error('❌ Google Sign-In initialization error:', err);
      setError('Failed to initialize Google Sign-In. Please refresh and try again.');
      googleInitialized.current = false;
    }
  };

  // Initialize Google button when modal opens
  useEffect(() => {
    if (!loginMethod && googleButtonRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeGoogleButton();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loginMethod]);

  const resetForm = () => {
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
      margin: '1rem 0',
      minHeight: '44px' // Reserve space for button
    },
    debugInfo: {
      background: '#f3f4f6',
      padding: '0.5rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      color: '#6b7280',
      marginTop: '1rem'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        {!loginMethod && (
          <div>
            <div style={styles.header}>
              <LogIn size={48} style={{color: '#d946a6', margin: '0 auto 1rem'}} />
              <h2 style={styles.title}>Customer Login</h2>
              <p style={styles.subtitle}>Sign in to your account</p>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div 
                ref={googleButtonRef}
                style={styles.googleButtonContainer}
              />

              {/* Debug info - remove in production */}
              {import.meta.env.DEV && (
                <div style={styles.debugInfo}>
                  Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set'}<br/>
                  Google SDK: {window.google ? '✅ Loaded' : '❌ Not loaded'}<br/>
                  Initialized: {googleInitialized.current ? '✅ Yes' : '❌ No'}
                </div>
              )}

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

            <div style={{textAlign: 'center', marginTop: '1.5rem', color: '#6b7280', fontSize: '0.9rem'}}>
              <p>
                Are you an admin?{' '}
                <a href="/login" style={{color: '#d946a6', textDecoration: 'underline'}}>
                  Admin Login
                </a>
              </p>
            </div>
          </div>
        )}

        {loginMethod === 'email' && (
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