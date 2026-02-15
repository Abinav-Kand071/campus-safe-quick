import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '@/hooks/useAuth';
import { useIncidents } from '@/hooks/useIncidents';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, LogOut, Filter, MapPin, UserPlus, Loader2, Key, 
  ChevronDown, ChevronUp, Ban, Check, Undo, Activity, Users, BarChart3, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { CampusLocation, IncidentStatus, CAMPUS_LOCATIONS, INCIDENT_STATUSES } from '@/types';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getAllStudents } = useAuth();
  const { filterIncidents, getLocationStats, updateIncidentStatus } = useIncidents();

  // --- STATE ---
  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [students, setStudents] = useState<User[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', 
    email: '', 
    phone: '', 
    role: 'hod' as User['role'],
    password: '' // Added for Admin-assigned passwords
  });

  useEffect(() => { 
    fetchStudents(); 
  }, []);

  const fetchStudents = async () => {
    try {
      const fetched = await getAllStudents();
      if (Array.isArray(fetched)) setStudents(fetched);
    } catch (error) { 
      console.error("Error loading students", error); 
    }
  };

  const updateStudentStatus = async (id: string, newStatus: string) => {
    try {
      if (newStatus === 'deleted') {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        toast.success("Removed");
      } else {
        const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        toast.success(`Updated to ${newStatus}`);
      }
      fetchStudents(); 
    } catch (err) { 
      const msg = err instanceof Error ? err.message : "Action Failed";
      toast.error(msg); 
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) { 
      toast.error("Name, Email, and Password are required"); 
      return; 
    }
    
    setAddingUser(true);
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', newUser.email)
        .maybeSingle();

      if (existing) { 
        toast.error("Email already exists in the system!"); 
        setAddingUser(false); 
        return; 
      }

      // Insert new staff with manual password and approved status
      const { error } = await supabase.from('users').insert([{
        name: newUser.name, 
        email: newUser.email, 
        phone: newUser.phone, 
        role: newUser.role, 
        status: 'approved', 
        password: newUser.password // Option 1: Saving password directly
      }]);

      if (error) throw error;

      toast.success(`${newUser.role.toUpperCase()} Authorized!`, { 
        description: "They can now log in with the password you assigned." 
      });
      
      setNewUser({ name: '', email: '', phone: '', role: 'hod', password: '' });
    } catch (err) { 
      const msg = err instanceof Error ? err.message : "Failed to create staff";
      toast.error(msg); 
    } finally { 
      setAddingUser(false); 
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };
  
  if (!user) return null;

  const isSuperAdmin = user.role === 'admin' || user.role === 'principal';
  const canModifyStatus = user.role !== 'class_in_charge';
  const filteredIncidents = filterIncidents(locationFilter === 'all' ? undefined : locationFilter, statusFilter === 'all' ? undefined : statusFilter);
  const locationStats = getLocationStats();
  const pendingStudents = students.filter(s => s.status === 'pending');
  const activeStudents = students.filter(s => s.status === 'approved' || s.status === 'banned');

  const getHeatmapColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900 border-red-700 text-white shadow-md scale-105'; 
      case 'high': return 'bg-red-50 border-red-200 text-red-900';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default: return 'bg-white border-gray-100 text-gray-400 hover:border-gray-200';
    }
  };

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
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{user.name} • {user.role.replace('_', ' ')}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600"><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="feed" className="w-full">
          
          <TabsList className="flex w-full mb-8 bg-transparent p-0 gap-3">
            <TabsTrigger 
              value="feed" 
              className="flex-1 border bg-white data-[state=active]:bg-blue-50 data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-md h-12 rounded-xl transition-all"
            >
              <Activity className="w-4 h-4 mr-2" /> Live Feed
            </TabsTrigger>
            
            <TabsTrigger 
              value="users" 
              className="flex-1 border bg-white data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 data-[state=active]:text-orange-700 data-[state=active]:shadow-md h-12 rounded-xl transition-all"
            >
              <Users className="w-4 h-4 mr-2" /> Students 
              {pendingStudents.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 rounded-full shadow-sm">{pendingStudents.length}</span>}
            </TabsTrigger>
            
            <TabsTrigger 
              value="analytics" 
              className="flex-1 border bg-white data-[state=active]:bg-purple-50 data-[state=active]:border-purple-500 data-[state=active]:text-purple-700 data-[state=active]:shadow-md h-12 rounded-xl transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" /> Heatmap
            </TabsTrigger>

            {isSuperAdmin && (
              <TabsTrigger 
                value="authority" 
                className="flex-1 border bg-white data-[state=active]:bg-gray-900 data-[state=active]:border-black data-[state=active]:text-white data-[state=active]:shadow-md h-12 rounded-xl transition-all"
              >
                <Lock className="w-4 h-4 mr-2" /> Authority
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="feed">
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <div className="flex items-center gap-2 bg-white border p-2 rounded-md shadow-sm">
                   <Filter className="w-4 h-4 text-gray-400" />
                   <select className="text-sm bg-transparent border-none outline-none focus:ring-0 cursor-pointer" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value as CampusLocation | 'all')}>
                      <option value="all">All Locations</option>
                      {CAMPUS_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                   </select>
                   <div className="h-4 w-[1px] bg-gray-300 mx-2" />
                   <select className="text-sm bg-transparent border-none outline-none focus:ring-0 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | 'all')}>
                      <option value="all">All Statuses</option>
                      {INCIDENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                   </select>
                </div>
             </div>
             <div className="space-y-4">
                {filteredIncidents.map(inc => (
                    <Card key={inc.id} className="bg-white border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <div className={`h-1 w-full ${inc.status === 'resolved' ? 'bg-green-500' : 'bg-blue-600'}`} />
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 w-full">
                                    <div className="flex items-center gap-2">
                                       <h3 className="font-bold text-gray-800">{inc.location}</h3>
                                       <Badge variant="outline" className="text-[10px] uppercase font-bold">{inc.type}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border italic">"{inc.description}"</p>
                                    <p className="text-[10px] text-gray-400">Reporter: {inc.reportedBy} • {new Date(inc.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-3 ml-4 min-w-[140px]">
                                   {canModifyStatus && inc.status !== 'resolved' ? (
                                      <Select defaultValue={inc.status} onValueChange={(val) => updateIncidentStatus(inc.id, val as IncidentStatus)}>
                                        <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>{INCIDENT_STATUSES.map(s => (<SelectItem key={s.value} value={s.value} className={s.value === 'resolved' ? 'text-green-600 font-bold' : ''}>{s.label}</SelectItem>))}</SelectContent>
                                      </Select>
                                   ) : (<Badge variant="outline">{inc.status.replace('_', ' ')}</Badge>)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredIncidents.length === 0 && <p className="text-center text-gray-400 py-10">No incidents found.</p>}
             </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
             {pendingStudents.length > 0 && (
               <Card className="border-orange-200 bg-orange-50/50">
                 <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-orange-800 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Pending ({pendingStudents.length})</CardTitle></CardHeader>
                 <CardContent className="space-y-2">
                   {pendingStudents.map(s => (
                     <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                       <div><p className="font-bold text-gray-800 text-sm">{s.name}</p><p className="text-[10px] text-gray-500 font-mono">{s.email}</p></div>
                       <div className="flex gap-2"><Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateStudentStatus(s.id, 'deleted')}>Decline</Button><Button size="sm" className="bg-green-600 h-7 text-xs hover:bg-green-700" onClick={() => updateStudentStatus(s.id, 'approved')}>Approve</Button></div>
                     </div>
                   ))}
                 </CardContent>
               </Card>
             )}
             <Card className="border-none shadow-sm">
               <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-gray-600">Registered Students</CardTitle></CardHeader>
               <CardContent className="space-y-2">
                 {activeStudents.map(s => (
                   <div key={s.id} className={`border rounded-xl transition-all ${s.status === 'banned' ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                     <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 rounded-xl" onClick={() => setExpandedStudentId(expandedStudentId === s.id ? null : s.id)}>
                       <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s.status === 'banned' ? 'bg-red-200 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{s.name.charAt(0)}</div>
                         <div><p className={`font-bold text-sm ${s.status === 'banned' ? 'text-red-700 line-through' : 'text-gray-800'}`}>{s.name}</p><p className="text-[10px] text-gray-400">{s.email}</p></div>
                       </div>
                       <div className="flex items-center gap-2">{s.status === 'banned' && <Badge variant="destructive" className="text-[10px]">BANNED</Badge>}{expandedStudentId === s.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</div>
                     </div>
                     {expandedStudentId === s.id && (
                       <div className="p-3 border-t bg-gray-50/50 rounded-b-xl animate-in slide-in-from-top-2">
                         <div className="grid grid-cols-2 gap-4 mb-4 text-xs"><div><span className="text-gray-400 block mb-1">College ID</span><span className="font-mono font-medium">{s.email}</span></div><div><span className="text-gray-400 block mb-1">Biometric Hash</span><span className="font-mono font-medium truncate block w-full">{s.phone || 'N/A'}</span></div></div>
                         <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                           {s.status === 'approved' ? (
                             <>
                               <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => updateStudentStatus(s.id, 'pending')}><Undo className="w-3 h-3 mr-2" /> Unapprove</Button>
                               <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs bg-gray-900 hover:bg-black" onClick={() => updateStudentStatus(s.id, 'banned')}><Ban className="w-3 h-3 mr-2" /> Ban</Button>
                             </>
                           ) : (
                             <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-green-200 text-green-700 hover:bg-green-50" onClick={() => updateStudentStatus(s.id, 'approved')}><Check className="w-3 h-3 mr-2" /> Lift Ban</Button>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
                 {activeStudents.length === 0 && <p className="text-gray-400 text-center py-4 text-sm">No students registered.</p>}
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {locationStats.map(stat => (
                    <div key={stat.location} className={`aspect-square p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300 ${getHeatmapColor(stat.severity)}`}>
                      <MapPin className={`w-5 h-5 mb-1 ${stat.severity === 'low' ? 'text-gray-300' : ''}`} />
                      <h3 className="font-bold text-[10px] uppercase tracking-wider mb-0 leading-tight">{stat.location}</h3>
                      <p className="text-2xl font-black leading-none my-1">{stat.count}</p>
                      {stat.severity !== 'low' && (<span className="text-[8px] uppercase font-bold opacity-70">{stat.severity}</span>)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {isSuperAdmin && (
            <TabsContent value="authority">
              <Card className="border-none shadow-sm max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" /> Authorize New Staff
                  </CardTitle>
                  <CardDescription>
                    Create a direct access profile for college authorities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400">Full Name</label>
                        <Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Dr. Smith" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400">Official Email (ID)</label>
                        <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="hod@college.edu" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400">Assign Login Password</label>
                      <Input 
                        type="text" 
                        value={newUser.password} 
                        onChange={e => setNewUser({...newUser, password: e.target.value})} 
                        placeholder="Assign an initial password" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400">Security Phone</label>
                      <Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="+91..." />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400">Authority Level</label>
                      <Select value={newUser.role} onValueChange={(val) => setNewUser({...newUser, role: val as User['role']})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hod">HOD</SelectItem>
                          <SelectItem value="class_in_charge">Class In-Charge</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="security_head">Security Head</SelectItem>
                          <SelectItem value="principal">Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 h-11" disabled={addingUser}>
                      {addingUser ? <Loader2 className="animate-spin" /> : <><Key className="w-4 h-4 mr-2" /> Create & Authorize</>}
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