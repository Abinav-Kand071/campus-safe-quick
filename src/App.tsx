import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner'; // 1. IMPORT THIS
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard'; // (If created)
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <>
      {/* 2. ADD THIS LINE (The Notification Center) */}
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

        {/* Protected Student Routes */}
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