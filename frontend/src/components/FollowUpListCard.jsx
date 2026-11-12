export default function FollowUpListCard({
  followUps = [],
  period = 'today',
  onPeriodChange,
  loading = false,
}) {
  const tabs = [
    { key: 'today', label: 'Due Today', icon: 'bi-calendar-event' },
    { key: 'upcoming', label: 'Upcoming (7 Days)', icon: 'bi-calendar-plus' },
    { key: 'overdue', label: 'Overdue', icon: 'bi-exclamation-triangle' },
  ];

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
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
    <div className="card border-0 shadow-sm rounded-4 h-100">
      {/* Header and Filter Tabs */}
      <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Scheduled Follow-Ups</h5>
            <small className="text-muted">Interactions and reminders by schedule</small>
          </div>
          <span className="badge bg-light text-secondary border rounded-pill px-2 py-1 align-self-start align-self-sm-auto">
            {followUps.length} Found
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="btn-group w-100 rounded-3 p-1 bg-light border" role="group">
          {tabs.map((tab) => {
            const isActive = period === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onPeriodChange && onPeriodChange(tab.key)}
                className={`btn btn-sm rounded-2 d-flex align-items-center justify-content-center gap-2 fw-medium transition-all ${
                  isActive
                    ? 'btn-white bg-white text-primary shadow-sm'
                    : 'text-secondary border-0'
                }`}
                style={isActive ? { color: '#434AFA', fontWeight: 600 } : {}}
              >
                <i className={`bi ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body List */}
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <span>Loading follow-ups...</span>
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-calendar2-check fs-2 d-block mb-2 text-secondary opacity-50"></i>
            <p className="mb-0 fw-medium">No follow-ups scheduled for this period.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary text-uppercase small" style={{ fontSize: '0.75rem' }}>
                <tr>
                  <th className="ps-4">Lead / Customer</th>
                  <th>Remarks</th>
                  <th>Next Date</th>
                  <th>Follow-up Date</th>
                  <th className="pe-4 text-end">Created By</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 py-3">
                      <div className="fw-semibold text-dark">
                        {item.lead?.customer_name || `Lead #${item.lead_id}`}
                      </div>
                      {item.lead?.phone && (
                        <div className="small text-muted">
                          <i className="bi bi-telephone me-1"></i>
                          {item.lead.phone}
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div className="small text-dark text-truncate" title={item.remarks}>
                        {item.remarks}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill px-2 py-1 ${
                          period === 'overdue'
                            ? 'bg-danger-subtle text-danger border border-danger-subtle'
                            : 'bg-primary-subtle text-primary border border-primary-subtle'
                        }`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        <i className="bi bi-clock me-1"></i>
                        {formatDate(item.next_follow_up_date)}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {formatDate(item.follow_up_date)}
                    </td>
                    <td className="pe-4 text-end small">
                      <span className="text-secondary fw-medium">
                        {item.creator?.name || 'Staff'}
                      </span>
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

