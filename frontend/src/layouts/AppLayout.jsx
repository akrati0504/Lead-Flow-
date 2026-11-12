import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children, pageTitle = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const rolePrefix = isAdmin ? '/admin' : '/employee';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      to: `${rolePrefix}/dashboard`,
      label: 'Dashboard',
      icon: 'bi-grid-1x2-fill',
    },
    {
      to: `${rolePrefix}/leads`,
      label: 'Leads',
      icon: 'bi-people-fill',
    },
    {
      to: `${rolePrefix}/follow-ups`,
      label: 'Follow-Ups',
      icon: 'bi-calendar-check-fill',
    },
    ...(isAdmin
      ? [
          {
            to: '/admin/employees',
            label: 'Employees',
            icon: 'bi-person-badge-fill',
          },
        ]
      : []),
  ];

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: '#f4f6f9', overflowX: 'hidden' }}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 z-2 d-md-none"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white border-end d-flex flex-column z-3 ${
          sidebarOpen ? 'position-fixed top-0 start-0 vh-100' : 'd-none d-md-flex position-sticky top-0 vh-100'
        }`}
        style={{
          width: '250px',
          minWidth: '250px',
          maxWidth: '250px',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          className="d-flex align-items-center justify-content-between px-4"
          style={{ height: '64px', borderBottom: '1px solid #eef2f6' }}
        >
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
              style={{ width: '36px', height: '36px', backgroundColor: '#434AFA' }}
            >
              <i className="bi bi-diagram-3-fill fs-5"></i>
            </div>
            <span className="fw-bold fs-5 tracking-tight" style={{ color: '#1e293b' }}>
              LeadFlow
            </span>
          </div>
          <button
            className="btn btn-sm btn-light d-md-none text-muted"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Role Tag */}
        <div className="px-3 py-3 border-bottom" style={{ borderColor: '#eef2f6' }}>
          <div className="d-flex align-items-center gap-2 px-2 py-1">
            <span
              className={`badge rounded-pill text-uppercase px-2 py-1 ${
                isAdmin
                  ? 'bg-danger-subtle text-danger border border-danger-subtle'
                  : 'bg-primary-subtle text-primary border border-primary-subtle'
              }`}
              style={{ fontSize: '0.7rem', fontWeight: 700 }}
            >
              {isAdmin ? 'Admin Workspace' : 'Employee Workspace'}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="p-3 flex-grow-1 overflow-auto">
          <ul className="nav nav-pills flex-column gap-1">
            {navItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 fw-medium ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-secondary bg-transparent hover-bg-light'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: '#434AFA' }
                      : { color: '#64748b' }
                  }
                >
                  <i className={`bi ${item.icon} fs-5`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="p-3 border-top" style={{ borderColor: '#eef2f6' }}>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-3 fw-medium"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0, width: 'calc(100% - 250px)' }}>
        {/* Top Navbar */}
        <header
          className="bg-white border-bottom sticky-top d-flex align-items-center justify-content-between px-3 px-md-4 shadow-sm"
          style={{ height: '64px', borderColor: '#eef2f6', zIndex: 10 }}
        >
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-light d-md-none border-0 text-secondary"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Navigation"
            >
              <i className="bi bi-list fs-4"></i>
            </button>
            <h1 className="h5 mb-0 fw-bold" style={{ color: '#1e293b' }}>
              {pageTitle}
            </h1>
          </div>

          {/* User Profile Pill */}
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: isAdmin ? '#ef4444' : '#434AFA',
                  fontSize: '0.9rem',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="d-none d-sm-block text-start">
                <div className="fw-semibold text-dark leading-tight" style={{ fontSize: '0.875rem' }}>
                  {user?.name || 'User'}
                </div>
                <div className="text-muted text-capitalize" style={{ fontSize: '0.75rem' }}>
                  {user?.role || 'Guest'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-light text-secondary d-none d-md-flex align-items-center gap-1 border-0"
              title="Sign Out"
            >
              <i className="bi bi-power text-danger fs-6"></i>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-3 p-md-4 flex-grow-1" style={{ width: '100%', maxWidth: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
