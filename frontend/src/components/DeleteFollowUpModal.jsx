export default function DeleteFollowUpModal({ show, onClose, onConfirm, followUpId, leadName, loading }) {
  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1065 }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-body p-4 text-center">
              <div
                className="d-inline-flex p-3 rounded-circle bg-danger bg-opacity-10 text-danger mb-3"
                style={{ width: '64px', height: '64px', fontSize: '1.75rem' }}
              >
                <i className="bi bi-trash3-fill m-auto"></i>
              </div>
              <h5 className="fw-bold text-dark mb-2">Delete Follow-Up Record</h5>
              <p className="text-secondary small mb-3">
                Are you sure you want to permanently delete follow-up <strong>#{followUpId}</strong>
                {leadName ? ` for lead "${leadName}"` : ''}? This action cannot be undone.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 text-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

