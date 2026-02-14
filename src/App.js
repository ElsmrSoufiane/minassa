// App.js - Arabic version with French dates only
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

// API configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dij7fqfot';
const CLOUDINARY_UPLOAD_PRESET = 'soufiane';

// French date formatter (kept in French)
const formatDateFrench = (dateString) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return 'Date inconnue';
  }
};

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationChecked, setVerificationChecked] = useState(false);

  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في الطلب');
      }
      
      return data;
    } catch (error) {
      console.error('خطأ في طلب API:', error);
      throw error;
    }
  }, []);

  const uploadImage = useCallback(async (file) => {
    if (!file) return null;

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      data.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: data,
        }
      );

      const result = await response.json();
      return result.secure_url;
    } catch (error) {
      console.error('فشل التحميل:', error);
      return null;
    }
  }, []);

  const checkVerificationStatus = useCallback(async (email) => {
    try {
      const response = await apiRequest('/check-verification', {
        method: 'POST',
        body: { email }
      });
      
      if (response.success) {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          userData.verified = response.data.verified;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('خطأ في التحقق من التوثيق:', error);
    } finally {
      setVerificationChecked(true);
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      checkVerificationStatus(parsedUser.email);
    } else {
      setVerificationChecked(true);
      setLoading(false);
    }
  }, [checkVerificationStatus]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await apiRequest('/login', {
        method: 'POST',
        body: { email, password }
      });
      
      if (response && response.user) {
        const userData = response.user;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        await checkVerificationStatus(email);
        
        return { success: true, data: userData };
      }
      return { success: false, error: 'استجابة غير صالحة' };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'فشل تسجيل الدخول' 
      };
    }
  }, [apiRequest, checkVerificationStatus]);

  const register = useCallback(async (userData) => {
    try {
      const response = await apiRequest('/register', {
        method: 'POST',
        body: userData
      });
      
      if (response.user) {
        const loginResult = await login(userData.email, userData.password);
        return loginResult;
      }
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'فشل التسجيل'
      };
    }
  }, [apiRequest, login]);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    setVerificationChecked(false);
  }, []);

  const refreshVerification = useCallback(async () => {
    if (user?.email) {
      await checkVerificationStatus(user.email);
    }
  }, [user, checkVerificationStatus]);

  const getCustomers = useCallback(async () => {
    return apiRequest('/customers');
  }, [apiRequest]);

  const addCustomer = useCallback(async (customerData) => {
    if (!customerData.user_id) {
      console.error('user_id مفقود');
      throw new Error('معرف المستخدم مطلوب');
    }
    
    return apiRequest('/customers', {
      method: 'POST',
      body: customerData
    });
  }, [apiRequest]);

  const updateCustomer = useCallback(async (id, data) => {
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: data
    });
  }, [apiRequest]);

  const deleteCustomer = useCallback(async (id) => {
    return apiRequest(`/customers/${id}`, {
      method: 'DELETE'
    });
  }, [apiRequest]);

  const sendVerificationEmail = useCallback(async (data) => {
    return apiRequest('/send-verification-email', {
      method: 'POST',
      body: data
    });
  }, [apiRequest]);

  const forgotPassword = useCallback(async (email) => {
    return apiRequest('/forgot-password', {
      method: 'POST',
      body: { email }
    });
  }, [apiRequest]);

  const resetPassword = useCallback(async (email, token, password, passwordConfirmation) => {
    return apiRequest('/reset-password', {
      method: 'POST',
      body: { 
        email, 
        token, 
        password, 
        password_confirmation: passwordConfirmation 
      }
    });
  }, [apiRequest]);

  const verifyResetToken = useCallback(async (email, token) => {
    return apiRequest('/verify-reset-token', {
      method: 'POST',
      body: { email, token }
    });
  }, [apiRequest]);

  const checkEmailExists = useCallback(async (email) => {
    return apiRequest('/check-email', {
      method: 'POST',
      body: { email }
    });
  }, [apiRequest]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading, 
      verificationChecked,
      refreshVerification,
      forgotPassword,
      resetPassword,
      verifyResetToken,
      checkEmailExists,
      api: {
        getCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        sendVerificationEmail,
        uploadImage,
        checkVerification: (email) => apiRequest('/check-verification', {
          method: 'POST',
          body: { email }
        })
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

const ProtectedRoute = ({ children, requireVerification = false, requireLogin = false }) => {
  const { user, loading, verificationChecked } = useAuth();

  if (loading || !verificationChecked) {
    return <div className="loading-spinner"></div>;
  }
  
  if (requireLogin && !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerification && !user.verified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

// Theme Context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`app ${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

// Custom Dropdown Component
const CustomDropdown = ({ buttonContent, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown position-relative">
      <button 
        className="btn btn-outline-primary dropdown-toggle" 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {buttonContent}
      </button>
      {isOpen && (
        <div className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border" style={{zIndex: 1000, minWidth: '200px'}}>
          {children}
        </div>
      )}
    </div>
  );
};

// Navbar Component with Profile Picture and Bigger Logo - ARABIC VERSION
const NavbarComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const profilePicture = user?.pictures || user?.profile_picture || null;

  return (
    <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'} shadow-sm`}>
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/" style={{ gap: '15px' }}>
          <img 
            src="/logo.png" 
            alt="شعار المنصة" 
       style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '15px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease'
        }}
           onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML += `
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #4361ee, #7209b7); color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: bold; font-size: 24px;">
                  📱
                </div>
              `;
            }}
          />
    
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link active" to="/" onClick={() => setMobileMenuOpen(false)}>الرئيسية</Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-outline-secondary"
              onClick={toggleTheme}
              style={{ 
                background: theme === 'light' ? '#1e293b' : '#f8fafc',
                color: theme === 'light' ? '#fff' : '#1e293b',
                borderRadius: '8px'
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {user ? (
              <>
                {!user.verified && (
                  <Link to="/verify-email" className="btn btn-warning btn-sm">
                    <span>✉️</span> توثيق البريد
                  </Link>
                )}
                <CustomDropdown
                  buttonContent={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt={user.name}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #4361ee'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4361ee, #7209b7)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                      )}
                      <span>{user.name || 'مستخدم'}</span>
                    </div>
                  }
                >
                  <ul className="list-unstyled m-0 p-2">
                    <li>
                      <button 
                        className="dropdown-item w-100 text-start"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        style={{ 
                          background: '#ef4444',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          border: 'none',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      >
                        <span>🚪</span> تسجيل الخروج
                      </button>
                    </li>
                  </ul>
                </CustomDropdown>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-primary">
                  تسجيل الدخول
                </Link>
                <Link to="/register" className="btn btn-primary">
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Login Component - ARABIC VERSION
const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, [formData.email, formData.password, login, navigate]);

  return (
    <div className="main">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h2>تسجيل الدخول</h2>
            <p>مرحباً بعودتك! يرجى إدخال بياناتك</p>
          </div>
          
          {error && (
            <div className="error-message" style={{ 
              background: theme === 'light' ? '#fee2e2' : '#450a0a',
              color: theme === 'light' ? '#991b1b' : '#fecaca'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
                style={{ 
                  background: theme === 'light' ? '#fff' : '#1e293b',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  borderColor: theme === 'light' ? '#e2e8f0' : '#475569'
                }}
              />
            </div>
            
            <div className="input-group">
              <label>كلمة المرور</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="أدخل كلمة المرور"
                style={{ 
                  background: theme === 'light' ? '#fff' : '#1e293b',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  borderColor: theme === 'light' ? '#e2e8f0' : '#475569'
                }}
              />
            </div>
            
            <div className="forgot-password-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/forgot-password" style={{ color: '#4361ee', fontSize: '0.9rem' }}>
                نسيت كلمة المرور؟
              </Link>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="login-btn"
              style={{ 
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4361ee, #7209b7)',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'white'
              }}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              ليس لديك حساب؟ <Link to="/register" style={{ color: '#4361ee' }}>إنشاء حساب</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Forgot Password Component - ARABIC VERSION
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await forgotPassword(email);
      setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    } catch (error) {
      setError(error.message || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  }, [email, forgotPassword]);

  return (
    <div className="main">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔑</div>
            <h2>نسيت كلمة المرور</h2>
            <p>أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
          </div>
          
          {message && (
            <div className="success-message" style={{ 
              background: '#d1fae5',
              color: '#065f46',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {message}
            </div>
          )}
          
          {error && (
            <div className="error-message" style={{ 
              background: '#fee2e2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>البريد الإلكتروني *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                style={{ 
                  background: theme === 'light' ? '#fff' : '#1e293b',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  borderColor: theme === 'light' ? '#e2e8f0' : '#475569'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="login-btn"
              style={{ 
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4361ee, #7209b7)',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'white'
              }}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              <Link to="/login" style={{ color: '#4361ee' }}>
                العودة لتسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reset Password Component - ARABIC VERSION
const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { resetPassword, verifyResetToken } = useAuth();

  // Get token and email from URL
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');
  const email = queryParams.get('email');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setTokenValid(false);
        setError('رابط غير صالح');
        return;
      }

      try {
        const response = await verifyResetToken(email, token);
        setTokenValid(response.valid);
        if (!response.valid) {
          setError('رابط إعادة التعيين منتهي الصلاحية أو غير صالح');
        }
      } catch (err) {
        setTokenValid(false);
        setError('فشل التحقق من الرابط');
      }
    };

    verifyToken();
  }, [token, email, verifyResetToken]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email, token, password, confirmPassword);
      setMessage('تم إعادة تعيين كلمة المرور بنجاح! جاري التحويل...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'فشل إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, email, token, resetPassword, navigate]);

  if (tokenValid === null) {
    return (
      <div className="main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="loading-spinner"></div>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>جاري التحقق من الرابط...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-icon" style={{ color: '#ef4444' }}>❌</div>
              <h2>رابط غير صالح</h2>
              <p>{error || 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية'}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link to="/forgot-password" className="view-btn" style={{ 
                background: 'linear-gradient(135deg, #4361ee, #7209b7)',
                display: 'inline-block',
                textDecoration: 'none',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px'
              }}>
                طلب رابط جديد
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h2>إعادة تعيين كلمة المرور</h2>
            <p>أدخل كلمة المرور الجديدة</p>
          </div>
          
          {message && (
            <div className="success-message" style={{ 
              background: '#d1fae5',
              color: '#065f46',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {message}
            </div>
          )}
          
          {error && (
            <div className="error-message" style={{ 
              background: '#fee2e2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>كلمة المرور الجديدة *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8 أحرف على الأقل"
                style={{ 
                  background: theme === 'light' ? '#fff' : '#1e293b',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  borderColor: theme === 'light' ? '#e2e8f0' : '#475569'
                }}
              />
              <small style={{ color: '#64748b', fontSize: '0.85rem' }}>8 أحرف على الأقل</small>
            </div>
            
            <div className="input-group">
              <label>تأكيد كلمة المرور *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="أعد إدخال كلمة المرور"
                style={{ 
                  background: theme === 'light' ? '#fff' : '#1e293b',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  borderColor: theme === 'light' ? '#e2e8f0' : '#475569'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="login-btn"
              style={{ 
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #4361ee, #7209b7)',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'white'
              }}
            >
              {loading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Register Component - ARABIC VERSION
const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    number: '',
    profile_picture: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = useCallback((e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  }, [formData, errors]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('يرجى اختيار صورة (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('يجب أن تكون الصورة أقل من 5 ميجابايت');
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const uploadImage = useCallback(async (file) => {
    if (!file) return null;

    setUploading(true);
    
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      data.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: data,
        }
      );

      const result = await response.json();
      return result.secure_url;
    } catch (error) {
      console.error('فشل التحميل:', error);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setLoading(true);
    
    let imageUrl = formData.profile_picture;
    
    if (selectedFile) {
      const uploadedUrl = await uploadImage(selectedFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      number: formData.number,
      profile_picture: imageUrl || ''
    };
    
    const result = await register(userData);
    
    if (result.success) {
      navigate('/verify-email');
    } else {
      setError(result.error || 'فشل التسجيل');
      if (result.errors) {
        setErrors(result.errors);
      }
    }
    
    setLoading(false);
  }, [formData, selectedFile, uploadImage, register, navigate]);

  const removeImage = useCallback(() => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData({ ...formData, profile_picture: '' });
  }, [formData]);

  return (
    <div className="main">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">👤</div>
            <h2>إنشاء حساب جديد</h2>
            <p>انضم إلينا وشارك تجاربك</p>
          </div>
          
          {error && (
            <div className="error-message" style={{ 
              background: theme === 'light' ? '#fee2e2' : '#450a0a',
              color: theme === 'light' ? '#991b1b' : '#fecaca',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="input-group">
                <label>الاسم الكامل *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="أدخل اسمك الكامل"
                  style={{ 
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    borderColor: errors.name ? '#ef4444' : (theme === 'light' ? '#e2e8f0' : '#475569')
                  }}
                />
                {errors.name && (
                  <div className="field-error">{errors.name}</div>
                )}
              </div>
              
              <div className="input-group">
                <label>البريد الإلكتروني *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="example@email.com"
                  style={{ 
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    borderColor: errors.email ? '#ef4444' : (theme === 'light' ? '#e2e8f0' : '#475569')
                  }}
                />
                {errors.email && (
                  <div className="field-error">{errors.email}</div>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="input-group">
                <label>كلمة المرور *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="8 أحرف على الأقل"
                  style={{ 
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    borderColor: errors.password ? '#ef4444' : (theme === 'light' ? '#e2e8f0' : '#475569')
                  }}
                />
                {errors.password && (
                  <div className="field-error">{errors.password}</div>
                )}
              </div>
              
              <div className="input-group">
                <label>رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="أدخل رقم هاتفك"
                  style={{ 
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    borderColor: errors.number ? '#ef4444' : (theme === 'light' ? '#e2e8f0' : '#475569')
                  }}
                />
                {errors.number && (
                  <div className="field-error">{errors.number}</div>
                )}
              </div>
            </div>
            
            <div className="input-group">
              <label>صورة الملف الشخصي (اختياري)</label>
              
              <div className="image-upload-section" style={{ 
                borderColor: theme === 'light' ? '#e2e8f0' : '#475569',
                background: theme === 'light' ? '#f8fafc' : '#1e293b'
              }}>
                {!imagePreview ? (
                  <div className="upload-area">
                    <label className="upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-content">
                        <span className="upload-icon" style={{ color: '#4361ee' }}>📷</span>
                        <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>اختر صورة</p>
                        <p className="upload-hint" style={{ color: theme === 'light' ? '#94a3b8' : '#94a3b8' }}>
                          JPG, PNG, GIF (5MB كحد أقصى)
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview">
                    <img src={imagePreview} alt="معاينة" className="preview-img" />
                    <button 
                      type="button" 
                      onClick={removeImage}
                      className="remove-image-btn"
                      style={{ background: '#e63946', color: 'white' }}
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || uploading}
              className="register-btn"
              style={{ 
                background: loading || uploading ? '#94a3b8' : 'linear-gradient(135deg, #4361ee, #7209b7)',
                cursor: loading || uploading ? 'not-allowed' : 'pointer',
                color: 'white'
              }}
            >
              {loading ? 'جاري إنشاء الحساب...' : 
               uploading ? 'جاري تحميل الصورة...' : 'إنشاء حساب'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              لديك حساب بالفعل؟ <Link to="/login" style={{ color: '#4361ee' }}>تسجيل الدخول</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Home Component with Fixed + Button - ARABIC VERSION
const Home = () => {
  const [phoneGroups, setPhoneGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, api } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [noComplaintsNumbers, setNoComplaintsNumbers] = useState([]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCustomers();
      
      let customersData = [];
      if (response && response.costumers) {
        customersData = response.costumers;
      } else if (response && response.customers) {
        customersData = response.customers;
      } else if (Array.isArray(response)) {
        customersData = response;
      }
      
      if (customersData.length > 0) {
        const phoneMap = {};
        const noComplaintsSet = new Set();
        
        customersData.forEach(customer => {
          const phone = customer.number;
          if (!phone) return;
          noComplaintsSet.add(phone);
        });
        
        customersData.forEach(customer => {
          const phone = customer.number;
          if (!phone) return;
          
          if (!phoneMap[phone]) {
            phoneMap[phone] = {
              number: phone,
              names: new Set(),
              comments: [],
              totalComments: 0,
              id: customer.id || Math.random().toString(36).substr(2, 9)
            };
          }
          
          if (customer.nom) {
            phoneMap[phone].names.add(customer.nom);
          } else {
            phoneMap[phone].names.add('غير معروف');
          }
          
          if (customer.motifs && Array.isArray(customer.motifs)) {
            phoneMap[phone].totalComments += customer.motifs.length;
            customer.motifs.forEach(motif => {
              phoneMap[phone].comments.push({
                ...motif,
                customerName: customer.nom || 'غير معروف'
              });
            });
            
            if (customer.motifs.length > 0) {
              noComplaintsSet.delete(phone);
            }
          }
        });
        
        const groupsArray = Object.values(phoneMap).map(group => ({
          ...group,
          names: Array.from(group.names).join(', ')
        }));
        
        groupsArray.sort((a, b) => b.totalComments - a.totalComments);
        
        setPhoneGroups(groupsArray);
        setFilteredGroups(groupsArray);
        setNoComplaintsNumbers(Array.from(noComplaintsSet));
      } else {
        setPhoneGroups([]);
        setFilteredGroups([]);
        setNoComplaintsNumbers([]);
      }
      
      setError('');
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setError('فشل في جلب البيانات');
      setPhoneGroups([]);
      setFilteredGroups([]);
      setNoComplaintsNumbers([]);
    } finally {
      setLoading(false);
    }
  }, [api.getCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGroups(phoneGroups);
    } else {
      const filtered = phoneGroups.filter(group => 
        group.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.comments.some(comment => 
          comment.description.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, phoneGroups]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const totalReports = phoneGroups.reduce((sum, group) => sum + group.totalComments, 0);
  const uniqueNumbers = phoneGroups.length;
  const verifiedUsers = user?.verified ? 1 : 0;

  return (
    <>
      <main className="main">
        <section className="stats-section">
          <h2 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc' }}>إحصائيات المنصة</h2>
          <div className="stats-grid">
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4361ee, #7209b7)', color: 'white' }}>
              <h3>{uniqueNumbers}</h3>
              <p>رقم هاتف تم الإبلاغ عنه</p>
            </div>
            
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f72585, #b5179e)', color: 'white' }}>
              <h3>{totalReports}</h3>
              <p>بلاغ تم إضافته</p>
            </div>
            
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4cc9f0, #3a0ca3)', color: 'white' }}>
              <h3>{verifiedUsers}</h3>
              <p>حساب موثق</p>
            </div>
          </div>
        </section>

        {/* Fixed + Button - CLEAR AND FIXED */}
        {user && user.verified && (
          <div className="add-motif-fixed-container" style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            zIndex: 1000,
          }}>
            <Link 
              to="/add-comment" 
              style={{
                width: '70px',
                height: '70px',
                background: 'linear-gradient(135deg, #4361ee, #7209b7)',
                color: 'white',
                borderRadius: '50%',
                textDecoration: 'none',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                boxShadow: '0 10px 25px rgba(67, 97, 238, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s, box-shadow 0.3s',
                border: '4px solid white',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 15px 35px rgba(67, 97, 238, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 10px 25px rgba(67, 97, 238, 0.4)';
              }}
              title="إضافة بلاغ جديد"
            >
              +
            </Link>
          </div>
        )}

        <section className="search-section">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="ابحث عن رقم هاتف، اسم، أو وصف..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ 
                background: theme === 'light' ? '#fff' : '#1e293b',
                color: theme === 'light' ? '#1e293b' : '#f8fafc'
              }}
            />
            <button 
              className="search-btn"
              style={{ background: 'linear-gradient(135deg, #4361ee, #7209b7)', color: 'white' }}
            >
              🔍
            </button>
          </div>
          {searchTerm && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '1rem',
              color: theme === 'light' ? '#64748b' : '#cbd5e1'
            }}>
              {filteredGroups.length} نتيجة لـ "{searchTerm}"
            </div>
          )}
        </section>

        {searchTerm && filteredGroups.length === 0 && noComplaintsNumbers.some(num => 
          num.toLowerCase().includes(searchTerm.toLowerCase())
        ) && (
          <div className="success-message" style={{ 
            background: '#d1fae5',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '1.2rem' }}>✅</div>
            <div>
              <strong>تهانينا!</strong> هذا الرقم ليس لديه أي بلاغات سلبية حتى الآن.
            </div>
            <button 
              type="button" 
              onClick={() => setSearchTerm('')}
              style={{ 
                background: 'none',
                border: 'none',
                color: '#065f46',
                cursor: 'pointer',
                marginRight: 'auto'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <section className="numbers-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc' }}>الأرقام المبلغ عنها</h2>
            <span style={{ 
              color: theme === 'light' ? '#64748b' : '#cbd5e1',
              fontSize: '0.9rem'
            }}>
              {filteredGroups.length} رقم
            </span>
          </div>

          {error && (
            <div className="error-message" style={{ 
              background: theme === 'light' ? '#fee2e2' : '#450a0a',
              color: theme === 'light' ? '#991b1b' : '#fecaca',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-container" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '1rem', color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
                جاري التحميل...
              </p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="empty-icon" style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📞</div>
              <h3 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc', marginBottom: '0.5rem' }}>
                {searchTerm ? 'لا توجد نتائج' : 'لا توجد أرقام مبلغ عنها'}
              </h3>
              <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1', marginBottom: '1.5rem' }}>
                {searchTerm ? 'جرب مصطلحات بحث أخرى' : 'كن أول من يضيف بلاغاً عن رقم هاتف!'}
              </p>
            </div>
          ) : (
            <div className="numbers-grid">
              {filteredGroups.map((group, index) => (
                <div 
                  key={group.id || index} 
                  className="number-card"
                  style={{ 
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155'
                  }}
                >
                  <div className="card-header">
                    <div className="number-display">
                      <span className="phone-icon">📱</span>
                      <span className="phone-number" style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc' }}>
                        {group.number}
                      </span>
                    </div>
                    <div className="badge" style={{ background: 'linear-gradient(135deg, #f72585, #b5179e)', color: 'white' }}>
                      {group.totalComments} بلاغ
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <p className="user-name" style={{ color: theme === 'light' ? '#475569' : '#cbd5e1' }}>
                      <strong>الأسماء:</strong> {group.names}
                    </p>
                    
                    <div className="status" style={{ color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
                      {group.comments.length > 0 ? (
                        <>
                          <strong>آخر بلاغ:</strong> 
                          <span style={{ marginRight: '0.5rem' }}>
                            {group.comments[group.comments.length - 1].description.length > 60 
                              ? group.comments[group.comments.length - 1].description.substring(0, 60) + '...' 
                              : group.comments[group.comments.length - 1].description}
                          </span>
                        </>
                      ) : (
                        <span>لا توجد بلاغات</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/phone/${encodeURIComponent(group.number)}`)}
                      style={{ background: 'linear-gradient(135deg, #4361ee, #7209b7)', color: 'white' }}
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {user && !user.verified && (
          <div className="verification-alert" style={{ 
            background: theme === 'light' ? '#fef3c7' : '#78350f',
            color: theme === 'light' ? '#92400e' : '#fbbf24',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <p>⚠️ حسابك غير موثق. <Link to="/verify-email" style={{ color: '#4361ee' }}>توثيق البريد الإلكتروني</Link></p>
          </div>
        )}

        {!user && (
          <div className="verification-alert" style={{ 
            background: theme === 'light' ? '#e0f2fe' : '#0c4a6e',
            color: theme === 'light' ? '#0369a1' : '#bae6fd',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <p>ℹ️ أنت تتصفح الموقع كزائر. 
            <Link to="/register" style={{ color: '#4361ee', margin: '0 5px' }}>سجل حساباً جديداً</Link>
            أو
            <Link to="/login" style={{ color: '#4361ee', margin: '0 5px' }}>سجل الدخول</Link></p>
          </div>
        )}
      </main>

      <footer className="footer" style={{ 
        borderTop: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155'
      }}>
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">📱</div>
            <div>
              <h3 style={{ background: 'linear-gradient(135deg, #4361ee, #7209b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                منصة الإبلاغ عن الاحتيال
              </h3>
              <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1', fontSize: '0.9rem' }}>
                نعمل معاً لحماية المجتمع من عمليات الاحتيال
              </p>
            </div>
          </div>
          
          <div className="footer-info">
            <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
              جميع الحقوق محفوظة © 2026
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

// PhoneDetails Component with French Dates (kept in French)
const PhoneDetails = () => {
  const { phoneNumber } = useParams();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState(null);
  const [evidenceImagePreview, setEvidenceImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editing, setEditing] = useState(false);
  const { user, api } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const decodedPhoneNumber = decodeURIComponent(phoneNumber);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCustomers();
      
      let allCustomers = [];
      if (response && response.costumers) {
        allCustomers = response.costumers;
      } else if (response && response.customers) {
        allCustomers = response.customers;
      } else if (Array.isArray(response)) {
        allCustomers = response;
      }
      
      const allComments = [];
      allCustomers.forEach(customer => {
        if (customer.number === decodedPhoneNumber && customer.motifs) {
          customer.motifs.forEach(motif => {
            allComments.push({
              id: motif.id,
              description: motif.description,
              evidence_image: motif.evidence_image,
              customerName: customer.nom || 'غير معروف',
              createdAt: motif.created_at || new Date().toISOString(),
              userName: user?.name || 'مجهول',
              userId: motif.user_id
            });
          });
        }
      });
      
      allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setComments(allComments);
      setApiError('');
    } catch (error) {
      console.error('خطأ في جلب البلاغات:', error);
      setApiError('فشل في جلب البلاغات');
    } finally {
      setLoading(false);
    }
  }, [api.getCustomers, decodedPhoneNumber, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments, phoneNumber]);

  const handleEvidenceFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('يرجى اختيار صورة (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('يجب أن تكون الصورة أقل من 5 ميجابايت');
      return;
    }

    setSelectedEvidenceFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidenceImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddComment = useCallback(async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('يرجى تسجيل الدخول لإضافة بلاغات');
      navigate('/login');
      return;
    }
    
    if (!user.verified) {
      alert('يرجى توثيق بريدك الإلكتروني قبل إضافة بلاغات');
      navigate('/verify-email');
      return;
    }
    
    if (!newComment.trim()) {
      alert('يرجى إدخال نص البلاغ');
      return;
    }

    if (!user.id) {
      console.error('معرف المستخدم مفقود');
      alert('خطأ في بيانات المستخدم. يرجى تسجيل الخروج والمحاولة مرة أخرى.');
      return;
    }
    
    setSubmitting(true);
    
    let evidenceImageUrl = '';
    
    if (selectedEvidenceFile) {
      setUploadingEvidence(true);
      const uploadedUrl = await api.uploadImage(selectedEvidenceFile);
      if (uploadedUrl) {
        evidenceImageUrl = uploadedUrl;
      } else {
        alert('فشل تحميل صورة الإثبات. يمكنك الإضافة بدون صورة.');
        setSubmitting(false);
        setUploadingEvidence(false);
        return;
      }
      setUploadingEvidence(false);
    }
    
    try {
      const payload = {
        number: decodedPhoneNumber,
        nom: user.name,
        description: newComment,
        evidence_image: evidenceImageUrl,
        user_id: user.id
      };
      
      await api.addCustomer(payload);
      
      setNewComment('');
      setSelectedEvidenceFile(null);
      setEvidenceImagePreview('');
      fetchComments();
      
      alert('تم إضافة البلاغ بنجاح!');
    } catch (error) {
      console.error('خطأ:', error);
      alert(error.message || 'فشل إضافة البلاغ');
    } finally {
      setSubmitting(false);
    }
  }, [user, newComment, selectedEvidenceFile, api.uploadImage, api.addCustomer, decodedPhoneNumber, fetchComments, navigate]);

  const handleEditClick = useCallback((comment) => {
    setEditingId(comment.id);
    setEditText(comment.description);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText('');
  }, []);

  const handleSaveEdit = useCallback(async (commentId) => {
    if (!editText.trim()) {
      alert('البلاغ لا يمكن أن يكون فارغاً');
      return;
    }
    
    setEditing(true);
    try {
      await api.updateCustomer(commentId, {
        description: editText
      });
      
      setEditingId(null);
      setEditText('');
      fetchComments();
    } catch (error) {
      console.error('خطأ في تحديث البلاغ:', error);
      alert(error.message || 'فشل تحديث البلاغ');
    } finally {
      setEditing(false);
    }
  }, [editText, api.updateCustomer, fetchComments]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
      return;
    }
    
    try {
      await api.deleteCustomer(commentId);
      fetchComments();
    } catch (error) {
      console.error('خطأ في حذف البلاغ:', error);
      alert(error.message || 'فشل حذف البلاغ');
    }
  }, [api.deleteCustomer, fetchComments]);

  const canModifyComment = useCallback((comment) => {
    return user && (user.id === comment.userId || user.isAdmin);
  }, [user]);

  const hasNoComplaints = comments.length === 0;

  return (
    <div className="main">
      <div className="details-container">
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
          style={{ 
            background: theme === 'light' ? '#fff' : '#1e293b',
            color: theme === 'light' ? '#1e293b' : '#f8fafc',
            border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #475569',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← العودة للرئيسية
        </button>

        {hasNoComplaints && (
          <div className="success-message" style={{ 
            background: '#d1fae5',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '1.2rem' }}>✅</div>
            <div>
              <strong>رقم نظيف!</strong> هذا الرقم ليس لديه أي بلاغات سلبية حتى الآن.
            </div>
          </div>
        )}

        <div className="details-header" style={{ 
          background: theme === 'light' ? '#fff' : '#1e293b',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #475569'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>📱</span>
            <div>
              <h2 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc' }}>{decodedPhoneNumber}</h2>
              <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>{comments.length} بلاغ</p>
            </div>
          </div>
        </div>

        <div className="add-comment-card" style={{ 
          background: theme === 'light' ? '#fff' : '#1e293b',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #475569'
        }}>
          <h3 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc', marginBottom: '1rem' }}>إضافة بلاغ جديد</h3>
          
          {!user ? (
            <div className="verification-required" style={{ 
              background: theme === 'light' ? '#e0f2fe' : '#0c4a6e',
              color: theme === 'light' ? '#0369a1' : '#bae6fd',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p>🔒 يجب تسجيل الدخول لإضافة بلاغات</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <Link to="/login" className="view-btn" style={{ 
                  background: 'linear-gradient(135deg, #4361ee, #7209b7)',
                  display: 'inline-block',
                  textDecoration: 'none',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px'
                }}>
                  تسجيل الدخول
                </Link>
                <Link to="/register" className="view-btn" style={{ 
                  background: '#64748b',
                  display: 'inline-block',
                  textDecoration: 'none',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px'
                }}>
                  إنشاء حساب
                </Link>
              </div>
            </div>
          ) : !user.verified ? (
            <div className="verification-required" style={{ 
              background: theme === 'light' ? '#fef3c7' : '#78350f',
              color: theme === 'light' ? '#92400e' : '#fbbf24',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p>🔒 يجب توثيق بريدك الإلكتروني لإضافة بلاغات</p>
              <Link to="/verify-email" className="view-btn" style={{ 
                background: 'linear-gradient(135deg, #4361ee, #7209b7)',
                display: 'inline-block',
                marginTop: '0.5rem',
                textDecoration: 'none',
                color: 'white'
              }}>
                توثيق البريد الآن
              </Link>
            </div>
          ) : (
            <form onSubmit={handleAddComment}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب بلاغك هنا..."
                  rows="4"
                  required
                  disabled={submitting}
                  style={{ 
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `2px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`,
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>صورة الإثبات (اختياري)</label>
                
                <div className="evidence-upload-section" style={{ 
                  borderColor: theme === 'light' ? '#e2e8f0' : '#475569',
                  background: theme === 'light' ? '#f8fafc' : '#1e293b',
                  border: '2px dashed',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}>
                  {!evidenceImagePreview ? (
                    <div className="upload-area">
                      <label className="upload-label" style={{ cursor: 'pointer' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEvidenceFileSelect}
                          style={{ display: 'none' }}
                        />
                        <div className="upload-content">
                          <span className="upload-icon" style={{ color: '#4361ee', fontSize: '2rem' }}>📷</span>
                          <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1', marginTop: '0.5rem' }}>
                            اختر صورة للإثبات
                          </p>
                          <p className="upload-hint" style={{ 
                            color: theme === 'light' ? '#94a3b8' : '#94a3b8',
                            fontSize: '0.85rem',
                            marginTop: '0.25rem'
                          }}>
                            JPG, PNG, GIF (5MB كحد أقصى)
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="evidence-preview">
                      <img 
                        src={evidenceImagePreview} 
                        alt="معاينة الإثبات" 
                        style={{ 
                          maxWidth: '200px',
                          maxHeight: '150px',
                          borderRadius: '8px',
                          marginBottom: '1rem'
                        }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setSelectedEvidenceFile(null);
                          setEvidenceImagePreview('');
                        }}
                        style={{ 
                          background: '#e63946',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="submit" 
                  disabled={submitting || uploadingEvidence}
                  className="view-btn"
                  style={{ 
                    background: submitting || uploadingEvidence ? '#94a3b8' : 'linear-gradient(135deg, #4361ee, #7209b7)',
                    cursor: submitting || uploadingEvidence ? 'not-allowed' : 'pointer',
                    padding: '0.75rem 2rem',
                    color: 'white'
                  }}
                >
                  {submitting ? 'جاري الإضافة...' : 
                   uploadingEvidence ? 'جاري تحميل الصورة...' : 'إضافة البلاغ'}
                </button>
                {user && (
                  <div style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
                    <span>المبلغ: </span>
                    <strong style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc' }}>{user.name}</strong>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="comments-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc' }}>جميع البلاغات ({comments.length})</h3>
          </div>
          
          {loading ? (
            <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '1rem', color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
                جاري التحميل...
              </p>
            </div>
          ) : comments.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>💬</div>
              <h4 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc', marginBottom: '0.5rem' }}>
                لا توجد بلاغات بعد
              </h4>
              <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
                {user?.verified ? 'كن أول من يضيف بلاغاً عن هذا الرقم' : 'قم بتسجيل الدخول وتوثيق حسابك لإضافة أول بلاغ'}
              </p>
            </div>
          ) : (
            <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map((comment, index) => (
                <div 
                  key={comment.id || index} 
                  className="comment-card"
                  style={{ 
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #475569'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        background: 'linear-gradient(135deg, #4361ee, #7209b7)', 
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}>
                        {comment.userName ? comment.userName.charAt(0) : 'م'}
                      </div>
                      <div>
                        <h4 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc', marginBottom: '0.25rem' }}>
                          {comment.userName}
                        </h4>
                        <span style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1', fontSize: '0.85rem' }}>
                          {formatDateFrench(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {canModifyComment(comment) && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {editingId === comment.id ? (
                          <>
                            <button 
                              onClick={() => handleSaveEdit(comment.id)} 
                              disabled={editing}
                              style={{ 
                                background: '#27ae60',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '5px',
                                cursor: editing ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {editing ? 'جاري الحفظ...' : 'حفظ'}
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              disabled={editing}
                              style={{ 
                                background: '#64748b',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '5px',
                                cursor: editing ? 'not-allowed' : 'pointer'
                              }}
                            >
                              إلغاء
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEditClick(comment)}
                              style={{ 
                                background: '#fbbf24',
                                color: '#78350f',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              تعديل
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{ 
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              حذف
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ margin: '1rem 0' }}>
                    {editingId === comment.id ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows="3"
                        style={{ 
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: `2px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`,
                          background: theme === 'light' ? '#fff' : '#1e293b',
                          color: theme === 'light' ? '#1e293b' : '#f8fafc',
                          fontSize: '1rem'
                        }}
                      />
                    ) : (
                      <>
                        <p style={{ 
                          color: theme === 'light' ? '#1e293b' : '#f8fafc',
                          lineHeight: '1.6',
                          marginBottom: comment.evidence_image ? '1rem' : '0'
                        }}>
                          {comment.description}
                        </p>
                        
                        {comment.evidence_image && (
                          <div className="evidence-display" style={{ 
                            marginTop: '1rem',
                            padding: '1rem',
                            background: theme === 'light' ? '#f8fafc' : '#0f172a',
                            borderRadius: '8px',
                            border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`
                          }}>
                            <p style={{ 
                              color: theme === 'light' ? '#475569' : '#cbd5e1',
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}>
                              🖼️ صورة الإثبات:
                            </p>
                            <div style={{ textAlign: 'center' }}>
                              <img 
                                src={comment.evidence_image} 
                                alt="إثبات" 
                                style={{ 
                                  maxWidth: '100%',
                                  maxHeight: '300px',
                                  borderRadius: '8px',
                                  border: `2px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`,
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(comment.evidence_image, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: `1px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`
                  }}>
                    <span style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
                      العميل: {comment.customerName}
                    </span>
                    <span style={{ 
                      background: '#27ae60',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '15px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {comment.evidence_image ? 'مدعم بإثبات' : 'مفعل'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// AddComment Component - ARABIC VERSION
const AddComment = () => {
  const [formData, setFormData] = useState({
    number: '',
    nom: '',
    description: '',
    evidence_image: ''
  });
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState(null);
  const [evidenceImagePreview, setEvidenceImagePreview] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, api } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nom: user.name
      }));
    }
  }, [user]);

  const handleChange = useCallback((e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }, [formData]);

  const handleEvidenceFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('يرجى اختيار صورة (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('يجب أن تكون الصورة أقل من 5 ميجابايت');
      return;
    }

    setSelectedEvidenceFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidenceImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!user.verified) {
      alert('يرجى توثيق بريدك الإلكتروني قبل إضافة بلاغات');
      navigate('/verify-email');
      return;
    }

    if (!user.id) {
      console.error('معرف المستخدم مفقود');
      alert('خطأ في بيانات المستخدم. يرجى تسجيل الخروج والمحاولة مرة أخرى.');
      return;
    }

    if (!formData.number.trim()) {
      setError('رقم الهاتف مطلوب');
      return;
    }

    if (!formData.description.trim()) {
      setError('وصف البلاغ مطلوب');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);

    let evidenceImageUrl = formData.evidence_image;
    
    if (selectedEvidenceFile) {
      setUploadingEvidence(true);
      const uploadedUrl = await api.uploadImage(selectedEvidenceFile);
      if (uploadedUrl) {
        evidenceImageUrl = uploadedUrl;
      } else {
        setError('فشل تحميل صورة الإثبات. يمكنك الإضافة بدون صورة.');
        setLoading(false);
        setUploadingEvidence(false);
        return;
      }
      setUploadingEvidence(false);
    }
    
    try {
      const payload = {
        number: formData.number,
        nom: formData.nom,
        description: formData.description,
        evidence_image: evidenceImageUrl,
        user_id: user.id
      };
      
      await api.addCustomer(payload);
      
      setSuccess('تم إضافة البلاغ بنجاح!');
      setFormData({ number: '', nom: user.name, description: '', evidence_image: '' });
      setSelectedEvidenceFile(null);
      setEvidenceImagePreview('');
      
      setTimeout(() => {
        navigate(`/phone/${encodeURIComponent(formData.number)}`);
      }, 1500);
    } catch (error) {
      console.error('خطأ:', error);
      setError(error.message || 'فشل إضافة البلاغ');
    } finally {
      setLoading(false);
    }
  }, [formData, user, selectedEvidenceFile, api.uploadImage, api.addCustomer, navigate]);

  return (
    <div className="main">
      <div className="add-container">
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
          style={{ 
            background: theme === 'light' ? '#fff' : '#1e293b',
            color: theme === 'light' ? '#1e293b' : '#f8fafc',
            border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #475569',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← العودة للرئيسية
        </button>

        <div className="add-form-card" style={{ 
          background: theme === 'light' ? '#fff' : '#1e293b',
          padding: '2rem',
          borderRadius: '12px',
          border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #475569'
        }}>
          <div className="form-header" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ 
              color: theme === 'light' ? '#1e293b' : '#f8fafc',
              marginBottom: '0.5rem'
            }}>📝 إضافة بلاغ عن رقم هاتف</h2>
            <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
              شارك تجربتك مع رقم الهاتف لمساعدة الآخرين
            </p>
          </div>

          {success && (
            <div className="success-alert" style={{ 
              background: '#d1fae5',
              color: '#065f46',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {success}
            </div>
          )}
          
          {error && (
            <div className="error-alert" style={{ 
              background: '#fee2e2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}
          
          {!user?.verified ? (
            <div className="verification-block" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#4361ee' }}>✉️</div>
              <h3 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc', marginBottom: '0.5rem' }}>
                توثيق البريد الإلكتروني مطلوب
              </h3>
              <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1', marginBottom: '1.5rem' }}>
                لا يمكنك إضافة بلاغات إلا بعد توثيق بريدك الإلكتروني
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/verify-email" className="view-btn" style={{ 
                  background: 'linear-gradient(135deg, #4361ee, #7209b7)',
                  textDecoration: 'none',
                  padding: '0.75rem 1.5rem',
                  color: 'white'
                }}>
                  الانتقال لصفحة التوثيق
                </Link>
                <button 
                  onClick={() => navigate('/')}
                  style={{ 
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="add-form">
              <div className="form-grid" style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div className="form-group">
                  <label style={{ 
                    display: 'block',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>رقم الهاتف *</label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    required
                    placeholder="أدخل رقم الهاتف"
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`,
                      background: theme === 'light' ? '#fff' : '#1e293b',
                      color: theme === 'light' ? '#1e293b' : '#f8fafc',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label style={{ 
                    display: 'block',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>اسم العميل *</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    placeholder="أدخل اسم العميل"
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`,
                      background: theme === 'light' ? '#fff' : '#1e293b',
                      color: theme === 'light' ? '#1e293b' : '#f8fafc',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>وصف البلاغ *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="صف ما حدث بالتفصيل..."
                  rows="6"
                  style={{ 
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `2px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`,
                    background: theme === 'light' ? '#fff' : '#1e293b',
                    color: theme === 'light' ? '#1e293b' : '#f8fafc',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  color: theme === 'light' ? '#1e293b' : '#f8fafc',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>صورة الإثبات (اختياري)</label>
                
                <div className="evidence-upload-section" style={{ 
                  borderColor: theme === 'light' ? '#e2e8f0' : '#475569',
                  background: theme === 'light' ? '#f8fafc' : '#1e293b',
                  border: '2px dashed',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}>
                  {!evidenceImagePreview ? (
                    <div className="upload-area">
                      <label className="upload-label" style={{ cursor: 'pointer' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEvidenceFileSelect}
                          style={{ display: 'none' }}
                        />
                        <div className="upload-content">
                          <span className="upload-icon" style={{ color: '#4361ee', fontSize: '2rem' }}>📷</span>
                          <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1', marginTop: '0.5rem' }}>
                            اختر صورة للإثبات
                          </p>
                          <p className="upload-hint" style={{ 
                            color: theme === 'light' ? '#94a3b8' : '#94a3b8',
                            fontSize: '0.85rem',
                            marginTop: '0.25rem'
                          }}>
                            JPG, PNG, GIF (5MB كحد أقصى)
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="evidence-preview">
                      <img 
                        src={evidenceImagePreview} 
                        alt="معاينة الإثبات" 
                        style={{ 
                          maxWidth: '200px',
                          maxHeight: '150px',
                          borderRadius: '8px',
                          marginBottom: '1rem'
                        }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setSelectedEvidenceFile(null);
                          setEvidenceImagePreview('');
                        }}
                        style={{ 
                          background: '#e63946',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={loading || uploadingEvidence}
                  className="view-btn"
                  style={{ 
                    background: loading || uploadingEvidence ? '#94a3b8' : 'linear-gradient(135deg, #4361ee, #7209b7)',
                    cursor: loading || uploadingEvidence ? 'not-allowed' : 'pointer',
                    padding: '0.75rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  {loading ? 'جاري الإضافة...' : 
                   uploadingEvidence ? 'جاري تحميل الصورة...' : 'إضافة البلاغ'}
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/')}
                  style={{ 
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  إلغاء
                </button>
              </div>
              
              {user && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem',
                  background: theme === 'light' ? '#f1f5f9' : '#0f172a',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  color: theme === 'light' ? '#475569' : '#cbd5e1'
                }}>
                  <span>🔑</span>
                  <span>إضافة البلاغ كـ: <strong>{user.name}</strong></span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Email Verification Component - ARABIC VERSION
const EmailVerification = () => {
  const { user, refreshVerification, api } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.verified) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleResendVerification = useCallback(async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await api.sendVerificationEmail({
        email: user.email,
        name: user.name
      });
      
      if (response.success) {
        setMessage('تم إرسال بريد التوثيق! تفقد صندوق الوارد.');
        setResendCooldown(60);
        
        const interval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.message || 'فشل إرسال بريد التوثيق');
      }
    } catch (error) {
      setError(error.message || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  }, [resendCooldown, api.sendVerificationEmail, user]);

  const handleCheckVerification = useCallback(async () => {
    try {
      const response = await api.checkVerification(user.email);
      if (response.success && response.data.verified) {
        await refreshVerification();
        navigate('/');
      } else {
        setMessage('لم يتم توثيق البريد بعد. يرجى تفقد بريدك.');
      }
    } catch (error) {
      setError('فشل التحقق من حالة التوثيق');
    }
  }, [api.checkVerification, user.email, refreshVerification, navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  return (
    <div className="main">
      <div className="verification-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="verification-card" style={{ 
          background: theme === 'light' ? '#fff' : '#1e293b',
          padding: '2rem',
          borderRadius: '12px',
          border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #475569'
        }}>
          <div className="verification-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', color: '#4361ee', marginBottom: '1rem' }}>✉️</div>
            <h2 style={{ color: theme === 'light' ? '#1e293b' : '#f8fafc', marginBottom: '0.5rem' }}>
              توثيق البريد الإلكتروني
            </h2>
            <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
              خطوة واحدة تفصلك عن استخدام المنصة
            </p>
          </div>
          
          <div className="verification-message" style={{ 
            background: theme === 'light' ? '#f8fafc' : '#0f172a',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ 
              color: theme === 'light' ? '#1e293b' : '#f8fafc',
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}>
              مرحباً <strong style={{ color: '#4361ee' }}>{user?.name}</strong>,
            </div>
            <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1', marginBottom: '0.5rem' }}>
              لقد أرسلنا بريد توثيق إلى:
            </p>
            <div style={{ 
              background: theme === 'light' ? '#fff' : '#1e293b',
              padding: '1rem',
              borderRadius: '8px',
              margin: '1rem 0',
              border: `2px solid ${theme === 'light' ? '#e2e8f0' : '#475569'}`,
              color: theme === 'light' ? '#1e293b' : '#f8fafc',
              fontWeight: '600'
            }}>
              {user?.email}
            </div>
            <p style={{ color: theme === 'light' ? '#64748b' : '#cbd5e1' }}>
              يرجى تفقد صندوق الوارد والضغط على رابط التوثيق لتفعيل حسابك.
            </p>
          </div>
          
          {message && (
            <div className="success-message" style={{ 
              background: '#d1fae5',
              color: '#065f46',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
          )}
          
          {error && (
            <div className="error-message" style={{ 
              background: '#fee2e2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}
          
          <div className="verification-actions" style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}>
            <button
              onClick={handleResendVerification}
              disabled={loading || resendCooldown > 0}
              className="view-btn"
              style={{ 
                background: loading || resendCooldown > 0 ? '#94a3b8' : 'linear-gradient(135deg, #4361ee, #7209b7)',
                cursor: loading || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading 
                ? 'جاري الإرسال...' 
                : resendCooldown > 0 
                  ? `إعادة الإرسال خلال ${resendCooldown}ث` 
                  : 'إعادة إرسال بريد التوثيق'}
            </button>
            
            <button
              onClick={handleCheckVerification}
              className="view-btn"
              style={{ 
                background: '#64748b',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              لقد قمت بتوثيق بريدي
            </button>
          </div>
          
          <button
            onClick={handleLogout}
            style={{ 
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

// App Component
const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NavbarComponent />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={
              <ProtectedRoute requireLogin={true}>
                <EmailVerification />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            
            <Route path="/add-comment" element={
              <ProtectedRoute requireLogin={true} requireVerification={true}>
                <AddComment />
              </ProtectedRoute>
            } />
            
            <Route path="/phone/:phoneNumber" element={
              <ProtectedRoute>
                <PhoneDetails />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

// CSS Styles (same as before, just direction changed to RTL)
const styles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  direction: rtl;
}

.app {
  min-height: 100vh;
  transition: background 0.3s ease;
}

.app.dark {
  background: #0f172a;
  color: #fff;
}

.app.light {
  background: #f8fafc;
  color: #1e293b;
}

.main {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.stats-section {
  margin-bottom: 2rem;
}

.stats-section h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.5rem;
  border-radius: 12px;
  color: white;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stat-card h3 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.search-section {
  margin: 2rem 0;
}

.search-box {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid #4361ee;
  border-radius: 8px 0 0 8px;
  font-size: 1rem;
  outline: none;
}

.search-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.numbers-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.numbers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.number-card {
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.3s, box-shadow 0.3s;
}

.number-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.number-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.phone-icon {
  font-size: 1.5rem;
}

.phone-number {
  font-size: 1.1rem;
  font-weight: 600;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
}

.card-body {
  margin-bottom: 1rem;
}

.user-name {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.status {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.card-footer {
  margin-top: 1rem;
}

.view-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.view-btn:hover {
  transform: scale(1.05);
}

.auth-container {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid;
}

.app.dark .auth-card {
  background: #1e293b;
  border-color: #334155;
}

.app.light .auth-card {
  background: #fff;
  border-color: #e2e8f0;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #4361ee;
}

.auth-header h2 {
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #4361ee, #7209b7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-header p {
  color: #64748b;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.input-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 2px solid;
  font-size: 1rem;
}

.app.dark .input-group input {
  border-color: #475569;
}

.app.light .input-group input {
  border-color: #e2e8f0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.login-btn, .register-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-btn:hover, .register-btn:hover {
  transform: translateY(-2px);
}

.auth-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid;
}

.app.dark .auth-footer {
  border-color: #334155;
}

.app.light .auth-footer {
  border-color: #e2e8f0;
}

.auth-footer p {
  color: #64748b;
}

.auth-footer a {
  color: #4361ee;
  text-decoration: none;
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.image-upload-section {
  border: 2px dashed;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.image-upload-section:hover {
  border-color: #4361ee;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 2rem;
}

.upload-hint {
  font-size: 0.85rem;
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.preview-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #4361ee;
}

.remove-image-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  color: white;
  font-weight: 500;
  cursor: pointer;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4361ee;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.success-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.field-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

input:focus {
  outline: none;
  border-color: #4361ee;
}

input.error {
  border-color: #ef4444 !important;
}

.footer {
  margin-top: 3rem;
  padding: 2rem;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-logo {
  font-size: 2rem;
}

.footer-brand h3 {
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, #4361ee, #7209b7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-info {
  text-align: right;
  color: #64748b;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .numbers-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-info {
    text-align: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .main {
    padding: 0 1rem;
  }
}

@media (max-width: 480px) {
  .search-box {
    flex-direction: column;
  }
  
  .search-input {
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }
  
  .search-btn {
    border-radius: 8px;
  }
  
  .form-grid {
    grid-template-columns: 1fr !important;
  }
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.app.dark ::-webkit-scrollbar-track {
  background: #1e293b;
}

.app.dark ::-webkit-scrollbar-thumb {
  background: #475569;
}

.app.dark ::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default App;