import { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, LogOut, Filter, MapPin, UserPlus, Loader2, Key, 
  ChevronDown, ChevronUp, Ban, Check, Undo, Activity, Users, BarChart3, Lock, Link as LinkIcon, CheckCircle2, MessageSquare, X, Eye, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { CampusLocation, IncidentStatus, CAMPUS_LOCATIONS, INCIDENT_STATUSES } from '@/types';

// Helper function to turn URLs in text into clickable hyperlinks
const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold underline">
          {part}
        </a>
      );
    }
    return part;
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getAllStudents } = useAuth();
  const { filterIncidents, getLocationStats, incidents, updateIncidentStatus } = useIncidents();

  const [activeTab, setActiveTab] = useState<string>('feed');
  const [studentFilter, setStudentFilter] = useState<string | null>(null);

  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [students, setStudents] = useState<User[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const [revealedIncidents, setRevealedIncidents] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState<string>('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);

  const [addingUser, setAddingUser] = useState<boolean>(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', phone: '', role: 'hod' as User['role'], password: '' 
  });

  const fetchStudents = useCallback(async () => {
    try {
      const fetched = await getAllStudents();
      if (Array.isArray(fetched)) setStudents(fetched);
    } catch (error) { console.error("Error loading students", error); }
  }, [getAllStudents]);

  useEffect(() => { 
    fetchStudents(); 
  }, [fetchStudents]);

  const toggleRevealIdentity = (incidentId: string) => {
    const newRevealed = new Set(revealedIncidents);
    if (newRevealed.has(incidentId)) {
      newRevealed.delete(incidentId);
    } else {
      newRevealed.add(incidentId);
      toast.warning("Identity Revealed. This action is logged for compliance.", {
        style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }
      });
    }
    setRevealedIncidents(newRevealed);
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
      toast.error(err instanceof Error ? err.message : "Action Failed"); 
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) { toast.error("Required fields missing"); return; }
    setAddingUser(true);
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('email', newUser.email).maybeSingle();
      if (existing) { toast.error("Email exists!"); setAddingUser(false); return; }
      const { error } = await supabase.from('users').insert([{
        name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role, status: 'approved', password: newUser.password 
      }]);
      if (error) throw error;
      toast.success(`${newUser.role.toUpperCase()} Authorized!`);
      setNewUser({ name: '', email: '', phone: '', role: 'hod', password: '' });
    } catch (err) { toast.error("Failed to create staff"); } 
    finally { setAddingUser(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleStatusChangeRequest = (id: string, newStatus: string) => {
    if (newStatus === 'resolved') {
      setSelectedIncidentId(id);
      setIsModalOpen(true);
    } else {
      updateIncidentStatus(id, newStatus as IncidentStatus);
    }
  };

  const submitResolution = async () => {
    if (!selectedIncidentId || !resolutionRemarks.trim()) {
      toast.error("Please enter resolution remarks.");
      return;
    }
    
    setIsSubmittingResolution(true);
    try {
      const originalIncident = incidents.find(i => i.id === selectedIncidentId);
      if (!originalIncident) throw new Error("Incident not found");

      const newDescription = `${originalIncident.description}\n\n[ADMIN REMARKS]: ${resolutionRemarks}`;

      const { error } = await supabase
        .from('incidents')
        .update({ status: 'resolved', description: newDescription })
        .eq('id', selectedIncidentId);

      if (error) throw error;
      
      toast.success("Incident resolved and feedback sent to student.");
      setIsModalOpen(false);
      setResolutionRemarks('');
      
    } catch (error) {
      toast.error("Failed to save resolution");
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const filteredIncidents = filterIncidents(locationFilter === 'all' ? undefined : locationFilter, statusFilter === 'all' ? undefined : statusFilter);
  
  const finalIncidents = studentFilter 
    ? filteredIncidents.filter(inc => inc.reportedBy === studentFilter) 
    : filteredIncidents;

  const exportToCSV = () => {
    const dataToExport = finalIncidents.length > 0 ? finalIncidents : incidents;
    const headers = ['Location', 'Type', 'Status', 'Reported By', 'Date', 'Description'];
    
    const csvRows = dataToExport.map(inc => [
      `"${inc.location}"`,
      `"${inc.type}"`,
      `"${inc.status}"`,
      `"${inc.reportedBy}"`,
      `"${new Date(inc.timestamp).toLocaleString()}"`,
      `"${inc.description.replace('[ANONYMOUS_FLAG]', '').replace(/"/g, '""')}"` 
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `campus_incidents_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Spreadsheet downloaded successfully!");
  };

  if (!user) return null;

  const isSuperAdmin = user.role === 'admin' || user.role === 'principal';
  const canModifyStatus = user.role !== 'class_in_charge';
  
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" /> Resolve Incident
            </DialogTitle>
            <DialogDescription>
              Please provide details on how this issue was handled.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="e.g., Security patrol dispatched, issue fixed."
              value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              className="h-32 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmittingResolution}>Cancel</Button>
            <Button onClick={submitResolution} className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmittingResolution}>
              {isSubmittingResolution ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Confirm & Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full mb-8 bg-transparent p-0 gap-3">
            <TabsTrigger value="feed" className="flex-1 border bg-white data-[state=active]:bg-blue-50 data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-md h-12 rounded-xl transition-all">
              <Activity className="w-4 h-4 mr-2" /> Live Feed
            </TabsTrigger>
            
            <TabsTrigger value="users" className="flex-1 border bg-white data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 data-[state=active]:text-orange-700 data-[state=active]:shadow-md h-12 rounded-xl transition-all">
              <Users className="w-4 h-4 mr-2" /> Students 
              {pendingStudents.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 rounded-full shadow-sm">{pendingStudents.length}</span>}
            </TabsTrigger>
            
            <TabsTrigger value="analytics" className="flex-1 border bg-white data-[state=active]:bg-purple-50 data-[state=active]:border-purple-500 data-[state=active]:text-purple-700 data-[state=active]:shadow-md h-12 rounded-xl transition-all">
              <BarChart3 className="w-4 h-4 mr-2" /> Heatmap
            </TabsTrigger>

            {isSuperAdmin && (
              <TabsTrigger value="authority" className="flex-1 border bg-white data-[state=active]:bg-gray-900 data-[state=active]:border-black data-[state=active]:text-white data-[state=active]:shadow-md h-12 rounded-xl transition-all">
                <Lock className="w-4 h-4 mr-2" /> Authority
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="feed">
             {studentFilter && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">History for: <strong>{studentFilter}</strong></span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStudentFilter(null)} className="h-7 text-xs text-blue-600 hover:bg-blue-100 hover:text-blue-800">
                    <X className="w-3 h-3 mr-1" /> Clear Filter
                  </Button>
                </div>
             )}

             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 overflow-x-auto pb-2">
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
                
                <Button variant="outline" size="sm" onClick={exportToCSV} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 flex-shrink-0">
                  Download CSV
                </Button>
             </div>
             
             <div className="space-y-4">
                {finalIncidents.map(inc => {
                  const isAnonymousReport = inc.description.includes('[ANONYMOUS_FLAG]');
                  const isRevealed = revealedIncidents.has(inc.id);
                  const showIdentity = !isAnonymousReport || isRevealed;

                  const reporterData = students.find(s => s.email === inc.reportedBy);
                  const reporterPhone = reporterData?.phone ? reporterData.phone : 'No phone linked';

                  return (
                    <Card key={inc.id} className="bg-white border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <div className={`h-1 w-full ${inc.status === 'resolved' ? 'bg-green-500' : 'bg-blue-600'}`} />
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 w-full">
                                    <div className="flex items-center gap-2">
                                       <h3 className="font-bold text-gray-800">{inc.location}</h3>
                                       <Badge variant="outline" className="text-[10px] uppercase font-bold">{inc.type}</Badge>
                                       {(Date.now() - new Date(inc.timestamp).getTime() < 300000) && (
                                         <span className="relative flex h-3 w-3 ml-2">
                                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                           <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                         </span>
                                       )}
                                    </div>
                                    
                                    {(() => {
                                      const hasEvidence = inc.description.includes('[EVIDENCE]:');
                                      const hasRemarks = inc.description.includes('[ADMIN REMARKS]:');
                                      let mainText = inc.description.replace('[ANONYMOUS_FLAG]', '').trim();
                                      let evidenceUrl = '';
                                      let adminRemarks = '';

                                      if (hasRemarks) {
                                        const parts = mainText.split('[ADMIN REMARKS]:');
                                        mainText = parts[0].trim();
                                        adminRemarks = parts[1].trim();
                                      }
                                      if (hasEvidence) {
                                        const parts = mainText.split('[EVIDENCE]:');
                                        mainText = parts[0].trim();
                                        evidenceUrl = parts[1].trim();
                                      }

                                      return (
                                        <div className="space-y-2">
                                          <div className="bg-gray-50 p-3 rounded-lg border">
                                            <div className="text-sm text-gray-600 italic break-words whitespace-pre-wrap">
                                              {/* Function automatically converts Google Map URLs to clickable links */}
                                              {renderTextWithLinks(`"${mainText}"`)}
                                            </div>
                                            {evidenceUrl && (
                                              <div className="mt-2 pt-2 border-t border-gray-200">
                                                <a href={evidenceUrl.startsWith('http') || evidenceUrl.startsWith('data:') ? evidenceUrl : `https://${evidenceUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md max-w-full">
                                                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                                  <span className="truncate">View Evidence</span>
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                          {adminRemarks && (
                                            <div className="bg-green-50 p-2 rounded-lg border border-green-200 flex items-start gap-2">
                                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                              <p className="text-xs text-green-800 font-medium break-words">Admin Resolution: {adminRemarks}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    <div className="mt-3 p-2 bg-gray-50 rounded-md border border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-2">
                                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> 
                                        <strong>Reporter:</strong> 
                                        <span className="text-gray-900 font-mono">
                                          {showIdentity ? inc.reportedBy : 'Anonymous'}
                                        </span>
                                      </p>
                                      
                                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        <strong>Phone:</strong>
                                        <span className="text-gray-900 font-mono">
                                          {showIdentity ? reporterPhone : 'Hidden'}
                                        </span>
                                      </p>
                                      
                                      <p className="text-[11px] text-gray-400 ml-auto">
                                        {new Date(inc.timestamp).toLocaleString()}
                                      </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 ml-4 min-w-[140px]">
                                   {canModifyStatus && inc.status !== 'resolved' ? (
                                      <Select defaultValue={inc.status} onValueChange={(val) => handleStatusChangeRequest(inc.id, val)}>
                                        <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>{INCIDENT_STATUSES.map(s => (<SelectItem key={s.value} value={s.value} className={s.value === 'resolved' ? 'text-green-600 font-bold' : ''}>{s.label}</SelectItem>))}</SelectContent>
                                      </Select>
                                   ) : (<Badge variant="outline" className={inc.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' : ''}>{inc.status.replace('_', ' ')}</Badge>)}
                                   
                                   {/* Moved the Override Button to sit underneath the dropdown */}
                                   {isAnonymousReport && !isRevealed && isSuperAdmin && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => toggleRevealIdentity(inc.id)}
                                        className="mt-2 w-full border-red-200 text-red-600 bg-red-50 hover:bg-red-100 h-auto py-1.5 px-2 text-[9px] uppercase font-bold tracking-wider leading-tight text-center"
                                      >
                                        <Eye className="w-3 h-3 mr-1 flex-shrink-0" />
                                        Reveal Identity
                                      </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                  );
                })}
                {finalIncidents.length === 0 && <p className="text-center text-gray-400 py-10">No incidents found.</p>}
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
                       <div className="flex gap-2">
                         <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateStudentStatus(s.id, 'deleted')}>Decline</Button>
                         <Button size="sm" className="bg-green-600 h-7 text-xs hover:bg-green-700" onClick={() => updateStudentStatus(s.id, 'approved')}>Approve</Button>
                       </div>
                     </div>
                   ))}
                 </CardContent>
               </Card>
             )}
             
             <Card className="border-none shadow-sm">
               <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-gray-600">Registered Students</CardTitle></CardHeader>
               <CardContent className="space-y-2">
                 {activeStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No students registered yet.</p>
                    </div>
                 ) : (
                   activeStudents.map(s => (
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
                           <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                             <div><span className="text-gray-400 block mb-1">College ID</span><span className="font-mono font-medium">{s.email}</span></div>
                             <div><span className="text-gray-400 block mb-1">Security Phone</span><span className="font-mono font-medium truncate block w-full">{s.phone || 'N/A'}</span></div>
                           </div>
                           
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="w-full mb-3 h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 bg-white"
                             onClick={() => {
                               setStudentFilter(s.email);
                               setLocationFilter('all');
                               setStatusFilter('all');
                               setActiveTab('feed');
                             }}
                           >
                             <Activity className="w-3 h-3 mr-2" /> View Full Report History
                           </Button>

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
                   ))
                 )}
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-600">Incident Heatmap</CardTitle>
                <CardDescription>Click a location to filter the live feed.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {locationStats.map(stat => (
                    <div 
                      key={stat.location} 
                      onClick={() => {
                        setLocationFilter(stat.location as CampusLocation);
                        setStatusFilter('all');
                        setStudentFilter(null);
                        setActiveTab('feed');
                      }}
                      className={`cursor-pointer hover:scale-105 hover:opacity-90 aspect-square p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300 ${getHeatmapColor(stat.severity)}`}
                    >
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
            <TabsContent value="authority" className="animate-in fade-in duration-300">
              <Card className="border-none shadow-sm max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" /> Authorize New Staff
                  </CardTitle>
                  <CardDescription>Create a direct access profile for college authorities.</CardDescription>
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
                      <Input type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Assign an initial password" />
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