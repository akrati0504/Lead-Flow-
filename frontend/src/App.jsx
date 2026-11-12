import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import LeadsPage from './pages/LeadsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import EmployeesPage from './pages/EmployeesPage';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public login route with redirection if already authenticated */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LeadsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/follow-ups"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <FollowUpsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Protected Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/leads"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <LeadsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/follow-ups"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <FollowUpsPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
