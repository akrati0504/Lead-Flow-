import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import followUpService from '../services/followUpService';

export default function LeadDetailModal({ show, onClose, lead }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (show && lead && lead.id) {
      setLoadingHistory(true);
      setHistoryError('');
      followUpService
        .getLeadFollowUps(lead.id)
        .then((res) => {
          setHistory(res.data || []);
        })
        .catch((err) => {
          setHistoryError(err.response?.data?.message || 'Failed to load follow-up timeline.');
        })
        .finally(() => {
          setLoadingHistory(false);
        });
    } else {
      setHistory([]);
      setHistoryError('');
    }
  }, [show, lead]);

  if (!show || !lead) return null;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
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
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" role="document">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            {/* Header */}
            <div
              className="modal-header text-white px-4 py-3"
              style={{ backgroundColor: '#434AFA' }}
            >
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-person-lines-fill"></i>
                Lead Details #{lead.id}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4 bg-white">
              {/* Customer Hero Banner */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center pb-3 mb-3 border-bottom gap-2">
                <div>
                  <h4 className="fw-bold text-dark mb-1">{lead.customer_name}</h4>
                  <div className="text-muted small">
                    <i className="bi bi-building me-1"></i>
                    {lead.company_name || 'No Company Specified'}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-secondary small fw-semibold">Status:</span>
                  <StatusBadge status={lead.status} />
                </div>
              </div>

              {/* Contact Information Cards */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <div className="text-secondary small fw-semibold mb-1">
                      <i className="bi bi-telephone text-primary me-2"></i>
                      Phone Number
                    </div>
                    <div className="fw-medium text-dark">{lead.phone}</div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <div className="text-secondary small fw-semibold mb-1">
                      <i className="bi bi-envelope text-primary me-2"></i>
                      Email Address
                    </div>
                    <div className="fw-medium text-dark">{lead.email || 'Not Provided'}</div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <div className="text-secondary small fw-semibold mb-1">
                      <i className="bi bi-person-check text-primary me-2"></i>
                      Assigned Employee
                    </div>
                    <div className="fw-medium text-dark">
                      {lead.assigned_employee ? (
                        <>
                          <span className="fw-semibold">{lead.assigned_employee.name}</span>
                          <span className="text-muted small ms-1">({lead.assigned_employee.email})</span>
                        </>
                      ) : (
                        <span className="badge bg-secondary-subtle text-muted">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <div className="text-secondary small fw-semibold mb-1">
                      <i className="bi bi-person-plus text-primary me-2"></i>
                      Created By
                    </div>
                    <div className="fw-medium text-dark">
                      {lead.creator ? (
                        <>
                          <span>{lead.creator.name}</span>
                          <span className="badge bg-light text-secondary border ms-2 text-capitalize">
                            {lead.creator.role}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">System</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description / Requirements */}
              <div className="mb-4">
                <h6 className="fw-semibold text-secondary small text-uppercase tracking-wider mb-2">
                  Notes &amp; Description
                </h6>
                <div className="p-3 bg-light rounded-3 border-start border-3 border-primary text-secondary small" style={{ minHeight: '56px' }}>
                  {lead.description || <span className="fst-italic text-muted">No additional notes or description recorded.</span>}
                </div>
              </div>

              {/* Follow-up Timeline History Section */}
              <div className="mb-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-clock-history text-primary"></i>
                    Follow-Up History &amp; Timeline
                  </h6>
                  <span className="badge bg-light text-secondary border rounded-pill">
                    {history.length} Interactions
                  </span>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span>Loading history...</span>
                  </div>
                ) : historyError ? (
                  <div className="alert alert-warning py-2 small mb-0 rounded-3">
                    <i className="bi bi-exclamation-triangle me-1"></i> {historyError}
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-3 bg-light rounded-3 text-center text-muted small">
                    <i className="bi bi-chat-square-dots d-block fs-3 mb-1 text-secondary opacity-50"></i>
                    No follow-ups recorded yet for this lead.
                  </div>
                ) : (
                  <div className="list-group list-group-flush rounded-3 border">
                    {history.map((item) => (
                      <div key={item.id} className="list-group-item p-3">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className="fw-semibold text-dark small">
                            <i className="bi bi-person me-1 text-primary"></i>
                            {item.creator?.name || 'Staff'}
                          </span>
                          <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                            {formatDate(item.follow_up_date)}
                          </span>
                        </div>
                        <p className="text-secondary small mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                          {item.remarks}
                        </p>
                        {item.next_follow_up_date && (
                          <div className="small">
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              <i className="bi bi-calendar2-event me-1"></i>
                              Next Reminder: {formatDate(item.next_follow_up_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata Timestamps */}
              <div className="row g-2 pt-2 border-top text-muted small">
                <div className="col-12 col-sm-6">
                  <i className="bi bi-calendar-event me-1"></i>
                  Created: <strong>{formatDate(lead.created_at)}</strong>
                </div>
                <div className="col-12 col-sm-6 text-sm-end">
                  <i className="bi bi-clock-history me-1"></i>
                  Last Updated: <strong>{formatDate(lead.updated_at)}</strong>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer px-4 py-3 bg-light">
              <button
                type="button"
                className="btn btn-secondary rounded-pill px-4"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
