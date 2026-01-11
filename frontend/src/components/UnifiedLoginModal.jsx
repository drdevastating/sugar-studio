import { useState } from 'react';
import { X, User, Mail, LogIn, ArrowLeft } from 'lucide-react';

const UnifiedLoginModal = ({ onClose, onSuccess }) => {
  const [userType, setUserType] = useState(null);
  const [loginMethod, setLoginMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

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

  const handleGoogleLogin = () => {
    // Initialize Google Sign-In
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleCallback
      });
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In not loaded. Please refresh and try again.');
    }
  };

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError('');

    try {
      // Decode the JWT credential
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
    googleBtn: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '1rem',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      color: '#374151'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'center',
      margin: '1.5rem 0',
      color: '#6b7280'
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

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <button 
                style={{...styles.googleBtn, borderColor: '#4285f4'}} 
                onClick={handleGoogleLogin}
              >
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                  <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                  <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                  <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
                </svg>
                Continue with Google
              </button>

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