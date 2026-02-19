import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRole }: { allowedRole: string }) => {
  const { user, loading } = useAuth(); 

  // 1. If Supabase is still pulling from local storage, show spinner
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // 2. No user at all -> Kick to Home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. THE FIX: Group all authority roles together
  const isAdminGroup = ['admin', 'security_head', 'principal', 'hod', 'class_in_charge'].includes(user.role);

  if (allowedRole === 'admin' && !isAdminGroup) {
    // Kick out if route requires admin, but user is NOT in the admin group (e.g. a Student)
    console.log(`Access Denied: User is ${user.role}, but route requires authority level.`);
    return <Navigate to="/" replace />;
  } else if (allowedRole === 'student' && user.role !== 'student') {
    // Kick out if route requires student, but user is not a student
    console.log(`Access Denied: User is ${user.role}, but route requires student level.`);
    return <Navigate to="/" replace />;
  }

  // 4. Access Granted
  return <Outlet />;
};

export default ProtectedRoute;