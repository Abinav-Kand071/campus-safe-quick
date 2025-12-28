import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const StudentLogin = () => {
  const navigate = useNavigate();
  const { loginWithCollegeId, loginAsGuest } = useAuth();
  const [collegeId, setCollegeId] = useState('');
  const [name, setName] = useState('');

  const handleCollegeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId.trim() || !name.trim()) {
      toast.error('Please enter both College ID and Name');
      return;
    }
    loginWithCollegeId(collegeId, name);
    toast.success('Logged in successfully!');
    navigate('/student/dashboard');
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    toast.success('Joined as guest!');
    navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Campus Safety</h1>
          <p className="text-muted-foreground mt-2">Report incidents to keep our campus safe</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Student Login</CardTitle>
            <CardDescription>
              Login with your college ID or continue as a guest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="college" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="college" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  College ID
                </TabsTrigger>
                <TabsTrigger value="guest" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Guest
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="college" className="space-y-4 mt-4">
                <form onSubmit={handleCollegeLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collegeId">College ID</Label>
                    <Input
                      id="collegeId"
                      placeholder="e.g., STU2024001"
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login with College ID
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="guest" className="space-y-4 mt-4">
                <div className="text-center py-6">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Continue as a guest to report incidents anonymously. 
                    No registration required.
                  </p>
                  <Button onClick={handleGuestLogin} className="w-full" variant="secondary">
                    Continue as Guest
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-border">
              <Button 
                variant="link" 
                className="w-full text-muted-foreground"
                onClick={() => navigate('/admin/login')}
              >
                Admin Login →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentLogin;
