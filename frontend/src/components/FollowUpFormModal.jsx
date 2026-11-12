import { useState, useEffect } from 'react';

export default function FollowUpFormModal({
  show,
  onClose,
  onSubmit,
  followUp = null,
  availableLeads = [],
  loading = false,
  errors = {},
}) {
  const isEdit = Boolean(followUp && followUp.id);

  // Helper to format ISO strings to 'YYYY-MM-DDTHH:mm' for datetime-local input
  const toLocalInputFormat = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const pad = (n) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const getNowLocalInputFormat = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    lead_id: '',
    follow_up_date: getNowLocalInputFormat(),
    remarks: '',
    next_follow_up_date: '',
  });

  useEffect(() => {
    if (followUp) {
      setFormData({
        lead_id: followUp.lead_id ? String(followUp.lead_id) : '',
        follow_up_date: toLocalInputFormat(followUp.follow_up_date) || getNowLocalInputFormat(),
        remarks: followUp.remarks || '',
        next_follow_up_date: toLocalInputFormat(followUp.next_follow_up_date) || '',
      });
    } else {
      setFormData({
        lead_id: availableLeads.length > 0 ? String(availableLeads[0].id) : '',
        follow_up_date: getNowLocalInputFormat(),
        remarks: '',
        next_follow_up_date: '',
      });
    }
  }, [followUp, show, availableLeads]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null,
      remarks: formData.remarks.trim(),
      next_follow_up_date: formData.next_follow_up_date ? new Date(formData.next_follow_up_date).toISOString() : null,
    };

    if (!isEdit) {
      payload.lead_id = formData.lead_id ? Number(formData.lead_id) : null;
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
                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-calendar-plus-fill'}`}></i>
                {isEdit ? `Edit Follow-Up #${followUp.id}` : 'Schedule Follow-Up'}
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
                  {/* Lead Selection (Disabled during edit to protect lead_id immutability) */}
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-secondary">
                      Target Lead / Customer <span className="text-danger">*</span>
                    </label>
                    {isEdit ? (
                      <div className="p-3 bg-light border rounded-3 text-dark fw-medium">
                        <i className="bi bi-person-fill text-primary me-2"></i>
                        {followUp?.lead?.customer_name || `Lead #${followUp?.lead_id}`}
                        {followUp?.lead?.phone && <span className="text-muted small ms-2">({followUp.lead.phone})</span>}
                        {followUp?.lead?.company_name && (
                          <span className="text-muted small ms-2">&bull; {followUp.lead.company_name}</span>
                        )}
                      </div>
                    ) : (
                      <select
                        name="lead_id"
                        className={`form-select ${errors.lead_id ? 'is-invalid' : ''}`}
                        value={formData.lead_id}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      >
                        <option value="">-- Select a Lead --</option>
                        {availableLeads.map((l) => (
                          <option key={l.id} value={l.id}>
                            #{l.id} - {l.customer_name} ({l.phone}) {l.company_name ? `• ${l.company_name}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.lead_id && (
                      <div className="invalid-feedback d-block">{errors.lead_id[0] || errors.lead_id}</div>
                    )}
                  </div>

                  {/* Follow-up Date and Time */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-secondary">
                      Interaction Date &amp; Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="follow_up_date"
                      className={`form-control ${errors.follow_up_date ? 'is-invalid' : ''}`}
                      value={formData.follow_up_date}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    {errors.follow_up_date && (
                      <div className="invalid-feedback">{errors.follow_up_date[0] || errors.follow_up_date}</div>
                    )}
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Date when the discussion or call took place.
                    </small>
                  </div>

                  {/* Next Follow-up Date and Time */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-secondary">
                      Next Follow-Up Date &amp; Time <span className="text-muted fw-normal">(Optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="next_follow_up_date"
                      className={`form-control ${errors.next_follow_up_date ? 'is-invalid' : ''}`}
                      value={formData.next_follow_up_date}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.next_follow_up_date && (
                      <div className="invalid-feedback">{errors.next_follow_up_date[0] || errors.next_follow_up_date}</div>
                    )}
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Next planned reminder date (sets Today / Upcoming / Overdue status).
                    </small>
                  </div>

                  {/* Remarks */}
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-secondary">
                      Discussion Remarks &amp; Notes <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="remarks"
                      rows="4"
                      className={`form-control ${errors.remarks ? 'is-invalid' : ''}`}
                      placeholder="Summarize conversation, discussed pricing, objections, or next deliverables..."
                      value={formData.remarks}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    ></textarea>
                    {errors.remarks && (
                      <div className="invalid-feedback">{errors.remarks[0] || errors.remarks}</div>
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
                  <span>{isEdit ? 'Save Changes' : 'Record Follow-Up'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

