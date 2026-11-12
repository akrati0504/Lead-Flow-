export default function FollowUpDetailModal({ show, onClose, followUp }) {
  if (!show || !followUp) return null;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Not Scheduled';
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
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            {/* Header */}
            <div
              className="modal-header text-white px-4 py-3"
              style={{ backgroundColor: '#434AFA' }}
            >
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-chat-left-text-fill"></i>
                Follow-Up Record #{followUp.id}
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
              {/* Linked Customer Card */}
              <div className="p-3 bg-light rounded-3 mb-4 border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                <div>
                  <span className="text-secondary small fw-semibold text-uppercase tracking-wider d-block">
                    Linked Prospect
                  </span>
                  <h5 className="fw-bold text-dark mb-0 mt-1">
                    {followUp.lead?.customer_name || `Lead #${followUp.lead_id}`}
                  </h5>
                  <div className="small text-muted mt-1">
                    <span className="me-3">
                      <i className="bi bi-telephone text-primary me-1"></i>
                      {followUp.lead?.phone || 'N/A'}
                    </span>
                    {followUp.lead?.company_name && (
                      <span>
                        <i className="bi bi-building text-primary me-1"></i>
                        {followUp.lead.company_name}
                      </span>
                    )}
                  </div>
                </div>
                {followUp.lead?.status && (
                  <span className="badge bg-white text-secondary border rounded-pill px-3 py-2 text-uppercase" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    Status: {followUp.lead.status}
                  </span>
                )}
              </div>

              {/* Schedule Timing Information */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <div className="text-secondary small fw-semibold mb-1">
                      <i className="bi bi-calendar-check text-primary me-2"></i>
                      Interaction Date &amp; Time
                    </div>
                    <div className="fw-semibold text-dark fs-6">
                      {formatDate(followUp.follow_up_date)}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <div className="text-secondary small fw-semibold mb-1">
                      <i className="bi bi-clock-history text-primary me-2"></i>
                      Next Scheduled Follow-Up
                    </div>
                    <div className="fw-semibold text-dark fs-6">
                      {formatDate(followUp.next_follow_up_date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks Box */}
              <div className="mb-4">
                <h6 className="fw-semibold text-secondary small text-uppercase tracking-wider mb-2">
                  Follow-Up Discussion Remarks
                </h6>
                <div className="p-3 bg-light rounded-3 border-start border-3 border-primary text-secondary" style={{ whiteSpace: 'pre-wrap', minHeight: '80px' }}>
                  {followUp.remarks || 'No remarks provided.'}
                </div>
              </div>

              {/* Metadata details */}
              <div className="row g-2 pt-2 border-top text-muted small">
                <div className="col-12 col-sm-4">
                  <i className="bi bi-person me-1"></i>
                  Created By: <strong>{followUp.creator?.name || 'Staff'}</strong> ({followUp.creator?.role || 'user'})
                </div>
                <div className="col-12 col-sm-4">
                  <i className="bi bi-calendar-event me-1"></i>
                  Logged: <strong>{formatDate(followUp.created_at)}</strong>
                </div>
                <div className="col-12 col-sm-4 text-sm-end">
                  <i className="bi bi-arrow-repeat me-1"></i>
                  Updated: <strong>{formatDate(followUp.updated_at)}</strong>
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

