import AppLayout from '../layouts/AppLayout';

export default function PlaceholderPage({ title, moduleName }) {
  return (
    <AppLayout pageTitle={title}>
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
        <div
          className="d-inline-flex p-3 rounded-circle mx-auto mb-3"
          style={{ backgroundColor: 'rgba(67, 74, 250, 0.1)', color: '#434AFA' }}
        >
          <i className="bi bi-tools fs-1"></i>
        </div>
        <h4 className="fw-bold mb-2 text-dark">{moduleName} Module</h4>
        <p className="text-muted mx-auto" style={{ maxWidth: '520px' }}>
          This module is scheduled for implementation in a future step. Backend APIs and data models for this feature are already built and tested.
        </p>
        <div className="mt-3">
          <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill">
            <i className="bi bi-clock-history me-1"></i> Phase Pending
          </span>
        </div>
      </div>
    </AppLayout>
  );
}

