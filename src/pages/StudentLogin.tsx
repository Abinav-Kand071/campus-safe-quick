import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth'; // Import our Auth Hook
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Fingerprint } from 'lucide-react'; // Added Fingerprint icon

// Error Type Helper
interface SupabaseError {
  message?: string;
  code?: string;
}

const StudentLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // We use the global login function
  
  // Toggle between "Login" and "Sign Up"
  const [isLoginMode, setIsLoginMode] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    collegeId: '',
    biometricId: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { name, collegeId, biometricId, password, confirmPassword } = formData;

    try {
      // ==========================================
      // MODE 1: LOG IN (Existing Student)
      // ==========================================
      if (isLoginMode) {
        // 1. Validation: Require Biometric ID here too!
        if (!collegeId || !password || !biometricId) {
          toast.error('Please enter College ID, Biometric ID, and Password');
          setLoading(false);
          return;
        }

        // 2. Extra Security Check: Verify Biometric ID matches the user in DB
        // We simulate the hardware check here.
        const { data: userCheck, error: checkError } = await supabase
          .from('users')
          .select('phone') // We stored biometricId in the 'phone' column
          .eq('email', collegeId)
          .single();

        if (checkError || !userCheck) {
          toast.error('Invalid Credentials'); 
          setLoading(false);
          return;
        }

        // THE CHECK: Does the typed biometric ID match the stored one?
        if (userCheck.phone !== biometricId) {
          toast.error('Biometric ID does not match our records.');
          setLoading(false);
          return;
        }

        // 3. If Biometric matches, proceed with Standard Login
        await login(collegeId, password, 'student');
      } 
      
      // ==========================================
      // MODE 2: SIGN UP (New Request) - UNTOUCHED
      // ==========================================
      else {
        // Validation
        if (!name.trim() || !collegeId.trim() || !biometricId.trim() || !password || !confirmPassword) {
          toast.error('Please fill in all fields');
          setLoading(false); return;
        }
        if (!collegeId.includes('248')) {
          toast.error('Invalid College ID. Must contain "248".');
          setLoading(false); return;
        }
        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false); return;
        }

        // Send to Database
        const { error } = await supabase.from('users').insert({
          name: name,
          email: collegeId,      // College ID acts as email
          password: password,    
          role: 'student',
          status: 'pending',     
          phone: biometricId     
        });

        if (error) throw error;

        toast.success('Request Sent! Switch to Login to check status.');
        setIsLoginMode(true); // Automatically switch them to login screen
        
        // Optional: Clear password fields for safety
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }

    } catch (err: unknown) {
      console.error("Auth Error:", err);
      
      let message = 'An unexpected error occurred';
      let code = '';

      if (typeof err === 'object' && err !== null) {
        const errorObj = err as SupabaseError;
        message = errorObj.message || JSON.stringify(err);
        code = errorObj.code || '';
      }

      // Handle Duplicate User Error
      if (code === '23505' || message.toLowerCase().includes('duplicate')) {
        toast.error('This College ID is already registered! Please Login instead.');
        setIsLoginMode(true); // Switch them to login mode helpfully
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isLoginMode ? 'Student Login' : 'Student Portal'}
          </CardTitle>
          <CardDescription>
            {isLoginMode 
              ? 'Enter your credentials and Biometric ID' 
              : 'Request access to the Campus Safety System'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NAME: Only for Sign Up */}
            {!isLoginMode && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Name" value={formData.name} onChange={handleChange} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="collegeId">College ID</Label>
              <Input id="collegeId" name="collegeId" placeholder="00248-XX-000" value={formData.collegeId} onChange={handleChange} />
            </div>

            {/* BIOMETRIC ID: NOW VISIBLE IN BOTH MODES */}
            <div className="space-y-2">
               <Label htmlFor="biometricId" className="flex items-center gap-2">
                Biometric ID
                {isLoginMode && <Fingerprint className="w-3 h-3 text-blue-500" />}
              </Label>
              <Input id="biometricId" name="biometricId" placeholder="00000-00000" value={formData.biometricId} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={handleChange} 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* CONFIRM PASSWORD: Only for Sign Up */}
            {!isLoginMode && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLoginMode ? 'Login' : 'Request Access')}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsLoginMode(!isLoginMode)}
            >
              {isLoginMode ? 'New Student? Register Here' : 'Already Registered? Login Here'}
            </Button>

            <div className="text-center text-sm pt-2">
              <button type="button" onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-900 underline">
                Back to Home
              </button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLogin;