import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './providers/auth-provider';
import { DashboardLayout } from './layouts/dashboard-layout';
import { LoginPage } from './pages/auth/login-page';
import { RegisterPage } from './pages/auth/register-page';
import { ForgotPasswordPage } from './pages/auth/forgot-password-page';
import { DashboardPage } from './pages/dashboard/dashboard-page';
import { ProjectsPage } from './pages/projects/projects-page';
import { SessionsPage } from './pages/sessions/sessions-page';
import { UsersPage } from './pages/users/users-page';
import { RolesPage } from './pages/roles/roles-page';
import { AuditLogsPage } from './pages/audit/audit-page';
import { BookingsPage } from './pages/bookings/bookings-page';
import { PhotographersPage } from './pages/photographers/photographers-page';
import { ServicesPage } from './pages/services/services-page';
import { PortfolioPage } from './pages/portfolio/portfolio-page';
import { ContentPage } from './pages/content/content-page';
import { PublicLayout } from './layouts/public-layout';
import { HomePage } from './pages/public/home-page';
import { PortfolioGalleryPage } from './pages/public/portfolio-page';
import { PhotographersShowcasePage } from './pages/public/photographers-page';
import { ServicesShowcasePage } from './pages/public/services-page';
import { BookingRequestPage } from './pages/public/booking-page';
import { BookingStatusPage } from './pages/public/booking-status-page';
import { Skeleton } from './components/ui/skeleton';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="portfolio" element={<PortfolioGalleryPage />} />
        <Route path="photographers" element={<PhotographersShowcasePage />} />
        <Route path="services" element={<ServicesShowcasePage />} />
        <Route path="booking" element={<BookingRequestPage />} />
        <Route path="booking/status" element={<BookingStatusPage />} />
      </Route>
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/admin/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/admin/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="photographers" element={<PhotographersPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
