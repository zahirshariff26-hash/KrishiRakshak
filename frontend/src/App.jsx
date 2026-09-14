import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import UploadDiagnosis from './pages/UploadDiagnosis';
import History from './pages/History';
import Community from './pages/Community';
import MapPage from './pages/MapPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestAllowedRoute({ children }) {
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, isGuest, loading } = useAuth();
  if (loading) return null;
  if (user || isGuest) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <div className="page-container">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<GuestAllowedRoute><Dashboard /></GuestAllowedRoute>} />
          <Route path="/upload" element={<GuestAllowedRoute><UploadDiagnosis /></GuestAllowedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/community" element={<GuestAllowedRoute><Community /></GuestAllowedRoute>} />
          <Route path="/map" element={<GuestAllowedRoute><MapPage /></GuestAllowedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
