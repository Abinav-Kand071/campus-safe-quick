import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIncidents } from '@/hooks/useIncidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, MapPin, AlertTriangle, FileText, Video, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { CAMPUS_LOCATIONS, INCIDENT_TYPES, CampusLocation, IncidentType } from '@/types';
import HeatMap from '@/components/HeatMap';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { student, logoutStudent } = useAuth();
  const { addIncident, getLocationStats, getRecentIncidents } = useIncidents();
  
  const [location, setLocation] = useState<CampusLocation | ''>('');
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleLogout = () => {
    logoutStudent();
    navigate('/');
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !incidentType || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    addIncident(
      location as CampusLocation,
      incidentType as IncidentType,
      description,
      student?.name || 'Anonymous',
      videoUrl || undefined
    );

    toast.success('Incident reported successfully!');
    setLocation('');
    setIncidentType('');
    setDescription('');
    setVideoUrl('');
  };

  const locationStats = getLocationStats();
  const recentIncidents = getRecentIncidents(5);

  if (!student) {
    navigate('/');
    return null;
  }

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
              <h1 className="font-semibold text-foreground">Campus Safety</h1>
              <p className="text-xs text-muted-foreground">
                {student.isGuest ? 'Guest User' : student.name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="report" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Report Incident
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Campus Heat Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Report Form */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Report an Incident
                  </CardTitle>
                  <CardDescription>
                    Help keep our campus safe by reporting any safety concerns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReport} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Select value={location} onValueChange={(val) => setLocation(val as CampusLocation)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPUS_LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Incident Type *</Label>
                      <Select value={incidentType} onValueChange={(val) => setIncidentType(val as IncidentType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select incident type" />
                        </SelectTrigger>
                        <SelectContent>
                          {INCIDENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what happened..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video" className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video Evidence (Optional)
                      </Label>
                      <Input
                        id="video"
                        placeholder="Paste video URL or link"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload video to a cloud service and paste the link here
                      </p>
                    </div>

                    <Button type="submit" className="w-full">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Submit Report
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recent Reports
                  </CardTitle>
                  <CardDescription>
                    Latest incidents reported on campus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentIncidents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No incidents reported yet</p>
                      <p className="text-sm">Be the first to report a safety concern</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentIncidents.map((incident) => (
                        <div
                          key={incident.id}
                          className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-3 h-3 text-primary" />
                                <span className="font-medium text-sm">{incident.location}</span>
                                {incident.duplicateCount > 1 && (
                                  <Badge variant="destructive" className="text-xs">
                                    ×{incident.duplicateCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {incident.description}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {INCIDENT_TYPES.find(t => t.value === incident.type)?.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(incident.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="heatmap" className="animate-fade-in">
            <HeatMap stats={locationStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
