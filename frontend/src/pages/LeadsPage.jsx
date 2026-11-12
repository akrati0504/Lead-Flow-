import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../layouts/AppLayout';
import StatusBadge from '../components/StatusBadge';
import LeadFormModal from '../components/LeadFormModal';
import LeadDetailModal from '../components/LeadDetailModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import leadService from '../services/leadService';
import employeeService from '../services/employeeService';
import { useAuth } from '../context/AuthContext';

export default function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Leads state
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeEmployees, setActiveEmployees] = useState([]);

  // Fetch active employees for Admin dropdowns
  useEffect(() => {
    if (isAdmin) {
      employeeService
        .getEmployees({ is_active: true, per_page: 100 })
        .then((res) => {
          setActiveEmployees(res.data || []);
        })
        .catch((_err) => {
          // If fail, fallback will use observed employees
        });
    }
  }, [isAdmin]);

  // Loading & Alert states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'danger', message: '' }
  const [formErrors, setFormErrors] = useState({});

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Search debounce handler
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch leads callback
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch.trim(),
        status: statusFilter,
        page: currentPage,
        per_page: 10,
      };

      if (isAdmin && assignedFilter) {
        params.assigned_to = assignedFilter;
      }

      const res = await leadService.getLeads(params);
      setLeads(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to load leads from server.',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, assignedFilter, currentPage, isAdmin]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Extract employees observed in leads list or combined with activeEmployees for Admin filter dropdown
  const observedEmployees = useMemo(() => {
    const empMap = new Map();
    activeEmployees.forEach((emp) => empMap.set(emp.id, emp));
    leads.forEach((l) => {
      if (l.assigned_employee) {
        empMap.set(l.assigned_employee.id, l.assigned_employee);
      }
    });
    return Array.from(empMap.values());
  }, [leads, activeEmployees]);

  // Handle Create Lead
  const handleOpenCreate = () => {
    setSelectedLead(null);
    setFormErrors({});
    setShowFormModal(true);
  };

  // Handle Edit Lead
  const handleOpenEdit = async (lead) => {
    setFormErrors({});
    setSelectedLead(lead);
    setShowFormModal(true);
    // Optionally fetch latest detail
    try {
      const res = await leadService.getLead(lead.id);
      setSelectedLead(res.data);
    } catch (_err) {
      // Keep existing lead object
    }
  };

  // Handle Form Submission (Create or Update)
  const handleFormSubmit = async (payload) => {
    setActionLoading(true);
    setFormErrors({});
    try {
      if (selectedLead && selectedLead.id) {
        await leadService.updateLead(selectedLead.id, payload);
        setAlert({ type: 'success', message: 'Lead updated successfully.' });
      } else {
        await leadService.createLead(payload);
        setAlert({ type: 'success', message: 'Lead created successfully.' });
      }
      setShowFormModal(false);
      fetchLeads();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setFormErrors(err.response.data?.errors || {});
      } else {
        setAlert({
          type: 'danger',
          message: err.response?.data?.message || 'An error occurred while saving the lead.',
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle View Details
  const handleOpenDetail = async (lead) => {
    setDetailLead(lead);
    setShowDetailModal(true);
    try {
      const res = await leadService.getLead(lead.id);
      setDetailLead(res.data);
    } catch (_err) {
      // Retain already set lead info
    }
  };

  // Handle Delete Confirmation
  const handleOpenDelete = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setActionLoading(true);
    try {
      await leadService.deleteLead(leadToDelete.id);
      setAlert({ type: 'success', message: 'Lead deleted successfully.' });
      setShowDeleteModal(false);
      setLeadToDelete(null);
      fetchLeads();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to delete lead.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppLayout pageTitle={isAdmin ? 'All Leads Management' : 'My Assigned Leads'}>
      {/* Alert Banner */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show rounded-3 mb-4 shadow-sm`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Action Header Card */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h4 className="fw-bold mb-1 text-dark">
              {isAdmin ? 'Lead Management' : 'My Assigned Leads'}
            </h4>
            <p className="text-muted small mb-0">
              {isAdmin
                ? 'Create, assign, filter and manage company prospects.'
                : 'View, edit and update progress on your assigned prospects.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn text-white rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm align-self-start align-self-md-auto"
            style={{ backgroundColor: '#434AFA', borderColor: '#434AFA' }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Create New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
        <div className="row g-3 align-items-center">
          {/* Search Field */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by customer name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary border-start-0 bg-light text-muted"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light text-secondary"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Admin Employee Filter */}
          {isAdmin && (
            <div className="col-6 col-md-3">
              <select
                className="form-select bg-light text-secondary"
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Assignments</option>
                <option value="unassigned">Unassigned Leads</option>
                {observedEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters Button */}
          <div className={`col-12 ${isAdmin ? 'col-md-1' : 'col-md-4'} text-md-end`}>
            <button
              className="btn btn-light btn-sm text-secondary rounded-pill px-3 py-2 w-100 w-md-auto"
              title="Reset Filters"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setAssignedFilter('');
                setCurrentPage(1);
              }}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Leads Table Card */}
      <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Lead Directory</h5>
            <small className="text-muted">Total: {pagination.total} leads found</small>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
              <span>Loading leads...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
              <p className="mb-0 fw-semibold">No matching leads found.</p>
              <small className="text-muted">Try adjusting your search criteria or create a new lead.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary text-uppercase small" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                  <tr>
                    <th className="ps-4">ID</th>
                    <th>Customer Name</th>
                    <th>Phone / Contact</th>
                    <th>Company</th>
                    <th>Status</th>
                    {isAdmin && <th>Assigned To</th>}
                    <th>Created</th>
                    <th className="pe-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="ps-4 small text-muted fw-bold">#{lead.id}</td>
                      <td className="py-3">
                        <div className="fw-bold text-dark">{lead.customer_name}</div>
                        {lead.email && <div className="small text-muted">{lead.email}</div>}
                      </td>
                      <td className="small text-secondary">
                        <div>
                          <i className="bi bi-telephone text-primary me-1"></i>
                          {lead.phone}
                        </div>
                      </td>
                      <td className="small text-secondary">
                        {lead.company_name || <span className="text-muted fst-italic">N/A</span>}
                      </td>
                      <td>
                        <StatusBadge status={lead.status} />
                      </td>
                      {isAdmin && (
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
                      )}
                      <td className="small text-muted">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="pe-4 text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenDetail(lead)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenEdit(lead)}
                            title="Edit Lead"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleOpenDelete(lead)}
                              title="Delete Lead"
                            >
                              <i className="bi bi-trash3"></i>
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

        {/* Pagination Footer */}
        {pagination.last_page > 1 && (
          <div className="card-footer bg-white border-0 py-3 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <span className="small text-muted">
              Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total leads)
            </span>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pagination.current_page <= 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={pagination.current_page <= 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pg) => (
                <li
                  key={pg}
                  className={`page-item ${pagination.current_page === pg ? 'active' : ''}`}
                >
                  <button
                    className="page-link"
                    style={
                      pagination.current_page === pg
                        ? { backgroundColor: '#434AFA', borderColor: '#434AFA' }
                        : {}
                    }
                    onClick={() => setCurrentPage(pg)}
                  >
                    {pg}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${
                  pagination.current_page >= pagination.last_page ? 'disabled' : ''
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.last_page))}
                  disabled={pagination.current_page >= pagination.last_page}
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Modals */}
      <LeadFormModal
        show={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        lead={selectedLead}
        isAdmin={isAdmin}
        availableEmployees={observedEmployees}
        loading={actionLoading}
        errors={formErrors}
      />

      <LeadDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        lead={detailLead}
      />

      {isAdmin && (
        <DeleteConfirmModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          leadName={leadToDelete?.customer_name || ''}
          loading={actionLoading}
        />
      )}
    </AppLayout>
  );
}

