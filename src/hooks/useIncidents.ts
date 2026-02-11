import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Incident, CampusLocation, IncidentType, IncidentStatus } from '@/types';
import { toast } from 'sonner';

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Incidents (Real-time ready)
  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (err: unknown) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // 2. Add Incident (The Database Fix)
  const addIncident = async (
    location: CampusLocation,
    type: IncidentType,
    description: string,
    reportedBy: string
  ) => {
    try {
      const newIncident = {
        location,
        type,
        description,
        reportedBy,
        status: 'reported' as IncidentStatus,
        timestamp: new Date().toISOString(),
        priority: 1,
        duplicateCount: 0
      };

      const { data, error } = await supabase
        .from('incidents')
        .insert([newIncident])
        .select();

      if (error) throw error;

      if (data) {
        setIncidents(prev => [data[0], ...prev]);
        return data[0];
      }
    } catch (err: unknown) {
      let msg = "Failed to submit report";
      if (err instanceof Error) msg = err.message;
      toast.error(msg);
      return null;
    }
  };

  // 3. Update Status (For Admin/HoD)
  const updateIncidentStatus = async (id: string, status: IncidentStatus) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
      toast.success(`Status updated to ${status}`);
    } catch (err: unknown) {
      toast.error("Failed to update status");
    }
  };

  // 4. Analytics: The Heatmap Logic
  const getLocationStats = () => {
    const stats = incidents.reduce((acc, inc) => {
      acc[inc.location] = (acc[inc.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([location, count]) => {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (count >= 10) severity = 'critical';
      else if (count >= 6) severity = 'high';
      else if (count >= 3) severity = 'medium';
      
      return { location: location as CampusLocation, count, severity };
    });
  };

  const filterIncidents = (location?: CampusLocation, status?: IncidentStatus) => {
    return incidents.filter(inc => {
      const locMatch = !location || inc.location === location;
      const statusMatch = !status || inc.status === status;
      return locMatch && statusMatch;
    });
  };

  return { 
    incidents, 
    loading, 
    addIncident, 
    updateIncidentStatus, 
    getLocationStats, 
    filterIncidents 
  };
};