import { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import StatCard from '../components/StatCard';
import RecentLeadsTable from '../components/RecentLeadsTable';
import FollowUpListCard from '../components/FollowUpListCard';
import dashboardService from '../services/dashboardService';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [followUpPeriod, setFollowUpPeriod] = useState('today');

  const [_loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingFollowUps, setLoadingFollowUps] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Load summary metrics
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await dashboardService.getSummary();
      setSummary(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // 2. Load recent leads
  const fetchRecentLeads = async () => {
    try {
      setLoadingLeads(true);
      const res = await dashboardService.getRecentLeads(5);
      setRecentLeads(res.data || []);
    } catch (err) {
      console.error('Failed to fetch recent leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  // 3. Load follow-ups by period
  const fetchFollowUps = async (period) => {
    try {
      setLoadingFollowUps(true);
      const res = await dashboardService.getFollowUps(period, 1, 10);
      setFollowUps(res.data || []);
    } catch (err) {
      console.error('Failed to fetch scheduled follow-ups:', err);
    } finally {
      setLoadingFollowUps(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchRecentLeads();
  }, []);

  useEffect(() => {
    fetchFollowUps(followUpPeriod);
  }, [followUpPeriod]);

  const leads = summary?.leads || {};
  const followUpStats = summary?.follow_ups || {};

  return (
    <AppLayout pageTitle="Admin Dashboard">
      {/* Global Error Banner */}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="card border-0 rounded-4 text-white p-4 mb-4 shadow-sm" style={{ backgroundColor: '#434AFA' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-white bg-opacity-25 rounded-pill px-3 py-1 mb-2">
              <i className="bi bi-shield-lock me-1"></i> System-Wide Overview
            </span>
            <h3 className="fw-bold mb-1">Company Lead Pipeline</h3>
            <p className="mb-0 text-white-50 small">
              Real-time lead status distributions and scheduled team follow-ups.
            </p>
          </div>
          <button
            onClick={() => {
              fetchSummary();
              fetchRecentLeads();
              fetchFollowUps(followUpPeriod);
            }}
            className="btn btn-light btn-sm rounded-pill px-3 py-2 fw-semibold align-self-start align-self-md-auto text-primary shadow-sm"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
          </button>
        </div>
      </div>

      {/* Follow-Up Quick Action Stats */}
      <h6 className="fw-bold text-secondary text-uppercase tracking-wider small mb-3">
        Follow-Up Reminders
      </h6>
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatCard
            title="Due Today"
            count={followUpStats.today}
            icon="bi-calendar-event"
            color="#434AFA"
            bgLight="rgba(67, 74, 250, 0.12)"
            subtitle="Needs action before end of day"
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="Overdue"
            count={followUpStats.overdue}
            icon="bi-exclamation-octagon-fill"
            color="#ef4444"
            bgLight="rgba(239, 68, 68, 0.12)"
            subtitle="Immediate attention required"
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            title="Upcoming (7 Days)"
            count={followUpStats.upcoming}
            icon="bi-calendar-week"
            color="#0ea5e9"
            bgLight="rgba(14, 165, 233, 0.12)"
            subtitle="Scheduled pipeline engagements"
          />
        </div>
      </div>

      {/* Lead Pipeline Statistics */}
      <h6 className="fw-bold text-secondary text-uppercase tracking-wider small mb-3">
        Lead Status Distribution
      </h6>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-2">
          <StatCard
            title="Total Leads"
            count={leads.total}
            icon="bi-diagram-3-fill"
            color="#1e293b"
            bgLight="#f1f5f9"
          />
        </div>
        <div className="col-6 col-lg-2">
          <StatCard
            title="New"
            count={leads.new}
            icon="bi-stars"
            color="#434AFA"
            bgLight="rgba(67, 74, 250, 0.1)"
          />
        </div>
        <div className="col-6 col-lg-2">
          <StatCard
            title="Contacted"
            count={leads.contacted}
            icon="bi-telephone-outbound"
            color="#0ea5e9"
            bgLight="rgba(14, 165, 233, 0.1)"
          />
        </div>
        <div className="col-6 col-lg-2">
          <StatCard
            title="Interested"
            count={leads.interested}
            icon="bi-hand-thumbs-up"
            color="#f59e0b"
            bgLight="rgba(245, 158, 11, 0.1)"
          />
        </div>
        <div className="col-6 col-lg-2">
          <StatCard
            title="Converted"
            count={leads.converted}
            icon="bi-check2-circle"
            color="#10b981"
            bgLight="rgba(16, 185, 129, 0.1)"
          />
        </div>
        <div className="col-6 col-lg-2">
          <StatCard
            title="Lost"
            count={leads.lost}
            icon="bi-x-circle"
            color="#ef4444"
            bgLight="rgba(239, 68, 68, 0.1)"
          />
        </div>
      </div>

      {/* Main Grid: Scheduled Follow-ups & Recent Leads */}
      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <FollowUpListCard
            followUps={followUps}
            period={followUpPeriod}
            onPeriodChange={setFollowUpPeriod}
            loading={loadingFollowUps}
          />
        </div>
        <div className="col-12 col-xl-5">
          <RecentLeadsTable
            leads={recentLeads}
            loading={loadingLeads}
          />
        </div>
      </div>
    </AppLayout>
  );
}
