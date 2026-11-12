import { useState, useEffect } from 'react';

export default function LeadFormModal({
  show,
  onClose,
  onSubmit,
  lead = null,
  isAdmin = false,
  availableEmployees = [],
  loading = false,
  errors = {},
}) {
  const isEdit = Boolean(lead && lead.id);

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    company_name: '',
    description: '',
    status: 'new',
    assigned_to: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        customer_name: lead.customer_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        company_name: lead.company_name || '',
        description: lead.description || '',
        status: lead.status || 'new',
        assigned_to: lead.assigned_to !== null && lead.assigned_to !== undefined ? String(lead.assigned_to) : '',
      });
    } else {
      setFormData({
        customer_name: '',
        phone: '',
        email: '',
        company_name: '',
        description: '',
        status: 'new',
        assigned_to: '',
      });
    }
  }, [lead, show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      customer_name: formData.customer_name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      company_name: formData.company_name.trim() || null,
      description: formData.description.trim() || null,
      status: formData.status,
    };

    if (isAdmin) {
      payload.assigned_to = formData.assigned_to ? Number(formData.assigned_to) : null;
    }

    onSubmit(payload);
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            {/* Modal Header */}
            <div
              className="modal-header text-white px-4 py-3"
              style={{ backgroundColor: '#434AFA' }}
            >
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
                {isEdit ? `Edit Lead #${lead.id}` : 'Create New Lead'}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
              ></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body p-4 bg-light bg-opacity-25">
                <div className="row g-3">
                  {/* Customer Name */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-secondary">
                      Customer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      className={`form-control ${errors.customer_name ? 'is-invalid' : ''}`}
                      placeholder="e.g. Ramesh Chandra"
                      value={formData.customer_name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    {errors.customer_name && (
                      <div className="invalid-feedback">{errors.customer_name[0] || errors.customer_name}</div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-secondary">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone[0] || errors.phone}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-secondary">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email[0] || errors.email}</div>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-secondary">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                      placeholder="e.g. Acme Innovations"
                      value={formData.company_name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.company_name && (
                      <div className="invalid-feedback">{errors.company_name[0] || errors.company_name}</div>
                    )}
                  </div>

                  {/* Status */}
                  <div className={`col-12 ${isAdmin ? 'col-md-6' : 'col-md-12'}`}>
                    <label className="form-label fw-semibold small text-secondary">
                      Lead Pipeline Status
                    </label>
                    <select
                      name="status"
                      className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                    {errors.status && (
                      <div className="invalid-feedback">{errors.status[0] || errors.status}</div>
                    )}
                  </div>

                  {/* Assigned Employee (Admin Only) */}
                  {isAdmin && (
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small text-secondary">
                        Assigned Employee
                      </label>
                      <select
                        name="assigned_to"
                        className={`form-select ${errors.assigned_to ? 'is-invalid' : ''}`}
                        value={formData.assigned_to}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="">-- Unassigned --</option>
                        {availableEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </select>
                      {errors.assigned_to && (
                        <div className="invalid-feedback">{errors.assigned_to[0] || errors.assigned_to}</div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-secondary">
                      Description / Lead Notes
                    </label>
                    <textarea
                      name="description"
                      rows="3"
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      placeholder="Key requirements, customer background, or budget notes..."
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                    ></textarea>
                    {errors.description && (
                      <div className="invalid-feedback">{errors.description[0] || errors.description}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer px-4 py-3 bg-white">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 text-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white rounded-pill px-4 fw-semibold shadow-sm d-flex align-items-center gap-2"
                  style={{ backgroundColor: '#434AFA', borderColor: '#434AFA' }}
                  disabled={loading}
                >
                  {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                  <span>{isEdit ? 'Save Changes' : 'Create Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

