import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Student, Admin, AdminRole } from '@/types';
import { toast } from 'sonner';

// Define what data the Context holds
interface AuthContextType {
  user: any | null; // Unified user object
  admin: Admin | null;
  loading: boolean;
  loginWithCollegeId: (c: string, n: string, b: string, p: string) => Promise<void>;
  loginAsAdmin: (n: string, r: AdminRole, e: string, p: string) => void;
  logout: () => void;
  logoutAdmin: () => void;
  
  // Admin Actions (Real DB Calls)
  getAllStudents: () => Promise<Student[]>;
  approveStudent: (id: string) => Promise<boolean>;
  banStudent: (id: string) => Promise<boolean>;
  unbanStudent: (id: string) => Promise<boolean>;
  
  // Staff helpers
  getStaffList: () => Promise<Admin[]>;
  createNewAdmin: (n: string, r: AdminRole, e: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. CHECK SESSION ON LOAD (The "Memory" of the app)
  useEffect(() => {
    // Check for Student Session (Supabase)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch full profile details (like is_banned)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          // BLOCK BANNED USERS
          if (profile.is_banned) {
            await supabase.auth.signOut();
            setUser(null);
          } else {
            setUser({ ...profile, email: session.user.email });
          }
        }
      }
      setLoading(false);
    };

    checkSession();

    // Check for Admin Session (Local "Backdoor" for now)
    const storedAdmin = localStorage.getItem('college_safety_admin');
    if (storedAdmin) setAdmin(JSON.parse(storedAdmin));

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setUser({ ...profile, email: session.user.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- REAL STUDENT LOGIN (Supabase) ---
  const loginWithCollegeId = async (collegeId: string, name: string, biometricId: string, password: string) => {
    // Create a "System Email" so Supabase Auth works
    const email = `${collegeId}@campus.safe`; 

    try {
      // A. Try to Sign Up (New User)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, collegeId, role: 'student' } }
      });

      // B. If user exists, Sign In instead
      if (signUpError && signUpError.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        
        // CHECK BAN STATUS AFTER LOGIN
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', signInData.user.id).single();
        if (profile?.is_banned) {
          await supabase.auth.signOut();
          throw new Error("⛔ ACCESS DENIED: You have been banned by the Administrator.");
        }
        return;
      }

      if (signUpError) throw signUpError;

      // C. Create Profile for New User
      if (signUpData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([{
          id: signUpData.user.id,
          name,
          college_id: collegeId,
          biometric_id: biometricId,
          role: 'student',
          is_approved: false,
          is_banned: false
        }]);
        if (profileError) throw profileError;
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  // --- ADMIN FUNCTIONS ---
  const loginAsAdmin = (name: string, role: AdminRole, email: string, phone: string) => {
    const newAdmin = { id: 'admin-1', name, role, email, phone };
    localStorage.setItem('college_safety_admin', JSON.stringify(newAdmin));
    setAdmin(newAdmin);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const logoutAdmin = () => {
    localStorage.removeItem('college_safety_admin');
    setAdmin(null);
    navigate('/admin/login');
  };

  // --- DATABASE ACTIONS ---
  const getAllStudents = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { console.error(error); return []; }
    
    // Map DB columns to our App types
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      collegeId: p.college_id,
      biometricId: p.biometric_id,
      isApproved: p.is_approved,
      isBanned: p.is_banned || false, // Handle Ban Status
      role: p.role
    }));
  };

  const approveStudent = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', id);
    return !error;
  };

  const banStudent = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', id);
    return !error;
  };

  const unbanStudent = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ is_banned: false }).eq('id', id);
    return !error;
  };

  // Mock Staff for now (safe to keep mock)
  const getStaffList = async () => [
    { id: '1', name: 'Chief Anderson', role: 'security_head', email: 'chief@campus.edu', phone: '555-0101' },
    { id: '2', name: 'Dr. Sarah Smith', role: 'principal', email: 'principal@campus.edu', phone: '555-0102' }
  ] as Admin[];

  const createNewAdmin = async () => { /* Placeholder */ };

  return (
    <AuthContext.Provider value={{
      user, admin, loading,
      loginWithCollegeId, loginAsAdmin, logout, logoutAdmin,
      getAllStudents, approveStudent, banStudent, unbanStudent,
      getStaffList, createNewAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
