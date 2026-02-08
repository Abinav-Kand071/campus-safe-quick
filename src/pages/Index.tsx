import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, GraduationCap, Lock, ArrowRight, Activity } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary mb-4 shadow-lg shadow-primary/20">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Campus <span className="text-primary">Safety</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
          Secure incident reporting and real-time safety analytics for a protected campus environment.
        </p>
      </div>

      {/* Access Portals */}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl animate-slide-up">
        
        {/* Student Portal Card */}
        <Card className="glass group hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer" onClick={() => navigate('/student/login')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Student Portal
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </CardTitle>
            <CardDescription>
              Access for registered students to report incidents and view safety alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Real-time Incident Reporting
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Anonymous Safety Checks
              </li>
            </ul>
            <Button className="w-full mt-6" variant="outline">
              Student Login
            </Button>
          </CardContent>
        </Card>

        {/* Administration Portal Card */}
        <Card className="glass group hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer" onClick={() => navigate('/admin/login')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Security Administration
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </CardTitle>
            <CardDescription>
              Restricted access for Wardens, Principals, and Security Heads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" />
                Live Command Center
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                Biometric User Management
              </li>
            </ul>
            <Button className="w-full mt-6 bg-slate-900 text-white hover:bg-slate-800">
              Admin Access
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Footer / Disclaimer */}
      <p className="mt-12 text-sm text-muted-foreground text-center">
        Restricted Access System • Authorized Personnel Only
        <br />
        <span className="text-xs opacity-50">v2.0.0 • Secure Build</span>
      </p>
    </div>
  );
};

export default Index;