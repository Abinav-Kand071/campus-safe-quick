import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react'; // Added Loader icon
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuth();
  
  // We only need Email & Password for real auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

 const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check Supabase for the Admin
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Validates credentials
        .eq('role', 'admin')      // Ensures they are actually an admin
        .single();

      if (error || !data) {
        toast.error('Invalid Credentials or Access Denied');
        setLoading(false);
        return;
      }

      // 2. Success! Log them in via your hook
      // FIX APPLIED HERE: We use the REAL role from the database
      loginAsAdmin(
        data.name || 'Admin', 
        data.role || 'security_guard', // Fallback to security_guard if role is missing
        email, 
        '0000000000'
      ); 
      
      toast.success('Welcome back, Admin');
      navigate('/admin/dashboard');

    } catch (err) {
      toast.error('Something went wrong during login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground mt-2">Secure Campus Access</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Enter your authorized credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Password Field - CRITICAL ADDITION */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                     Verifying...
                   </>
                ) : (
                   <>
                     <ShieldCheck className="w-4 h-4 mr-2" />
                     Access Dashboard
                   </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <Button 
                variant="link" 
                className="w-full text-muted-foreground"
                onClick={() => navigate('/')}
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;