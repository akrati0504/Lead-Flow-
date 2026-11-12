import { useState, useEffect, useCallback, useTransition } from 'react';
import AppLayout from '../layouts/AppLayout';
import employeeService from '../services/employeeService';
import EmployeeFormModal from '../components/EmployeeFormModal';
import EmployeeDetailModal from '../components/EmployeeDetailModal';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // '', '1', '0'
  const [page, setPage] = useState(1);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Deactivate / Activate confirmation dialog state
  const [statusConfirmModal, setStatusConfirmModal] = useState({
    show: false,
    employee: null,
    targetStatus: false,
    submitting: false,
  });

  const [, startTransition] = useTransition();

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        per_page: 10,
      };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (activeFilter !== '') {
        params.is_active = activeFilter === '1';
      }

      const res = await employeeService.getEmployees(params);
      setEmployees(res.data || []);
      setPagination(
        res.meta || {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: res.data?.length || 0,
        }
      );
    } catch (err) {
      console.error('Failed to fetch employees', err);
      setError(err?.response?.data?.message || 'Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, activeFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    startTransition(() => {
      setSearchTerm(val);
      setPage(1);
    });
  };

  const handleFilterChange = (e) => {
    setActiveFilter(e.target.value);
    setPage(1);
  };

  // Create Modal
  const handleOpenCreateModal = () => {
    setSelectedEmployee(null);
    setFormErrors({});
    setFormModalOpen(true);
  };

  // Edit Modal
  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormErrors({});
    setFormModalOpen(true);
  };

  // View Modal
  const handleOpenDetailModal = (emp) => {
    setSelectedEmployee(emp);
    setDetailModalOpen(true);
  };

  // Form Submit (Create or Edit)
  const handleFormSubmit = async (formData) => {
    try {
      setFormSubmitting(true);
      setFormErrors({});

      if (selectedEmployee) {
        await employeeService.updateEmployee(selectedEmployee.id, formData);
        setFeedbackMsg({ type: 'success', text: `Employee "${formData.name}" updated successfully.` });
      } else {
        await employeeService.createEmployee(formData);
        setFeedbackMsg({ type: 'success', text: `Employee "${formData.name}" created successfully.` });
      }

      setFormModalOpen(false);
      fetchEmployees();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setFormErrors({ general: err?.response?.data?.message || 'An unexpected error occurred.' });
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Status Change Confirmation Modal
  const handlePromptStatusChange = (emp, targetStatus) => {
    setStatusConfirmModal({
      show: true,
      employee: emp,
      targetStatus,
      submitting: false,
    });
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    const { employee, targetStatus } = statusConfirmModal;
    if (!employee) return;

    try {
      setStatusConfirmModal((prev) => ({ ...prev, submitting: true }));
      await employeeService.toggleActiveStatus(employee.id, targetStatus);
      setFeedbackMsg({
        type: 'success',
        text: `Employee account "${employee.name}" has been ${targetStatus ? 'activated' : 'deactivated'}.`,
      });
      setStatusConfirmModal({ show: false, employee: null, targetStatus: false, submitting: false });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to change status', err);
      alert(err?.response?.data?.message || 'Failed to update employee status.');
      setStatusConfirmModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
          <AppLayout pageTitle="Employee Management">
            {/* Action Header Card */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h4 className="fw-bold mb-1 text-dark">Staff Directory & User Accounts</h4>
                  <p className="text-muted small mb-0">
                    Manage team accounts, credential resets, and active login permissions.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="btn text-white rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm align-self-start align-self-md-auto"
                  style={{ backgroundColor: '#434AFA', borderColor: '#434AFA' }}
                >
                  <i className="bi bi-person-plus-fill"></i>
                  <span>Add New Employee</span>
                </button>
              </div>
            </div>

            {/* Feedback Toast / Alert */}
            {feedbackMsg && (
              <div
                className={`alert alert-${feedbackMsg.type} alert-dismissible fade show shadow-sm border-0 mb-4 rounded-3`}
                role="alert"
              >
                <i
                  className={`bi ${feedbackMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'
                    } me-2`}
                ></i>
                {feedbackMsg.text}
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setFeedbackMsg(null)}
                ></button>
              </div>
            )}

            {/* Filters and Search Bar */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white p-3">
                      <div className="row g-3 align-items-center">
                        {/* Search Input */}
                        <div className="col-12 col-md-6 col-lg-5">
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted">
                              <i className="bi bi-search"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control bg-light border-start-0"
                              placeholder="Search staff by name or email..."
                              value={searchTerm}
                              onChange={handleSearchChange}
                            />
                            {searchTerm && (
                              <button
                                className="btn btn-outline-secondary border-start-0 bg-light text-muted"
                                type="button"
                                onClick={() => {
                                  setSearchTerm('');
                                  setPage(1);
                                }}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status Filter */}
                        <div className="col-6 col-md-3">
                          <select className="form-select bg-light text-secondary" value={activeFilter} onChange={handleFilterChange}>
                            <option value="">All Account Statuses</option>
                            <option value="1">Active Only</option>
                            <option value="0">Inactive Only</option>
                          </select>
                        </div>

                        {/* Clear / Reset */}
                        <div className="col-6 col-md-4 text-end">
                          <button
                            className="btn btn-light btn-sm text-secondary rounded-pill px-3 py-2"
                            onClick={() => {
                              setSearchTerm('');
                              setActiveFilter('');
                              setPage(1);
                            }}
                            title="Reset filters"
                          >
                            <i className="bi bi-arrow-counterclockwise me-1"></i>
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Main Table Card */}
                          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
                            <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
                              <div>
                                <h5 className="fw-bold mb-0 text-dark">Employee List</h5>
                                <small className="text-muted">Total: {pagination.total} staff accounts</small>
                              </div>
                                </div>

                                <div className="card-body p-0">
                                  {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
              <span>Loading employees...</span>
            </div>
          ) : error ? (
                                  <div className="text-center py-5">
                                    <i className="bi bi-exclamation-circle text-danger fs-1"></i>
                                    <h5 className="mt-3 text-danger">{error}</h5>
                                    <button className="btn btn-outline-primary btn-sm mt-2 rounded-pill px-3" onClick={fetchEmployees}>
                                      Retry
                                    </button>
                                  </div>
                                  ) : employees.length === 0 ? (
                                  <div className="text-center py-5">
                                    <div
                                      className="rounded-circle d-inline-flex align-items-center justify-content-center bg-light text-muted mb-3"
                                      style={{ width: '64px', height: '64px' }}
                                    >
                                                  <i className="bi bi-people fs-2 text-primary" style={{ color: '#434AFA' }}></i>
                                                </div>
                                                <h5 className="fw-bold text-dark">No Employees Found</h5>
                                                <p className="text-muted small mb-3">
                                                  {searchTerm || activeFilter
                                                    ? 'Try adjusting your search query or filter criteria.'
                                                    : 'No employee accounts have been created yet. Add staff members to start assigning leads.'}
                                                </p>
                                                {!searchTerm && !activeFilter && (
                                                  <button
                                                    className="btn text-white rounded-pill px-4 py-2 fw-semibold shadow-sm"
                                                    style={{ backgroundColor: '#434AFA', borderColor: '#434AFA' }}
                                                    onClick={handleOpenCreateModal}
                                                  >
                                                    <i className="bi bi-person-plus-fill me-1"></i> Add First Employee
                                                  </button>
                                                )}
                                              </div>
                                              ) : (
                                              <div className="table-responsive">
                                                <table className="table table-hover align-middle mb-0">
                                                  <thead className="table-light text-secondary text-uppercase small" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                                    <tr>
                                                      <th className="ps-4 py-3" style={{ width: '80px' }}>ID</th>
                                                      <th className="py-3">Employee</th>
                                                      <th className="py-3">Email Address</th>
                                                      <th className="py-3">Account Status</th>
                                                      <th className="py-3">Joined Date</th>
                                                      <th className="pe-4 py-3 text-end" style={{ width: '160px' }}>Actions</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="ps-4 fw-bold text-muted small">#{emp.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-semibold small flex-shrink-0 shadow-sm"
                            style={{
                              width: '36px',
                              height: '36px',
                              backgroundColor: emp.is_active ? '#434AFA' : '#94a3b8',
                            }}
                          >
                            {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{emp.name}</div>
                            <small className="text-muted">Sales Staff</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-secondary small">{emp.email}</span>
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            emp.is_active
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-danger-subtle text-danger border border-danger-subtle'
                          }`}
                          style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                        >
                          <i className={`bi ${emp.is_active ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                                                  <td className="text-muted small">
                                                    {emp.created_at
                                                      ? new Date(emp.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                      })
                                                      : '—'}
                                                  </td>
                                                  <td className="pe-4 text-end">
                                                    <div className="btn-group btn-group-sm">
                                                      {/* View Button */}
                                                      <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        title="View Details"
                                                        onClick={() => handleOpenDetailModal(emp)}
                                                      >
                                                        <i className="bi bi-eye"></i>
                                                      </button>

                                                      {/* Edit Button */}
                                                      <button
                                                        type="button"
                                                        className="btn btn-outline-primary"
                                                        title="Edit Employee / Password"
                                                        onClick={() => handleOpenEditModal(emp)}
                                                      >
                                                        <i className="bi bi-pencil"></i>
                                                      </button>

                                        {/* Deactivate / Reactivate Toggle */}
                                        {emp.is_active ? (
                                          <button
                                            type="button"
                                            className="btn btn-outline-danger"
                                            title="Deactivate Account"
                                            onClick={() => handlePromptStatusChange(emp, false)}
                                          >
                                            <i className="bi bi-slash-circle"></i>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            className="btn btn-outline-success"
                                            title="Reactivate Account"
                                            onClick={() => handlePromptStatusChange(emp, true)}
                                          >
                                            <i className="bi bi-check-circle"></i>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                  ))}
                                </tbody>
                              </table>
                            </div>
          )}
                          </div>

                          {/* Server-Side Pagination Footer */}
                          {!loading && employees.length > 0 && pagination.last_page > 1 && (
                              <div className="card-footer bg-white border-0 py-3 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                                <span className="small text-muted">
                                  Page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total staff)
                                </span>
                                <ul className="pagination pagination-sm mb-0">
                                  <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                      Previous
                                    </button>
                                  </li>
                                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                                    <li key={p} className={`page-item ${pagination.current_page === p ? 'active' : ''}`}>
                                      <button
                                        className="page-link"
                                        style={
                                          pagination.current_page === p
                                            ? { backgroundColor: '#434AFA', borderColor: '#434AFA' }
                                            : {}
                                        }
                                        onClick={() => setPage(p)}
                                      >
                                        {p}
                                      </button>
                                    </li>
                                  ))}
                                  <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                    <button
                                      className="page-link"
                                      onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                                    >
                                      Next
                                    </button>
                                  </li>
                                </ul>
                              </div>
        )}
                            </div>

      {/* Modals */}
                          <EmployeeFormModal
                            show={formModalOpen}
                            onClose={() => setFormModalOpen(false)}
                            onSubmit={handleFormSubmit}
                            employee={selectedEmployee}
                            submitting={formSubmitting}
                            errors={formErrors}
                          />

                          <EmployeeDetailModal
                            show={detailModalOpen}
                            onClose={() => setDetailModalOpen(false)}
                            employee={selectedEmployee}
                          />

                          {/* Deactivate / Reactivate Confirmation Dialog */}
                          {statusConfirmModal.show && (
        <>
                                <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
                                  <div className="modal-dialog modal-dialog-centered">
                                          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                            <div className="modal-header border-bottom bg-light px-4 py-3">
                                              <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                                                <i
                                                  className={`bi ${statusConfirmModal.targetStatus
                                                        ? 'bi-check-circle-fill text-success'
                                                        : 'bi-exclamation-triangle-fill text-warning'
                                                    }`}
                                                ></i>
                                                <span>
                                                  {statusConfirmModal.targetStatus ? 'Reactivate Account' : 'Deactivate Staff Account'}
                                                </span>
                                              </h5>
                                              <button
                                                type="button"
                                                className="btn-close"
                                                aria-label="Close"
                                                onClick={() =>
                                                  setStatusConfirmModal({
                                                    show: false,
                                                    employee: null,
                                                    targetStatus: false,
                                                    submitting: false,
                                                  })
                                                }
                                                disabled={statusConfirmModal.submitting}
                                              ></button>
                                            </div>
                                                <div className="modal-body p-4 bg-white">
                                                  <p className="mb-2 text-dark">
                                                    Are you sure you want to{' '}
                                                    <strong>{statusConfirmModal.targetStatus ? 'reactivate' : 'deactivate'}</strong> the account
                                                    for <strong>{statusConfirmModal.employee?.name}</strong>?
                                                  </p>
                                                  {!statusConfirmModal.targetStatus ? (
                    <div className="alert alert-warning small mb-0 mt-3 rounded-3 border-0 shadow-sm">
                      <div className="fw-bold mb-1">
                        <i className="bi bi-shield-exclamation me-1"></i> Data Preservation Guarantee:
                      </div>
                      The employee will immediately be blocked from logging in and cannot receive new lead assignments.
                      All past customer leads and follow-up interaction histories associated with this employee will remain intact and safely preserved.
                    </div>
                  ) : (
                    <div className="alert alert-success small mb-0 mt-3 rounded-3 border-0 shadow-sm">
                      <i className="bi bi-shield-check me-1"></i>
                      The employee will regain full system access and can once again be assigned new leads.
                    </div>
                  )}
                </div>
                <div className="modal-footer bg-light py-3 px-4 border-top">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4 text-secondary"
                    onClick={() =>
                      setStatusConfirmModal({
                        show: false,
                        employee: null,
                        targetStatus: false,
                        submitting: false,
                      })
                    }
                    disabled={statusConfirmModal.submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn rounded-pill px-4 fw-semibold ${
                      statusConfirmModal.targetStatus ? 'btn-success' : 'btn-danger'
                    }`}
                    onClick={handleConfirmStatusChange}
                    disabled={statusConfirmModal.submitting}
                  >
                    {statusConfirmModal.submitting && (
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    )}
                    {statusConfirmModal.targetStatus ? 'Confirm Reactivation' : 'Confirm Deactivation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
        </>
      )}
                                          </AppLayout>
                                          );
}
