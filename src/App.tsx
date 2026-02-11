import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // Ensure this matches your filename!
import Index from './pages/Index';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard'; // If you have this created
import NotFound from './pages/NotFound'; // Or whatever your 404 page is called

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/student/login" element={<StudentLogin />} />

      {/* PROTECTED ADMIN ROUTE */}
      {/* This is the missing piece! */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* PROTECTED STUDENT ROUTE (Optional for now) */}
      <Route element={<ProtectedRoute allowedRole="student" />}>
         <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Route>

      {/* Catch-all for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;