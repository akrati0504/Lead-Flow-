import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFieldErrors({});
    setGeneralError('');

    // Frontend validation
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const user = await login({ email: email.trim(), password });

      // Determine redirection destination
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422) {
          const validationErrors = err.response.data?.errors || {};
          const flattened = {};
          for (const [key, msgs] of Object.entries(validationErrors)) {
            flattened[key] = Array.isArray(msgs) ? msgs[0] : msgs;
          }
          setFieldErrors(flattened);
          setGeneralError(err.response.data?.message || 'Invalid credentials provided.');
        } else if (err.response.status === 403) {
          setGeneralError(err.response.data?.message || 'Your account is deactivated. Contact admin.');
        } else {
          setGeneralError(err.response.data?.message || 'Failed to authenticate. Please try again.');
        }
      } else {
        setGeneralError('Cannot connect to LeadFlow server. Please check your backend connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 position-relative overflow-hidden"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(67, 74, 250, 0.04) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(67, 74, 250, 0.03) 0px, transparent 50%)',
      }}
    >
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            {/* LeadFlow Brand Login Card */}
            <div
              className="card border-0 rounded-4 overflow-hidden"
              style={{
                boxShadow: '0 20px 45px -10px rgba(67, 74, 250, 0.08), 0 8px 20px -6px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
              }}
            >
              {/* Header Banner */}
              <div
                className="pt-5 pb-4 px-4 text-center text-white position-relative"
                style={{
                  background: 'linear-gradient(135deg, #4F56FF 0%, #383FE0 100%)',
                }}
              >
                {/* Brand Icon */}
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                  style={{
                    width: '68px',
                    height: '68px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <i
                    className="bi bi-diagram-3-fill"
                    style={{
                      fontSize: '1.9rem',
                      background: 'linear-gradient(135deg, #4F56FF 0%, #383FE0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  ></i>
                </div>

                <h3 className="fw-bold mb-1 tracking-tight" style={{ letterSpacing: '-0.5px' }}>
                  LeadFlow
                </h3>
                <p className="small mb-0 text-white-50 fw-medium">
                  Lead Management System
                </p>
              </div>

              {/* Form Body */}
              <div className="card-body p-4 p-sm-4 bg-white">
                <div className="text-center mb-4">
                  <h6 className="fw-bold text-dark mb-1">Sign in to your account</h6>
                  <small className="text-muted">Enter your verified credentials to continue</small>
                </div>

                {/* General Alerts */}
                {generalError && (
                  <div
                    className="alert alert-danger d-flex align-items-center small py-2 px-3 mb-4 rounded-3 border-0 shadow-sm"
                    role="alert"
                    style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-6 flex-shrink-0"></i>
                    <div>{generalError}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-secondary mb-1">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text bg-white border-end-0 text-muted ps-3"
                        style={{ borderColor: '#E2E8F0', borderRadius: '10px 0 0 10px' }}
                      >
                        <i className="bi bi-envelope text-secondary"></i>
                      </span>
                      <input
                        type="email"
                        className={`form-control border-start-0 py-2 ${
                          fieldErrors.email ? 'is-invalid' : ''
                        }`}
                        placeholder="name@leadflow.test"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={submitting}
                        style={{
                          borderColor: '#E2E8F0',
                          borderRadius: '0 10px 10px 0',
                          fontSize: '0.92rem',
                        }}
                      />
                      {fieldErrors.email && (
                        <div className="invalid-feedback">{fieldErrors.email}</div>
                      )}
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small text-secondary mb-0">
                        Password
                      </label>
                    </div>
                    <div className="input-group">
                      <span
                        className="input-group-text bg-white border-end-0 text-muted ps-3"
                        style={{ borderColor: '#E2E8F0', borderRadius: '10px 0 0 10px' }}
                      >
                        <i className="bi bi-lock text-secondary"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control border-start-0 border-end-0 py-2 ${
                          fieldErrors.password ? 'is-invalid' : ''
                        }`}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={submitting}
                        style={{ borderColor: '#E2E8F0', fontSize: '0.92rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-light border-start-0 text-muted pe-3"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                          borderColor: '#E2E8F0',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '0 10px 10px 0',
                        }}
                      >
                        <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'} text-secondary`}></i>
                      </button>
                      {fieldErrors.password && (
                        <div className="invalid-feedback">{fieldErrors.password}</div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn w-100 text-white fw-semibold py-2 d-flex align-items-center justify-content-center shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #4F56FF 0%, #383FE0 100%)',
                      borderColor: '#434AFA',
                      borderRadius: '10px',
                      height: '44px',
                      fontSize: '0.95rem',
                      letterSpacing: '0.2px',
                    }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer Tagline */}
            <p className="text-center text-muted small mt-4 fw-medium">
              LeadFlow CRM &bull; Academic Mini Project
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
