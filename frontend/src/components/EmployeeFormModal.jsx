import { useState, useEffect } from 'react';

export default function EmployeeFormModal({
  show,
  onClose,
  onSubmit,
  employee = null,
  submitting = false,
  errors = {},
}) {
  const isEdit = Boolean(employee);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_active: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        password: '',
        password_confirmation: '',
        is_active: employee.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_active: true,
      });
    }
    setShowPassword(false);
  }, [employee, show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    // If in edit mode and password fields are blank, do not send empty strings
    if (isEdit && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    onSubmit(payload);
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom bg-light py-3">
              <h5 className="modal-title fw-semibold text-dark d-flex align-items-center gap-2">
                <i className={`bi ${isEdit ? 'bi-pencil-square text-primary' : 'bi-person-plus-fill text-primary'}`}></i>
                <span>{isEdit ? 'Edit Employee Account' : 'Create New Employee'}</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={submitting}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {errors?.general && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errors.general}
                  </div>
                )}

                {/* Name */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className={`form-control ${errors?.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors?.name && (
                    <div className="invalid-feedback">{errors.name[0]}</div>
                  )}
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`form-control ${errors?.email ? 'is-invalid' : ''}`}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors?.email && (
                    <div className="invalid-feedback">{errors.email[0]}</div>
                  )}
                </div>

                {/* Password Notice for Edit */}
                {isEdit && (
                  <div className="alert alert-light border small text-muted py-2 mb-3">
                    <i className="bi bi-info-circle me-1 text-primary"></i>
                    Leave password fields blank if you do not wish to change the password.
                  </div>
                )}

                {/* Password */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label fw-semibold small text-muted mb-0">
                      {isEdit ? 'New Password (Optional)' : 'Password'} {!isEdit && <span className="text-danger">*</span>}
                    </label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required={!isEdit}
                    minLength={6}
                    className={`form-control mt-1 ${errors?.password ? 'is-invalid' : ''}`}
                    placeholder={isEdit ? 'Enter new password to change' : 'Minimum 6 characters'}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  {errors?.password && (
                    <div className="invalid-feedback">{errors.password[0]}</div>
                  )}
                </div>

                {/* Password Confirmation */}
                {(formData.password.length > 0 || !isEdit) && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password_confirmation"
                      required={!isEdit || formData.password.length > 0}
                      className="form-control"
                      placeholder="Re-enter password"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* Status Toggle */}
                <div className="form-check form-switch pt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_active_toggle"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <label className="form-check-label fw-semibold small ms-1" htmlFor="is_active_toggle">
                    Account Active Status
                  </label>
                  <div className="form-text small">
                    {formData.is_active
                      ? 'Employee can log in and be assigned new leads.'
                      : 'Deactivated accounts cannot log in or receive new leads.'}
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2 px-4 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  disabled={submitting}
                  style={{ backgroundColor: '#434AFA', borderColor: '#434AFA' }}
                >
                  {submitting && (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  )}
                  <span>{isEdit ? 'Save Changes' : 'Create Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}

