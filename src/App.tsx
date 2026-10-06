import { Navigate, Route, Routes } from 'react-router-dom';
import { homeFor, useAuth } from './context/AuthContext';
import StaffLayout from './layouts/StaffLayout';
import ActivityPage from './pages/admin/Activity';
import Coaches from './pages/admin/Coaches';
import SchedulePage from './pages/admin/Schedule';
import Login from './pages/Login';
import ParentDashboard from './pages/parent/ParentDashboard';
import AttendancePage from './pages/staff/Attendance';
import Dashboard from './pages/staff/Dashboard';
import Parents from './pages/staff/Parents';
import PaymentsPage from './pages/staff/Payments';
import PlayerDetailPage from './pages/staff/PlayerDetail';
import Players from './pages/staff/Players';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />

      <Route
        element={
          <ProtectedRoute roles={['admin', 'coach']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetailPage />} />
        <Route path="/parents" element={<Parents />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route
          path="/activity"
          element={
            <ProtectedRoute roles={['admin']}>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coaches"
          element={
            <ProtectedRoute roles={['admin']}>
              <Coaches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute roles={['admin']}>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/parent"
        element={
          <ProtectedRoute roles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
    </Routes>
  );
}
