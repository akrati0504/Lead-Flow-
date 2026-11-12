/**
 * Reusable Metric Statistic Card
 */
export default function StatCard({ title, count, icon, color = '#434AFA', bgLight = 'rgba(67, 74, 250, 0.1)', subtitle }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-3 d-flex align-items-center justify-content-between gap-2">
        <div className="text-truncate">
          <span
            className="text-secondary small fw-semibold text-uppercase d-block text-truncate"
            style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}
            title={title}
          >
            {title}
          </span>
          <h3 className="fw-bold mb-0 mt-1" style={{ color: '#1e293b', fontSize: '1.5rem' }}>
            {count ?? 0}
          </h3>
          {subtitle && (
            <small className="text-muted d-block mt-1 text-truncate" style={{ fontSize: '0.72rem' }} title={subtitle}>
              {subtitle}
            </small>
          )}
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: bgLight,
            color: color,
            fontSize: '1.25rem',
          }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
    </div>
  );
}
