/**
 * Reusable Lead Status Badge Component
 */
export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  const config = {
    new: {
      bg: 'bg-primary-subtle',
      text: 'text-primary',
      border: 'border-primary-subtle',
      label: 'New',
      icon: 'bi-stars',
    },
    contacted: {
      bg: 'bg-info-subtle',
      text: 'text-info-emphasis',
      border: 'border-info-subtle',
      label: 'Contacted',
      icon: 'bi-telephone',
    },
    interested: {
      bg: 'bg-warning-subtle',
      text: 'text-warning-emphasis',
      border: 'border-warning-subtle',
      label: 'Interested',
      icon: 'bi-hand-thumbs-up',
    },
    converted: {
      bg: 'bg-success-subtle',
      text: 'text-success',
      border: 'border-success-subtle',
      label: 'Converted',
      icon: 'bi-check-circle',
    },
    lost: {
      bg: 'bg-danger-subtle',
      text: 'text-danger',
      border: 'border-danger-subtle',
      label: 'Lost',
      icon: 'bi-x-circle',
    },
  };

  const current = config[normalized] || {
    bg: 'bg-secondary-subtle',
    text: 'text-secondary',
    border: 'border-secondary-subtle',
    label: status || 'Unknown',
    icon: 'bi-question-circle',
  };

  return (
    <span
      className={`badge rounded-pill border px-2 py-1 d-inline-flex align-items-center gap-1 ${current.bg} ${current.text} ${current.border}`}
      style={{ fontSize: '0.75rem', fontWeight: 600 }}
    >
      <i className={`bi ${current.icon}`}></i>
      {current.label}
    </span>
  );
}

