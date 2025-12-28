import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIncidents } from '@/hooks/useIncidents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, LogOut, MapPin, AlertTriangle, Bell, TrendingUp, 
  Filter, Clock, CheckCircle, Eye, ChevronRight, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  CAMPUS_LOCATIONS, INCIDENT_STATUSES, CampusLocation, IncidentStatus,
  Incident, INCIDENT_TYPES, ADMIN_ROLES
} from '@/types';
import HeatMap from '@/components/HeatMap';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, logoutAdmin, canChangeStatus } = useAuth();
  const { 
    incidents, 
    updateIncidentStatus, 
    getLocationStats, 
    getPriorityLeaderboard,
    filterIncidents 
  } = useIncidents();
  
  const [locationFilter, setLocationFilter] = useState<CampusLocation | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [notifications, setNotifications] = useState<Incident[]>([]);

  // Track new incidents for notifications
  useEffect(() => {
    const highPriorityIncidents = incidents.filter(
      inc => inc.status === 'reported' && inc.priority > 1
    );
    setNotifications(highPriorityIncidents);
  }, [incidents]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const handleStatusChange = (incidentId: string, newStatus: IncidentStatus) => {
    if (!canChangeStatus()) {
      toast.error('You do not have permission to change incident status');
      return;
    }
    updateIncidentStatus(incidentId, newStatus);
    toast.success('Incident status updated');
  };

  const locationStats = getLocationStats();
  const priorityLeaderboard = getPriorityLeaderboard();
  const filteredIncidents = filterIncidents(
    locationFilter === 'all' ? undefined : locationFilter,
    statusFilter === 'all' ? undefined : statusFilter
  );

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'reported':
        return 'bg-destructive text-destructive-foreground';
      case 'under_review':
        return 'bg-warning text-warning-foreground';
      case 'action_taken':
        return 'bg-info text-info-foreground';
      case 'resolved':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!admin) {
    navigate('/admin/login');
    return null;
  }

  const roleLabel = ADMIN_ROLES.find(r => r.value === admin.role)?.label || admin.role;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {roleLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">{admin.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-destructive animate-pulse-glow" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {incidents.filter(i => i.status === 'reported').length}
                  </p>
                  <p className="text-xs text-muted-foreground">New Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {incidents.filter(i => i.status === 'under_review').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Under Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {incidents.filter(i => i.status === 'resolved').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{incidents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Incident Feed
            </TabsTrigger>
            <TabsTrigger value="priority" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Priority Index
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="animate-fade-in">
            {/* Filters */}
            <Card className="glass mb-4">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  <Select value={locationFilter} onValueChange={(val) => setLocationFilter(val as CampusLocation | 'all')}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {CAMPUS_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as IncidentStatus | 'all')}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {INCIDENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Incident List */}
            <div className="space-y-3">
              {filteredIncidents.length === 0 ? (
                <Card className="glass">
                  <CardContent className="p-8 text-center">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No incidents match your filters</p>
                  </CardContent>
                </Card>
              ) : (
                filteredIncidents
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((incident) => (
                    <Card key={incident.id} className={`glass transition-all hover:shadow-lg ${incident.priority > 2 ? 'border-destructive/50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="font-semibold">{incident.location}</span>
                              <Badge variant="secondary">
                                {INCIDENT_TYPES.find(t => t.value === incident.type)?.label}
                              </Badge>
                              {incident.duplicateCount > 1 && (
                                <Badge variant="destructive" className="animate-pulse-glow">
                                  ×{incident.duplicateCount} Duplicates
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {incident.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Reported by: {incident.reportedBy}</span>
                              <span>{new Date(incident.timestamp).toLocaleString()}</span>
                              {incident.videoUrl && (
                                <a 
                                  href={incident.videoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  View Video Evidence
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(incident.status)}>
                              {INCIDENT_STATUSES.find(s => s.value === incident.status)?.label}
                            </Badge>
                            
                            {canChangeStatus() ? (
                              <Select 
                                value={incident.status} 
                                onValueChange={(val) => handleStatusChange(incident.id, val as IncidentStatus)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INCIDENT_STATUSES.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                View only
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="priority" className="animate-fade-in">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Priority Leaderboard
                </CardTitle>
                <CardDescription>
                  Incidents ranked by urgency (duplicate reports increase priority)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {priorityLeaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active incidents</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {priorityLeaderboard.map((incident, index) => (
                      <div
                        key={incident.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                          index === 0 ? 'border-destructive bg-destructive/10' :
                          index < 3 ? 'border-warning/50 bg-warning/5' :
                          'border-border bg-card/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-destructive text-destructive-foreground' :
                          index < 3 ? 'bg-warning text-warning-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{incident.location}</span>
                            <Badge variant="secondary" className="text-xs">
                              {INCIDENT_TYPES.find(t => t.value === incident.type)?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {incident.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Priority:</span>
                            <Badge variant="destructive">{incident.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {incident.duplicateCount} report{incident.duplicateCount > 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <HeatMap stats={locationStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
