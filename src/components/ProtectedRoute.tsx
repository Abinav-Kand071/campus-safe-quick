import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRole }: { allowedRole: string }) => {
  // We get the real user state from Supabase here
  const { user, loading } = useAuth(); 

  // 1. THE FIX: If Supabase is still thinking, SHOW A SPINNER (Don't kick out yet!)
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

  // 2. If loading is done and still no user -> Kick to Home
  if (!user) {
    console.log("Protected Route: No user found. Redirecting.");
    return <Navigate to="/" replace />;
  }

  // 3. If user exists but has wrong role -> Kick them out
  // (e.g. A Student trying to enter Admin Panel)
  if (allowedRole && user.role !== allowedRole) {
    console.log(`Protected Route: Role mismatch. User is ${user.role}, required ${allowedRole}`);
    return <Navigate to="/" replace />;
  }

  // 4. Access Granted
  return <Outlet />;
};

export default ProtectedRoute;