import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../layouts/AppLayout';
import FollowUpFormModal from '../components/FollowUpFormModal';
import FollowUpDetailModal from '../components/FollowUpDetailModal';
import DeleteFollowUpModal from '../components/DeleteFollowUpModal';
import followUpService from '../services/followUpService';
import dashboardService from '../services/dashboardService';
import leadService from '../services/leadService';
import { useAuth } from '../context/AuthContext';

export default function FollowUpsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Data states
  const [followUps, setFollowUps] = useState([]);
  const [availableLeads, setAvailableLeads] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  // Filter states
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'overdue'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLeadFilter, setSelectedLeadFilter] = useState('');
  const [selectedCreatorFilter, setSelectedCreatorFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Status & error states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'danger', message: '' }
  const [formErrors, setFormErrors] = useState({});

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailFollowUp, setDetailFollowUp] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load available leads for dropdown creation and lead filtering
  useEffect(() => {
    leadService
      .getLeads({ per_page: 100 })
      .then((res) => {
        setAvailableLeads(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load leads for follow-up form:', err);
      });
  }, []);

  // Fetch follow-ups based on scheduleFilter
  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);

      if (scheduleFilter === 'all') {
        const params = {
          search: debouncedSearch.trim(),
          lead_id: selectedLeadFilter || undefined,
          page: currentPage,
          per_page: 10,
        };

        if (isAdmin && selectedCreatorFilter) {
          params.created_by = selectedCreatorFilter;
        }

        const res = await followUpService.getFollowUps(params);
        setFollowUps(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        // Use dashboard scheduled endpoint for 'today' | 'upcoming' | 'overdue'
        const res = await dashboardService.getFollowUps(scheduleFilter, currentPage, 10);
        let items = res.data || [];

        // Apply client-side search/lead filter if present on dashboard schedule subset
        if (debouncedSearch.trim()) {
          const s = debouncedSearch.toLowerCase();
          items = items.filter(
            (item) =>
              item.lead?.customer_name?.toLowerCase().includes(s) ||
              item.lead?.phone?.toLowerCase().includes(s) ||
              item.remarks?.toLowerCase().includes(s)
          );
        }
        if (selectedLeadFilter) {
          items = items.filter((item) => String(item.lead_id) === String(selectedLeadFilter));
        }

        setFollowUps(items);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to load follow-up records.',
      });
    } finally {
      setLoading(false);
    }
  }, [scheduleFilter, debouncedSearch, selectedLeadFilter, selectedCreatorFilter, currentPage, isAdmin]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Derive unique creators observed for Admin filter
  const observedCreators = useMemo(() => {
    const creatorMap = new Map();
    followUps.forEach((f) => {
      if (f.creator) {
        creatorMap.set(f.creator.id, f.creator);
      }
    });
    return Array.from(creatorMap.values());
  }, [followUps]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedFollowUp(null);
    setFormErrors({});
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (item) => {
    setSelectedFollowUp(item);
    setFormErrors({});
    setShowFormModal(true);
    try {
      const res = await followUpService.getFollowUp(item.id);
      setSelectedFollowUp(res.data);
    } catch (_err) {
      // Retain existing item
    }
  };

  // Submit Follow-Up Form (Create or Update)
  const handleFormSubmit = async (payload) => {
    setActionLoading(true);
    setFormErrors({});
    try {
      if (selectedFollowUp && selectedFollowUp.id) {
        await followUpService.updateFollowUp(selectedFollowUp.id, payload);
        setAlert({ type: 'success', message: 'Follow-up record updated successfully.' });
      } else {
        await followUpService.createFollowUp(payload);
        setAlert({ type: 'success', message: 'Follow-up recorded successfully.' });
      }
      setShowFormModal(false);
      fetchFollowUps();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setFormErrors(err.response.data?.errors || {});
      } else if (err.response && err.response.status === 403) {
        setAlert({
          type: 'danger',
          message: err.response.data?.message || 'Permission denied. You cannot modify this follow-up.',
        });
      } else {
        setAlert({
          type: 'danger',
          message: err.response?.data?.message || 'An error occurred while saving the follow-up.',
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Open View Detail Modal
  const handleOpenDetail = async (item) => {
    setDetailFollowUp(item);
    setShowDetailModal(true);
    try {
      const res = await followUpService.getFollowUp(item.id);
      setDetailFollowUp(res.data);
    } catch (_err) {
      // Retain existing item
    }
  };

  // Open Delete Confirm Modal (Admin only)
  const handleOpenDelete = (item) => {
    setFollowUpToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!followUpToDelete) return;
    setActionLoading(true);
    try {
      await followUpService.deleteFollowUp(followUpToDelete.id);
      setAlert({ type: 'success', message: 'Follow-up record deleted successfully.' });
      setShowDeleteModal(false);
      setFollowUpToDelete(null);
      fetchFollowUps();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to delete follow-up.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <AppLayout pageTitle={isAdmin ? 'All Follow-Up Records' : 'My Assigned Follow-Ups'}>
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
              {isAdmin ? 'Follow-Up Interactions' : 'My Follow-Up Activities'}
            </h4>
            <p className="text-muted small mb-0">
              {isAdmin
                ? 'Review team conversations, schedule reminders, and track client touchpoints.'
                : 'Log client conversations, set next callback reminders, and manage your pipeline tasks.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn text-white rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm align-self-start align-self-md-auto"
            style={{ backgroundColor: '#434AFA', borderColor: '#434AFA' }}
          >
            <i className="bi bi-calendar-plus-fill"></i>
            <span>Record Follow-Up</span>
          </button>
        </div>
      </div>

      {/* Filter and Schedule Bar */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
        {/* Schedule Filter Tabs */}
        <div className="d-flex flex-wrap gap-2 pb-3 mb-3 border-bottom">
          {[
            { key: 'all', label: 'All Records', icon: 'bi-collection' },
            { key: 'today', label: 'Due Today', icon: 'bi-calendar-event' },
            { key: 'upcoming', label: 'Upcoming (7 Days)', icon: 'bi-calendar-week' },
            { key: 'overdue', label: 'Overdue Reminders', icon: 'bi-exclamation-octagon' },
          ].map((tab) => {
            const isActive = scheduleFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setScheduleFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`btn btn-sm rounded-pill px-3 py-2 fw-medium d-flex align-items-center gap-2 ${
                  isActive
                    ? 'btn-primary text-white shadow-sm'
                    : 'btn-light text-secondary border'
                }`}
                style={isActive ? { backgroundColor: '#434AFA', borderColor: '#434AFA' } : {}}
              >
                <i className={`bi ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Dropdown Filters */}
        <div className="row g-3 align-items-center">
          {/* Search Term */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by customer name, phone, or remarks..."
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

          {/* Lead Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light text-secondary"
              value={selectedLeadFilter}
              onChange={(e) => {
                setSelectedLeadFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Leads</option>
              {availableLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.id} - {l.customer_name}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Creator Filter */}
          {isAdmin && (
            <div className="col-6 col-md-3">
              <select
                className="form-select bg-light text-secondary"
                value={selectedCreatorFilter}
                onChange={(e) => {
                  setSelectedCreatorFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Creators</option>
                {observedCreators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          <div className={`col-12 ${isAdmin ? 'col-md-1' : 'col-md-4'} text-md-end`}>
            <button
              className="btn btn-light btn-sm text-secondary rounded-pill px-3 py-2 w-100 w-md-auto"
              title="Reset Filters"
              onClick={() => {
                setScheduleFilter('all');
                setSearchTerm('');
                setSelectedLeadFilter('');
                setSelectedCreatorFilter('');
                setCurrentPage(1);
              }}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Follow-Ups Table Card */}
      <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Follow-Up Records</h5>
            <small className="text-muted">Total: {pagination.total} records found</small>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
              <span>Loading follow-up records...</span>
            </div>
          ) : followUps.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar2-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
              <p className="mb-0 fw-semibold">No matching follow-ups found.</p>
              <small className="text-muted">Try adjusting your filters or record a new interaction.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary text-uppercase small" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                  <tr>
                    <th className="ps-4">ID</th>
                    <th>Customer / Lead</th>
                    <th>Phone</th>
                    <th>Follow-Up Date</th>
                    <th>Remarks</th>
                    <th>Next Scheduled Date</th>
                    <th>Logged By</th>
                    <th className="pe-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-4 small text-muted fw-bold">#{item.id}</td>
                      <td className="py-3">
                        <div className="fw-bold text-dark">
                          {item.lead?.customer_name || `Lead #${item.lead_id}`}
                        </div>
                        {item.lead?.company_name && (
                          <div className="small text-muted">{item.lead.company_name}</div>
                        )}
                      </td>
                      <td className="small text-secondary">
                        {item.lead?.phone || '-'}
                      </td>
                      <td className="small text-secondary">
                        {formatDate(item.follow_up_date)}
                      </td>
                      <td style={{ maxWidth: '260px' }}>
                        <div className="small text-dark text-truncate" title={item.remarks}>
                          {item.remarks}
                        </div>
                      </td>
                      <td>
                        {item.next_follow_up_date ? (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                            <i className="bi bi-clock me-1"></i>
                            {formatDate(item.next_follow_up_date)}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted">No Callback</span>
                        )}
                      </td>
                      <td className="small">
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-person me-1 text-primary"></i>
                          {item.creator?.name || 'Staff'}
                        </span>
                      </td>
                      <td className="pe-4 text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenDetail(item)}
                            title="View Follow-Up Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Follow-Up"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleOpenDelete(item)}
                              title="Delete Record"
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
              Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total records)
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
      <FollowUpFormModal
        show={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        followUp={selectedFollowUp}
        availableLeads={availableLeads}
        loading={actionLoading}
        errors={formErrors}
      />

      <FollowUpDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        followUp={detailFollowUp}
      />

      {isAdmin && (
        <DeleteFollowUpModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          followUpId={followUpToDelete?.id}
          leadName={followUpToDelete?.lead?.customer_name}
          loading={actionLoading}
        />
      )}
    </AppLayout>
  );
}

