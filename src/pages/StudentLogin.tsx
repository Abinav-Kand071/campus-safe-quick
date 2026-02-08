import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Fingerprint, UserCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const StudentLogin = () => {
  const navigate = useNavigate();
  // UPDATE: 'student' is now 'user' in our new hook
  const { loginWithCollegeId, user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    collegeId: '',
    biometricId: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    // Check if 'user' exists and is a student
    if (user && user.role === 'student') {
      navigate('/student/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, collegeId, biometricId, password, confirmPassword } = formData;

    if (!name.trim() || !collegeId.trim() || !biometricId.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!collegeId.includes('248')) {
      toast.error('Invalid College ID. Must contain the mandatory code "248".');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const biometricRegex = /^\d{5}-\d{5}$/;
    if (!biometricRegex.test(biometricId)) {
      toast.error('Invalid Biometric ID format. Use: 12345-67890');
      return;
    }

    try {
      setLoading(true);
      await loginWithCollegeId(collegeId, name, biometricId, password);
      toast.success('Registration request sent! Please wait for admin approval.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Campus Safety</h1>
          <p className="text-muted-foreground mt-2">Student Secure Access Portal</p>
        </div>

        <Card className="glass border-primary/10 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Student Registration
            </CardTitle>
            <CardDescription>
              Enter your credentials and biometric ID to request access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collegeId">College ID</Label>
                <Input
                  id="collegeId"
                  placeholder="e.g., 00000-XX-000" 
                  value={formData.collegeId}
                  onChange={handleChange}
                />
                <p className="text-[10px] text-muted-foreground">Must contain college code '248'</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="biometricId" className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Biometric ID
                </Label>
                <Input
                  id="biometricId"
                  placeholder="00000-00000"
                  value={formData.biometricId}
                  onChange={handleChange}
                  className="font-mono text-sm"
                  maxLength={11} 
                />
                <p className="text-[10px] text-muted-foreground">Format: 12345-67890</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    className="pl-9"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    className="pl-9"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Request Access'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate('/student/dashboard')} className="text-xs text-muted-foreground">
                 Already logged in? Go to Dashboard <ArrowRight className="w-3 h-3 ml-1"/>
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentLogin;