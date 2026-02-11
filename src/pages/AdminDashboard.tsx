import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '@/hooks/useAuth'; 
import { useIncidents } from '@/hooks/useIncidents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, Filter, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { CampusLocation, IncidentStatus, CAMPUS_LOCATIONS } from '@/types';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getAllStudents, approveStudent } = useAuth();
  const { incidents, filterIncidents, getLocationStats, updateIncidentStatus } = useIncidents();
  
  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedStudents = await getAllStudents();
        if (Array.isArray(fetchedStudents)) setStudents(fetchedStudents);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    loadData();
  }, [getAllStudents]);

  const handleApproveStudent = async (id: string) => {
    try {
      await approveStudent(id);
      const updated = await getAllStudents();
      setStudents(updated);
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const rawFiltered = filterIncidents(
    locationFilter === 'all' ? undefined : locationFilter,
    statusFilter === 'all' ? undefined : statusFilter
  );
  const filteredIncidents = rawFiltered || [];

  const locationStats = getLocationStats();
  if (!user) return null;

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
              <h1 className="font-bold text-gray-900 leading-tight">Admin Command</h1>
              <span className="text-xs text-gray-500 font-medium">
                {user.name} • {user.role.toUpperCase()}
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
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white p-1 shadow-sm rounded-xl">
            <TabsTrigger value="feed">Live Feed</TabsTrigger>
            <TabsTrigger value="users">
                Users 
                {pendingStudents.length > 0 && <span className="ml-2 flex h-2 w-2 rounded-full bg-red-500"></span>}
            </TabsTrigger>
            <TabsTrigger value="analytics">Heatmap</TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <div className="flex items-center gap-2 bg-white border p-2 rounded-md shadow-sm">
                   <Filter className="w-4 h-4 text-gray-500" />
                   
                   {/* Scalable Location Filter */}
                   <select 
                      className="text-sm bg-transparent border-none focus:ring-0 outline-none"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value as CampusLocation | 'all')}
                   >
                      <option value="all">All Locations</option>
                      {CAMPUS_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                   </select>

                   <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>

                   {/* Status Filter */}
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
                    <Card key={inc.id} className="bg-white hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <h3 className="font-bold text-gray-800">{inc.location}</h3>
                                       <Badge variant="outline" className="text-xs font-normal">
                                          {inc.type}
                                       </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md mt-2 block">
                                       "{inc.description}"
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                       Reported by: {inc.reportedBy} • {new Date(inc.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-2 ml-4">
                                   {/* Aesthetic Status Badges */}
                                   <Badge className={
                                      inc.status === 'resolved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                                      inc.status === 'investigating' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 
                                      inc.status === 'action_taken' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                                      'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                   }>
                                      {inc.status.replace('_', ' ')}
                                   </Badge>
                                   
                                   <div className="flex gap-2 mt-1">
                                     {inc.status === 'reported' && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateIncidentStatus(inc.id, 'investigating')}>
                                           Investigate
                                        </Button>
                                     )}
                                     {inc.status === 'investigating' && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs border-purple-200 text-purple-700" onClick={() => updateIncidentStatus(inc.id, 'action_taken')}>
                                           Take Action
                                        </Button>
                                     )}
                                     {inc.status !== 'resolved' && (
                                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateIncidentStatus(inc.id, 'resolved')}>
                                           Resolve
                                        </Button>
                                     )}
                                   </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                {filteredIncidents.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                    <p className="text-gray-400">No incidents found matching filters.</p>
                  </div>
                )}
             </div>
          </TabsContent>

          {/* User Management Tab Content... (remains same) */}
          <TabsContent value="users">
            {/* ... user logic ... */}
          </TabsContent>

          {/* Heatmap Tab Content... (remains same) */}
          <TabsContent value="analytics">
            {/* ... heatmap logic ... */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;