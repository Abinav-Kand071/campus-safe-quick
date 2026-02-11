import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// 1. STRICT TYPE DEFINITION
export interface User {
  id: string;
  name: string;
  email: string; // Stores College ID for students
  role: 'student' | 'admin' | 'security_head' | 'principal';
  status: string;
  phone?: string; // Stores Biometric ID
  is_banned?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string, requiredRole?: string) => Promise<void>;
  logout: () => void;
  // Admin helpers
  getAllStudents: () => Promise<User[]>;
  approveStudent: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 1. CHECK SESSION ---
  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem('campus_user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        }
      } catch (e) {
        console.error("Session check error", e);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // --- 2. LOGIN FUNCTION ---
  const login = async (email: string, pass: string, requiredRole?: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', pass)
        .single();

      if (error || !data) {
        throw new Error('Invalid Credentials');
      }

      // Role Check
      if (requiredRole && data.role !== requiredRole && data.role !== 'admin') {
        throw new Error('Unauthorized Access');
      }

      // Status Checks
      if (data.status === 'pending') throw new Error('Account pending approval');
      if (data.status === 'banned') throw new Error('Account banned');

      // STRICT CASTING: Ensure data matches User type
      const loggedUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as User['role'], // Safe cast for strict union type
        status: data.status,
        phone: data.phone
      };

      setUser(loggedUser);
      localStorage.setItem('campus_user', JSON.stringify(loggedUser));
      
      toast.success(`Welcome back, ${data.name}`);

      if (data.role === 'admin' || data.role === 'security_head') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }

    } catch (err: unknown) {
      let message = 'Login Failed';
      if (err instanceof Error) message = err.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. LOGOUT ---
  const logout = () => {
    setUser(null);
    localStorage.removeItem('campus_user');
    navigate('/');
    toast.info('Logged out');
  };

  // --- 4. ADMIN HELPERS ---
  const getAllStudents = async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student');
    
    if (error) {
      console.error(error);
      return [];
    }

    // FIX: Cast the raw DB response to our strict User type
    // This removes the need for 'any' because we are explicitly telling TS what 'data' is.
    const rows = (data || []) as User[]; 

    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      phone: u.phone
    }));
  };

  const approveStudent = async (id: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', id);
    
    if (error) throw error;
    toast.success('Student Approved');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      getAllStudents,
      approveStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};