import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIncidents } from '@/hooks/useIncidents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, LogOut, MapPin, AlertTriangle, Send, 
  History, CheckCircle, Clock, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { CAMPUS_LOCATIONS, INCIDENT_TYPES, CampusLocation, IncidentType, Incident } from '@/types';

const StudentDashboard = () => {
  const navigate = useNavigate();
  // UPDATE: Use 'user' and 'logout' (matches new useAuth)
  const { user, logout } = useAuth();
  const { incidents, addIncident } = useIncidents();

  const [loading, setLoading] = useState(false);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    type: '' as IncidentType | '',
    location: '' as CampusLocation | '',
    description: '',
    isAnonymous: false
  });

  useEffect(() => {
    if (user && incidents.length > 0) {
      // Filter: Show incidents that match this user's email or ID
      // We check both just to be safe with the new DB structure
      const mine = incidents.filter(inc => inc.reportedBy === user.id || inc.reportedBy === user.email);
      
      // Sort: Newest first
      mine.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMyIncidents(mine);
    }
  }, [incidents, user]);

  const handleLogout = () => {
    logout(); // UPDATE: generic logout
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.location || !formData.description) {
      toast.error('Please fill in all details');
      return;
    }

    try {
      setLoading(true);
      await addIncident(
        formData.location as CampusLocation,
        formData.type as IncidentType,
        formData.description,
        user?.email || user?.id || 'unknown' // UPDATE: Use email/id from user
      );
      toast.success('Incident reported successfully!');
      setFormData({ type: '', location: '', description: '', isAnonymous: false });
    } catch (error) {
      toast.error('Failed to report incident');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- SAFETY NET FIX ---
  const getSafeStatus = (status: string | undefined | null) => {
    if (!status) return 'reported';
    return status;
  };

  const getStatusColor = (status: string) => {
    const safeStatus = getSafeStatus(status);
    switch (safeStatus) {
      case 'reported': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'under_review': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'action_taken': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'resolved': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    const safeStatus = getSafeStatus(status);
    switch (safeStatus) {
      case 'reported': return 'Pending Review';
      case 'under_review': return 'Investigation Started';
      case 'action_taken': return 'Action Taken';
      case 'resolved': return 'Resolved';
      default: return safeStatus;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Campus Safety</h1>
              <p className="text-xs text-muted-foreground">Student Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Hello, {user?.name?.split(' ')[0] || 'Student'} 👋</h2>
          <p className="text-muted-foreground">Help keep our campus safe.</p>
        </div>

        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="report">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Incident
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              My Reports
              {myIncidents.length > 0 && (
                <span className="ml-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">
                  {myIncidents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="animate-fade-in">
            <Card className="glass border-destructive/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  New Report
                </CardTitle>
                <CardDescription>
                  Emergency? Call 112 immediately. Use this form for campus incidents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select onValueChange={(val) => setFormData({...formData, location: val as CampusLocation})} value={formData.location}>
                      <SelectTrigger><SelectValue placeholder="Where did it happen?" /></SelectTrigger>
                      <SelectContent>
                        {CAMPUS_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Incident Type</Label>
                    <Select onValueChange={(val) => setFormData({...formData, type: val as IncidentType})} value={formData.type}>
                      <SelectTrigger><SelectValue placeholder="What kind of incident?" /></SelectTrigger>
                      <SelectContent>
                        {INCIDENT_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Please describe what you saw..."
                      className="resize-none h-32"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" id="anon"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="anon" className="cursor-pointer">Report Anonymously</Label>
                  </div>

                  <Button type="submit" className="w-full bg-destructive hover:bg-destructive/90 text-white" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Submit Report</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <div className="space-y-4">
              {myIncidents.length === 0 ? (
                <Card className="glass border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
                    <p>No reports found.</p>
                  </CardContent>
                </Card>
              ) : (
                myIncidents.map((incident) => (
                  <Card key={incident.id} className="glass overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`h-1 w-full ${incident.status === 'resolved' ? 'bg-green-500' : incident.status === 'reported' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3" />
                            {new Date(incident.timestamp).toLocaleDateString()}
                          </span>
                          <h4 className="font-semibold flex items-center gap-2">
                            {incident.location}
                          </h4>
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(incident.status)} border capitalize`}>
                          {getStatusLabel(incident.status)}
                        </Badge>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground mb-3">
                        "{incident.description}"
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{INCIDENT_TYPES.find(t => t.value === incident.type)?.label || incident.type}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;