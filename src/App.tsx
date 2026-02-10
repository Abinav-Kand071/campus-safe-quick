import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/student/login" element={<StudentLogin />} />

      {/* --- PROTECTED ADMIN ROUTES --- */}
      {/* Only 'admin' role can enter here */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      {/* --- PROTECTED STUDENT ROUTES --- */}
      {/* Only 'student' role can enter here */}
      <Route element={<ProtectedRoute allowedRole="student" />}>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;