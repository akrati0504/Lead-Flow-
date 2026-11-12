export default function EmployeeDetailModal({ show, onClose, employee }) {
  if (!show || !employee) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom bg-light py-3">
              <h5 className="modal-title fw-semibold text-dark d-flex align-items-center gap-2">
                <i className="bi bi-person-lines-fill text-primary"></i>
                <span>Employee Profile</span>
              </h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
            </div>

            <div className="modal-body p-4">
              <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style={{
                    width: '56px',
                    height: '56px',
                    fontSize: '1.4rem',
                    backgroundColor: employee.is_active ? '#434AFA' : '#6c757d',
                  }}
                >
                  {employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h5 className="mb-1 fw-bold text-dark">{employee.name}</h5>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary-subtle text-secondary border">
                      <i className="bi bi-person-badge me-1"></i>
                      {employee.role || 'employee'}
                    </span>
                    <span
                      className={`badge ${
                        employee.is_active
                          ? 'bg-success-subtle text-success border border-success'
                          : 'bg-danger-subtle text-danger border border-danger'
                      }`}
                    >
                      <i className={`bi ${employee.is_active ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                      Email Address
                    </small>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-envelope text-muted"></i>
                      <a href={`mailto:${employee.email}`} className="text-decoration-none fw-medium text-dark">
                        {employee.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                      User ID
                    </small>
                    <span className="fw-semibold text-dark">#{employee.id}</span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                      Status
                    </small>
                    <span className={employee.is_active ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                      {employee.is_active ? 'Active Account' : 'Deactivated Account'}
                    </span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                      Joined Date
                    </small>
                    <span className="small text-dark">{formatDate(employee.created_at)}</span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block text-uppercase fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                      Last Updated
                    </small>
                    <span className="small text-dark">{formatDate(employee.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light py-2 px-4 border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}

