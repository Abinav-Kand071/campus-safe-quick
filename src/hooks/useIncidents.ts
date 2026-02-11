import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Incident, CampusLocation, IncidentType, IncidentStatus, LocationStats } from '@/types';
import { toast } from 'sonner';

// 1. Define what the Database sends us (Snake Case)
interface DBIncident {
  id: string;
  created_at: string;
  description: string;
  location: string;
  status: string;
  priority: string; // text in DB
  reported_by: string;
  image_url: string | null;
  video_url: string | null;
  type: string;
}

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH & CONVERT ---
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert DB Row -> App Incident
      const formattedData: Incident[] = (data as DBIncident[] || []).map((row) => ({
        id: row.id,
        location: row.location as CampusLocation,
        type: (row.type || 'other') as IncidentType,
        description: row.description || '',
        videoUrl: row.video_url || undefined,
        timestamp: row.created_at,
        reportedBy: row.reported_by || 'Anonymous',
        status: (row.status || 'reported') as IncidentStatus,
        // Convert Text Priority (DB) to Number (App)
        priority: row.priority === 'critical' ? 4 : row.priority === 'high' ? 3 : row.priority === 'medium' ? 2 : 1,
        duplicateCount: 1, 
      }));

      setIncidents(formattedData);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load & Subscribe
  useEffect(() => {
    fetchIncidents();
    const subscription = supabase
      .channel('public:incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchIncidents();
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [fetchIncidents]);

  // --- 2. ADD INCIDENT ---
  const addIncident = useCallback(async (
    location: CampusLocation,
    type: IncidentType,
    description: string,
    reportedBy: string,
    videoUrl?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert([{
          location,
          type,
          description,
          reported_by: reportedBy, // Map to DB column
          video_url: videoUrl,    // Map to DB column
          status: 'reported',
          priority: 'medium'
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Incident Reported');
      return data;
    } catch (error) {
      // Use type assertion for error message
      const message = (error as Error).message || 'Failed to report';
      toast.error(message);
      return null;
    }
  }, []);

  // --- 3. UPDATE STATUS ---
  const updateIncidentStatus = useCallback(async (id: string, status: IncidentStatus) => {
    try {
      setIncidents(prev => prev.map(inc => 
        inc.id === id ? { ...inc, status } : inc
      ));

      const { error } = await supabase
        .from('incidents')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Status updated`);
    } catch (error) {
      toast.error('Failed to update status');
      fetchIncidents();
    }
  }, [fetchIncidents]);

  // --- 4. STATS ---
  const getLocationStats = useCallback((): LocationStats[] => {
    const stats: Record<string, number> = {};
    incidents.forEach(incident => {
      const loc = incident.location;
      stats[loc] = (stats[loc] || 0) + 1;
    });

    return Object.entries(stats).map(([location, count]) => {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (count > 5) severity = 'high';
      if (count > 10) severity = 'critical';

      return {
        location: location as CampusLocation,
        count,
        severity,
      };
    }).sort((a, b) => b.count - a.count);
  }, [incidents]);

  // Helper getters
  const getPriorityLeaderboard = useCallback(() => incidents, [incidents]);
  const getRecentIncidents = useCallback((limit = 10) => incidents.slice(0, limit), [incidents]);
  
  // Updated Filter Function to use proper types
  const filterIncidents = useCallback((
    locationFilter?: CampusLocation,
    statusFilter?: IncidentStatus
  ) => {
    return incidents.filter(inc => {
      if (locationFilter && inc.location !== locationFilter) return false;
      if (statusFilter && inc.status !== statusFilter) return false;
      return true;
    });
  }, [incidents]);

  return {
    incidents,
    loading,
    addIncident,
    updateIncidentStatus,
    getLocationStats,
    getPriorityLeaderboard,
    getRecentIncidents,
    filterIncidents,
  };
};