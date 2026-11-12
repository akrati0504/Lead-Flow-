import StatusBadge from '../components/StatusBadge';

export default function RecentLeadsTable({ leads = [], loading = false }) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-4 h-100">
        <div className="card-header bg-white border-0 pt-4 px-4">
          <h5 className="fw-bold mb-0 text-dark">Recent Leads</h5>
        </div>
        <div className="card-body p-4 text-center text-muted py-5">
          <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
          <span>Loading recent leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="fw-bold mb-0 text-dark">Recent Leads</h5>
          <small className="text-muted">Latest prospective customer entries</small>
        </div>
        <span className="badge bg-light text-secondary border rounded-pill px-2 py-1">
          {leads.length} Records
        </span>
      </div>

      <div className="card-body p-0">
        {leads.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary opacity-50"></i>
            <p className="mb-0 fw-medium">No recent leads found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary text-uppercase small" style={{ fontSize: '0.75rem' }}>
                <tr>
                  <th className="ps-4">Customer</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th className="pe-4 text-end">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="ps-4 py-3">
                      <div className="fw-semibold text-dark">{lead.customer_name}</div>
                      {lead.email && (
                        <div className="small text-muted text-truncate" style={{ maxWidth: '160px' }}>
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td className="text-secondary small">{lead.phone}</td>
                    <td className="text-secondary small">
                      {lead.company_name || <span className="text-muted fst-italic">N/A</span>}
                    </td>
                    <td>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="small">
                      {lead.assigned_employee ? (
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-person me-1 text-primary"></i>
                          {lead.assigned_employee.name}
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="pe-4 text-end small text-muted">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

