import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '@/hooks/useAuth'; 
import { useIncidents } from '@/hooks/useIncidents';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Shield, LogOut, Filter, MapPin, 
  AlertTriangle, Users, UserPlus, Loader2, Key
} from 'lucide-react';
import { toast } from 'sonner';
import { CampusLocation, IncidentStatus, CAMPUS_LOCATIONS } from '@/types';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getAllStudents, approveStudent } = useAuth();
  const { incidents, filterIncidents, getLocationStats, updateIncidentStatus } = useIncidents();
  
  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [students, setStudents] = useState<User[]>([]);
  
  // State for Admin/Staff Creation
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'hod' as User['role']
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedStudents = await getAllStudents();
        if (Array.isArray(fetchedStudents)) setStudents(fetchedStudents);
      } catch (error) {
        console.error("Dashboard load error", error);
      }
    };
    loadData();
  }, [getAllStudents]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.phone) {
      toast.error("Please fill all security fields");
      return;
    }
    setAddingUser(true);
    try {
      const { error } = await supabase.from('users').insert([{
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone,
        role: newUser.role,
        status: 'approved'
      }]);

      if (error) throw error;

      toast.success(`New ${newUser.role.toUpperCase()} Created Successfully!`);
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'hod' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Security update failed";
      toast.error(msg);
    } finally {
      setAddingUser(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return null;

  // Access Control Logic
  const isSuperAdmin = user.role === 'admin' || user.role === 'principal';
  const canModifyStatus = user.role !== 'class_in_charge';

  const rawFiltered = filterIncidents(
    locationFilter === 'all' ? undefined : locationFilter,
    statusFilter === 'all' ? undefined : statusFilter
  );
  const filteredIncidents = rawFiltered || [];
  const locationStats = getLocationStats();
  const pendingStudents = students.filter(s => s.status === 'pending');
  const activeStudents = students.filter(s => s.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Campus Control</h1>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {user.name} • {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className={`grid w-full mb-6 bg-white p-1 shadow-sm rounded-xl ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="feed">Live Feed</TabsTrigger>
            <TabsTrigger value="users">Students</TabsTrigger>
            <TabsTrigger value="analytics">Heatmap</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="authority">Authority</TabsTrigger>}
          </TabsList>

          {/* --- FEED TAB --- */}
          <TabsContent value="feed">
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <div className="flex items-center gap-2 bg-white border p-2 rounded-md shadow-sm">
                   <Filter className="w-4 h-4 text-gray-400" />
                   <select 
                      className="text-sm bg-transparent border-none focus:ring-0 outline-none"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value as CampusLocation | 'all')}
                   >
                      <option value="all">All Blocks</option>
                      {CAMPUS_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                   </select>
                   <div className="h-4 w-[1px] bg-gray-300 mx-2" />
                   <select 
                      className="text-sm bg-transparent border-none focus:ring-0 outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | 'all')}
                   >
                      <option value="all">All Statuses</option>
                      <option value="reported">Reported</option>
                      <option value="investigating">Investigating</option>
                      <option value="action_taken">Action Taken</option>
                      <option value="resolved">Resolved</option>
                   </select>
                </div>
             </div>

             <div className="space-y-4">
                {filteredIncidents.map(inc => (
                    <Card key={inc.id} className="bg-white border-none shadow-sm overflow-hidden">
                        <div className={`h-1 w-full ${inc.status === 'resolved' ? 'bg-green-500' : 'bg-blue-600'}`} />
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                       <h3 className="font-bold text-gray-800">{inc.location}</h3>
                                       <Badge variant="outline" className="text-[10px] uppercase font-bold">{inc.type}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border italic">"{inc.description}"</p>
                                    <p className="text-[10px] text-gray-400">Reporter: {inc.reportedBy} • {new Date(inc.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-3 ml-4">
                                   <Badge className={inc.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}>
                                      {inc.status.replace('_', ' ')}
                                   </Badge>
                                   {canModifyStatus && inc.status !== 'resolved' && (
                                     <div className="flex gap-1">
                                       {inc.status === 'reported' && <Button size="sm" className="h-7 text-[10px]" onClick={() => updateIncidentStatus(inc.id, 'investigating')}>Investigate</Button>}
                                       {inc.status === 'investigating' && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateIncidentStatus(inc.id, 'action_taken')}>Take Action</Button>}
                                       <Button size="sm" className="h-7 text-[10px] bg-green-600 hover:bg-green-700" onClick={() => updateIncidentStatus(inc.id, 'resolved')}>Resolve</Button>
                                     </div>
                                   )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
          </TabsContent>

          {/* --- STUDENTS TAB --- */}
          <TabsContent value="users">
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle className="text-lg">Student Management</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                    {pendingStudents.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-orange-600 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> Pending Approval
                            </h3>
                            {pendingStudents.map(s => (
                                <div key={s.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="text-sm"><p className="font-bold">{s.name}</p><p className="text-xs text-gray-500">{s.email}</p></div>
                                    <Button size="sm" className="bg-blue-600 h-8" onClick={() => approveStudent(s.id)}>Approve</Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400">Active Students</h3>
                        {activeStudents.map(s => (
                          <div key={s.id} className="flex justify-between items-center p-3 border rounded-xl bg-white">
                            <div className="text-sm"><p className="font-medium">{s.name}</p><p className="text-xs text-gray-400">{s.email}</p></div>
                            <Badge className="bg-green-50 text-green-600 border-none">Verified</Badge>
                          </div>
                        ))}
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- HEATMAP TAB --- */}
          <TabsContent value="analytics">
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle className="text-lg">Block Safety Grading</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locationStats.sort((a,b) => b.count - a.count).map(stat => (
                    <div key={stat.location} className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center text-center ${
                      stat.severity === 'critical' ? 'bg-red-950/10 border-red-950 text-red-950' :
                      stat.severity === 'high' ? 'bg-red-500/5 border-red-500 text-red-600' :
                      stat.severity === 'medium' ? 'bg-yellow-500/5 border-yellow-500 text-yellow-700' :
                      'bg-green-500/5 border-green-500 text-green-700'
                    }`}>
                      <MapPin className="w-6 h-6 mb-2" />
                      <h3 className="font-black text-sm uppercase tracking-tighter">{stat.location}</h3>
                      <p className="text-4xl font-black my-1">{stat.count}</p>
                      <Badge variant="outline" className="border-current text-[10px]">{stat.severity} Level</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- AUTHORITY TAB (NEW) --- */}
          {isSuperAdmin && (
            <TabsContent value="authority">
              <Card className="border-none shadow-sm max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Create Management Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400">Full Name</label>
                        <Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="John Doe" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400">Security Phone</label>
                        <Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="+91..." />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400">Login Email (ID)</label>
                      <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="staff@college.edu" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400">Access Password</label>
                      <Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400">Authority Level</label>
                      <select 
                        className="w-full h-10 rounded-md border border-input px-3 text-sm bg-white"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                      >
                        <option value="hod">Head of Department (HOD)</option>
                        <option value="class_in_charge">Class In-Charge</option>
                        <option value="admin">System Administrator</option>
                        <option value="security_head">Security Head</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 h-11" disabled={addingUser}>
                      {addingUser ? <Loader2 className="animate-spin" /> : <><Key className="w-4 h-4 mr-2" /> Grant Access</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;