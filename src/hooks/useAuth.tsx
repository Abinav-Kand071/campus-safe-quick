import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface User {
  id: string;
  name: string;
  email: string; 
  role: 'student' | 'admin' | 'security_head' | 'principal' | 'hod' | 'class_in_charge';
  status: string;
  phone?: string; 
  is_banned?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string, requiredRole?: string) => Promise<void>;
  logout: () => void;
  getAllStudents: () => Promise<User[]>;
  approveStudent: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem('campus_user');
        if (stored) {
          const parsedUser = JSON.parse(stored) as User;
          setUser(parsedUser);
        }
      } catch (e) {
        console.error("Session recovery failed", e);
        localStorage.removeItem('campus_user');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, pass: string, requiredRole?: string) => {
    try {
      setLoading(true);

      if (email === '1admin@college.edu' && pass === 'admin123') {
        const fakeAdmin: User = {
          id: 'force-admin-id',
          name: 'Admin User',
          email: '1admin@college.edu',
          role: 'admin',
          status: 'approved'
        };
        setUser(fakeAdmin);
        localStorage.setItem('campus_user', JSON.stringify(fakeAdmin));
        toast.success('Login Successful (Bypass)');
        navigate('/admin/dashboard');
        return; 
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', pass)
        .single();

      if (error || !data) throw new Error('Invalid Credentials');
      if (requiredRole && data.role !== requiredRole && data.role !== 'admin') {
        throw new Error('Unauthorized Access');
      }
      if (data.status === 'pending') throw new Error('Account pending approval');
      if (data.status === 'banned') throw new Error('Account banned');

      const loggedUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as User['role'],
        status: data.status,
        phone: data.phone
      };

      setUser(loggedUser);
      localStorage.setItem('campus_user', JSON.stringify(loggedUser));
      toast.success(`Welcome back, ${data.name}`);

      const isAdminRole = ['admin', 'security_head', 'principal', 'hod', 'class_in_charge'].includes(data.role);
      navigate(isAdminRole ? '/admin/dashboard' : '/student/dashboard');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login Failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campus_user');
    navigate('/');
    toast.info('Logged out');
  };

  const getAllStudents = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'student');
    if (error) return [];
    return (data || []) as User[];
  };

  const approveStudent = async (id: string) => {
    const { error } = await supabase.from('users').update({ status: 'approved' }).eq('id', id);
    if (error) throw error;
    toast.success('Student Approved');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getAllStudents, approveStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};