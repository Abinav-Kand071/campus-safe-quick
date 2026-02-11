import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Ensure this path matches your file
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// 1. Define the shape of a Supabase Error
interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  error_description?: string;
}

const StudentLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, collegeId, biometricId, password, confirmPassword } = formData;

    // --- VALIDATION ---
    if (!name.trim() || !collegeId.trim() || !biometricId.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!collegeId.includes('248')) {
      toast.error('Invalid College ID. Must contain "248".');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // --- SUBMIT TO SUPABASE ---
    try {
      setLoading(true);

      const { error } = await supabase.from('users').insert({
        name: name,
        email: collegeId,      
        password: password,    
        role: 'student',
        status: 'pending',     
        phone: biometricId     
      });

      if (error) throw error;

      toast.success('Request Sent! Wait for Admin approval.');
      
      setFormData({
        name: '',
        collegeId: '',
        biometricId: '',
        password: '',
        confirmPassword: ''
      });

    } catch (err: unknown) {
      // --- STRICT TYPE CHECKING ---
      console.error("Login Error:", err);
      
      let errorMessage = 'An unexpected error occurred';
      let errorCode = '';

      // Check if it's a standard Error object
      if (err instanceof Error) {
        errorMessage = err.message;
      } 
      // Check if it's a Supabase Error object
      else if (typeof err === 'object' && err !== null) {
        const supError = err as SupabaseError;
        errorMessage = supError.message || supError.error_description || JSON.stringify(err);
        errorCode = supError.code || '';
      }

      // Handle specific error codes
      if (errorCode === '23505' || errorMessage.toLowerCase().includes('duplicate')) {
        toast.error('This College ID is already registered!');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student Access Request</CardTitle>
          <CardDescription>Enter your details to request access to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestAccess} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collegeId">College ID</Label>
              <Input id="collegeId" name="collegeId" placeholder="248..." value={formData.collegeId} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="biometricId">Biometric ID</Label>
              <Input id="biometricId" name="biometricId" placeholder="12345-00000" value={formData.biometricId} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending Request...' : 'Request Access'}
            </Button>
            
            <Button type="button" variant="link" className="w-full" onClick={() => navigate('/')}>
              Back to Home
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLogin;