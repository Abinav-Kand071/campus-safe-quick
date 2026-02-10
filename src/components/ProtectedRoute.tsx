import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Optional: if you use context
// If you don't use the hook, just read from localStorage like we discussed:

const ProtectedRoute = ({ allowedRole }: { allowedRole: string }) => {
  // 1. Get user from LocalStorage (Simple method)
  const userString = localStorage.getItem('sb-vn...-auth-token') || localStorage.getItem('user');
  // Note: Supabase usually stores auth in a specific key, but let's assume you saved 'user' manually
  // or checks your useAuth hook.
  
  // Let's stick to the simple check we verified earlier:
  const storedUser = localStorage.getItem('user'); 
  const user = storedUser ? JSON.parse(storedUser) : null;

  // 2. If not logged in, kick to home
  if (!user) {
    return <Navigate to="/" replace />; 
  }

  // 3. If wrong role (Student trying to access Admin), kick out
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // 4. Allowed? Show the content
  return <Outlet />;
};

export default ProtectedRoute;