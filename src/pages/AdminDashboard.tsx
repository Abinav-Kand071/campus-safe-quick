import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIncidents } from '@/hooks/useIncidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, LogOut, MapPin, AlertTriangle, Bell, TrendingUp, 
  Filter, CheckCircle, Ban, Users, UserPlus, Lock 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  CAMPUS_LOCATIONS, INCIDENT_STATUSES, CampusLocation, IncidentStatus,
  Incident, INCIDENT_TYPES, ADMIN_ROLES, Student, AdminRole, Admin
} from '@/types';

// If you have the heatmap component, uncomment this:
// import HeatMap from '@/components/HeatMap'; 

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // 1. UPDATED DESTRUCTURING: specific to the NEW useAuth
  const { 
    admin, logoutAdmin, getAllStudents, 
    approveStudent, createNewAdmin, getStaffList
  } = useAuth();
  
  const { 
    incidents, updateIncidentStatus, getLocationStats, 
    getPriorityLeaderboard, filterIncidents 
  } = useIncidents();
  
  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [notifications, setNotifications] = useState<Incident[]>([]);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Admin[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: '' as AdminRole | '' });
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUsers(true);
        const fetchedStudents = await getAllStudents();
        const fetchedStaff = await getStaffList();
        
        if (Array.isArray(fetchedStudents)) setStudents(fetchedStudents);
        if (Array.isArray(fetchedStaff)) setStaffList(fetchedStaff);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadData();
  }, [getAllStudents, getStaffList]);

  // Ban/unban not implemented in this demo; show info instead
  const handleToggleBan = async (_studentId: string) => {
    toast.info('Ban/unban functionality is not available in this demo');
  };

  const handleApproveStudent = async (id: string) => {
    const success = await approveStudent(id);
    if (success) {
      toast.success('Student approved');
      const updated = await getAllStudents();
      setStudents(updated);
    } else {
      toast.error('Failed to approve');
    }
  };

  const handleLogout = () => { logoutAdmin(); navigate('/'); };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.role) {
      toast.error("Fill all fields"); return;
    }
    // Manual permission check since we removed the helper function
    if (admin?.role !== 'security_head' && admin?.role !== 'principal') {
      toast.error("Permission Denied"); return;
    }
    await createNewAdmin(newStaff.name, newStaff.role as AdminRole, newStaff.email);
    toast.success(`Access granted to ${newStaff.name}`);
    const updatedStaff = await getStaffList();
    setStaffList(updatedStaff);
  };

  const filteredIncidents = filterIncidents(
    locationFilter === 'all' ? undefined : locationFilter,
    statusFilter === 'all' ? undefined : statusFilter
  );

  if (!admin) return null;

  const pendingStudents = students.filter(s => !s.isApproved);
  const activeStudents = students.filter(s => s.isApproved);

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
              <span className="text-xs text-muted-foreground">{admin.name} ({admin.role})</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="users">
                Users 
                {pendingStudents.length > 0 && <span className="ml-2 text-destructive">●</span>}
            </TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="analytics">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
             <div className="space-y-4">
                {filteredIncidents.map(inc => (
                    <Card key={inc.id} className="glass">
                        <CardContent className="p-4 flex justify-between">
                            <div>
                                <h3 className="font-bold">{inc.location}</h3>
                                <p className="text-sm text-muted-foreground">{inc.description}</p>
                                <Badge variant="outline" className="mt-2">{inc.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredIncidents.length === 0 && <p className="text-center text-muted-foreground">No incidents.</p>}
             </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="glass">
              <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                    {/* Pending Section */}
                    {pendingStudents.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-yellow-600 mb-2">Pending Approvals</h3>
                            {pendingStudents.map(s => (
                                <div key={s.id} className="flex justify-between items-center p-3 border rounded mb-2">
                                    <span>{s.name} ({s.collegeId})</span>
                                    <Button size="sm" className="bg-green-600" onClick={() => handleApproveStudent(s.id)}>Approve</Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Active/Banned Section */}
                    <div>
                        <h3 className="font-semibold mb-2">Registered Students</h3>
                        {activeStudents.map(s => (
                          <div key={s.id} className={`flex justify-between items-center p-3 border rounded mb-2`}>
                            <div>
                              <span className="font-medium">{s.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{s.collegeId}</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleToggleBan(s.id)}
                            >
                              BAN USER
                            </Button>
                          </div>
                        ))}
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs remain standard... */}
          <TabsContent value="staff">
             <div className="p-4 text-center text-muted-foreground">Staff management settings</div>
          </TabsContent>
           <TabsContent value="analytics">
             <div className="p-4 text-center text-muted-foreground">Map view loading...</div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;