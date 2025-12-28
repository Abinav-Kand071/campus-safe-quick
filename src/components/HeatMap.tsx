import { LocationStats, CAMPUS_LOCATIONS } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle, TrendingUp } from 'lucide-react';

interface HeatMapProps {
  stats: LocationStats[];
}

const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical', count: number) => {
  if (count === 0) return 'bg-muted border-border';
  switch (severity) {
    case 'low':
      return 'bg-success/20 border-success/50 text-success';
    case 'medium':
      return 'bg-warning/20 border-warning/50 text-warning';
    case 'high':
      return 'bg-danger/20 border-danger/50 text-danger';
    case 'critical':
      return 'bg-destructive/30 border-destructive text-destructive';
    default:
      return 'bg-muted border-border';
  }
};

const getSeverityBadge = (severity: 'low' | 'medium' | 'high' | 'critical') => {
  switch (severity) {
    case 'low':
      return 'bg-success text-success-foreground';
    case 'medium':
      return 'bg-warning text-warning-foreground';
    case 'high':
      return 'bg-danger text-danger-foreground';
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const HeatMap = ({ stats }: HeatMapProps) => {
  // Create a map for easy lookup
  const statsMap = new Map(stats.map(s => [s.location, s]));
  
  // Calculate max for bar chart
  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Grid View */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Campus Block Map
          </CardTitle>
          <CardDescription>
            Visual representation of incident density by location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {CAMPUS_LOCATIONS.map((location) => {
              const stat = statsMap.get(location);
              const count = stat?.count || 0;
              const severity = stat?.severity || 'low';
              
              return (
                <div
                  key={location}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer ${getSeverityColor(severity, count)}`}
                >
                  <div className="text-center">
                    <p className="font-semibold text-sm text-foreground mb-1">{location}</p>
                    <div className="flex items-center justify-center gap-1">
                      {count > 0 && <AlertTriangle className="w-3 h-3" />}
                      <span className={`text-lg font-bold ${count > 0 ? '' : 'text-muted-foreground'}`}>
                        {count}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {count === 1 ? 'report' : 'reports'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-3">Severity Legend</p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-success/20 border border-success/50">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs">Low</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-warning/20 border border-warning/50">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-danger/20 border border-danger/50">
                <div className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-destructive/30 border border-destructive">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-xs">Critical</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart View */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Incident Intensity Chart
          </CardTitle>
          <CardDescription>
            Comparative view of incidents across locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No data available yet</p>
              <p className="text-sm">Reports will appear here once submitted</p>
            </div>
          ) : (
            <div className="space-y-3">
              {CAMPUS_LOCATIONS.map((location) => {
                const stat = statsMap.get(location);
                const count = stat?.count || 0;
                const severity = stat?.severity || 'low';
                const percentage = (count / maxCount) * 100;

                return (
                  <div key={location} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{location}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${count > 0 ? getSeverityBadge(severity) : 'bg-muted text-muted-foreground'}`}>
                        {count}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          count === 0 ? 'bg-muted' :
                          severity === 'critical' ? 'bg-destructive' :
                          severity === 'high' ? 'bg-danger' :
                          severity === 'medium' ? 'bg-warning' :
                          'bg-success'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HeatMap;
