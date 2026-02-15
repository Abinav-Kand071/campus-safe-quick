import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Incident, CampusLocation, IncidentType, IncidentStatus, CAMPUS_LOCATIONS } from '@/types';
import { toast } from 'sonner';

// --- HELPER TYPE: Matches your Database Schema (snake_case) ---
type IncidentDBRow = {
  id: string;
  location: CampusLocation;
  type: IncidentType;
  description: string;
  video_url: string | null;
  timestamp: string;
  reported_by: string;
  status: IncidentStatus;
  priority: number;
  duplicate_count: number;
};

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH INCIDENTS ---
  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Safely cast data to our DB Row type
      const rows = (data || []) as IncidentDBRow[];

      const adaptedData: Incident[] = rows.map(row => ({
        id: row.id,
        location: row.location,
        type: row.type,
        description: row.description,
        videoUrl: row.video_url || undefined,
        timestamp: row.timestamp,
        reportedBy: row.reported_by,
        status: row.status,
        priority: row.priority,
        duplicateCount: row.duplicate_count
      }));

      setIncidents(adaptedData);
    } catch (err: unknown) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchIncidents();
    
    // --- REALTIME SUBSCRIPTION ---
    const channel = supabase
      .channel('realtime:incidents')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload) => {
          // STRICT TYPING: Cast payload.new to our helper type
          const newRow = payload.new as IncidentDBRow;
          
          const newIncident: Incident = {
             id: newRow.id,
             location: newRow.location,
             type: newRow.type,
             description: newRow.description,
             reportedBy: newRow.reported_by,
             status: newRow.status,
             timestamp: newRow.timestamp,
             priority: newRow.priority,
             duplicateCount: newRow.duplicate_count,
             videoUrl: newRow.video_url || undefined
          };
          
          toast.message("⚠️ New Incident Reported!", { description: `${newIncident.type} at ${newIncident.location}` });
          setIncidents(prev => [newIncident, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- 2. ADD INCIDENT ---
  const addIncident = async (
    location: CampusLocation, 
    type: IncidentType, 
    description: string, 
    reportedBy: string
  ): Promise<Incident | null> => {
    try {
      const dbPayload = {
        location, 
        type, 
        description, 
        reported_by: reportedBy,
        status: 'reported', 
        timestamp: new Date().toISOString(),
        priority: 1, 
        duplicate_count: 0
      };

      const { data, error } = await supabase.from('incidents').insert([dbPayload]).select().single();
      if (error) throw error;

      if (data) {
        const row = data as IncidentDBRow;
        const newIncident: Incident = {
          id: row.id,
          location: row.location,
          type: row.type,
          description: row.description,
          reportedBy: row.reported_by,
          status: row.status,
          timestamp: row.timestamp,
          priority: row.priority,
          duplicateCount: row.duplicate_count,
          videoUrl: row.video_url || undefined
        };
        return newIncident;
      }
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to report");
      return null;
    }
  };

  // --- 3. UPDATE STATUS ---
  const updateIncidentStatus = async (id: string, status: IncidentStatus) => {
    try {
      const { error } = await supabase.from('incidents').update({ status }).eq('id', id);
      if (error) throw error;
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // --- 4. RELATIVE HEATMAP LOGIC ---
  const getLocationStats = () => {
    const initialStats: Record<string, number> = {};
    CAMPUS_LOCATIONS.forEach(loc => initialStats[loc] = 0);

    incidents.forEach(inc => {
      // Use 'in' operator to avoid prototype issues
      if ((inc.location in initialStats) && inc.status !== 'resolved') { 
         initialStats[inc.location] = (initialStats[inc.location] || 0) + 1;
      }
    });

    const maxCount = Math.max(...Object.values(initialStats));

    return Object.entries(initialStats).map(([location, count]) => {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (count === 0) severity = 'low';
      else if (count === maxCount) severity = 'critical';
      else if (count >= maxCount * 0.5) severity = 'high';
      else if (count >= maxCount * 0.25) severity = 'medium';

      return { location: location as CampusLocation, count, severity };
    });
  };

  const filterIncidents = (location?: CampusLocation | 'all', status?: IncidentStatus | 'all') => {
    return incidents.filter(inc => {
      const locMatch = !location || location === 'all' || inc.location === location;
      const statusMatch = !status || status === 'all' || inc.status === status;
      return locMatch && statusMatch;
    });
  };

  return { incidents, loading, addIncident, updateIncidentStatus, getLocationStats, filterIncidents };
};