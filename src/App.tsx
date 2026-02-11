import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner'; 
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard'; // Import is active now

import NotFound from './pages/NotFound';

const App = () => {
  return (
    <>
      <Toaster position="top-center" richColors />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Protected Student Routes - UNCOMMENTED NOW */}
        <Route element={<ProtectedRoute allowedRole="student" />}>
           <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;