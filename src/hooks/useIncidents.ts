import { useState, useEffect, useCallback } from 'react';
import { Incident, CampusLocation, IncidentType, IncidentStatus, LocationStats } from '@/types';

const STORAGE_KEY = 'college_safety_incidents';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Calculate similarity between two descriptions
const calculateSimilarity = (desc1: string, desc2: string): number => {
  const words1 = desc1.toLowerCase().split(/\s+/);
  const words2 = desc2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
};

// Check if two timestamps are within 30 minutes of each other
const isWithinTimeWindow = (time1: string, time2: string, windowMinutes: number = 30): boolean => {
  const date1 = new Date(time1).getTime();
  const date2 = new Date(time2).getTime();
  return Math.abs(date1 - date2) <= windowMinutes * 60 * 1000;
};

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Load incidents from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setIncidents(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  // Save incidents to localStorage
  const saveIncidents = useCallback((newIncidents: Incident[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIncidents));
    setIncidents(newIncidents);
  }, []);

  // Check for duplicates and update priority
  const checkAndUpdateDuplicates = useCallback((newIncident: Incident, existingIncidents: Incident[]): Incident[] => {
    const updatedIncidents = [...existingIncidents];
    let duplicateFound = false;
    
    for (let i = 0; i < updatedIncidents.length; i++) {
      const existing = updatedIncidents[i];
      
      // Same location, similar time, and similar description
      if (
        existing.location === newIncident.location &&
        isWithinTimeWindow(existing.timestamp, newIncident.timestamp) &&
        calculateSimilarity(existing.description, newIncident.description) > 0.3
      ) {
        // Increment duplicate count and priority
        updatedIncidents[i] = {
          ...existing,
          duplicateCount: existing.duplicateCount + 1,
          priority: existing.priority + 1,
        };
        duplicateFound = true;
        
        // Also mark the new incident as a duplicate
        newIncident.duplicateCount = updatedIncidents[i].duplicateCount;
        newIncident.priority = updatedIncidents[i].priority;
      }
    }
    
    return updatedIncidents;
  }, []);

  // Add a new incident
  const addIncident = useCallback((
    location: CampusLocation,
    type: IncidentType,
    description: string,
    reportedBy: string,
    videoUrl?: string
  ): Incident => {
    const newIncident: Incident = {
      id: generateId(),
      location,
      type,
      description,
      videoUrl,
      timestamp: new Date().toISOString(),
      reportedBy,
      status: 'reported',
      priority: 1,
      duplicateCount: 1,
    };

    const updatedExisting = checkAndUpdateDuplicates(newIncident, incidents);
    const allIncidents = [...updatedExisting, newIncident];
    saveIncidents(allIncidents);
    
    return newIncident;
  }, [incidents, checkAndUpdateDuplicates, saveIncidents]);

  // Update incident status
  const updateIncidentStatus = useCallback((id: string, status: IncidentStatus) => {
    const updated = incidents.map(inc => 
      inc.id === id ? { ...inc, status } : inc
    );
    saveIncidents(updated);
  }, [incidents, saveIncidents]);

  // Get location statistics for heat map
  const getLocationStats = useCallback((): LocationStats[] => {
    const stats: Record<CampusLocation, number> = {} as Record<CampusLocation, number>;
    
    incidents.forEach(incident => {
      stats[incident.location] = (stats[incident.location] || 0) + incident.duplicateCount;
    });

    const maxCount = Math.max(...Object.values(stats), 1);
    
    return Object.entries(stats).map(([location, count]) => {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const ratio = count / maxCount;
      
      if (ratio > 0.75) severity = 'critical';
      else if (ratio > 0.5) severity = 'high';
      else if (ratio > 0.25) severity = 'medium';
      
      return {
        location: location as CampusLocation,
        count,
        severity,
      };
    }).sort((a, b) => b.count - a.count);
  }, [incidents]);

  // Get incidents sorted by priority (leaderboard)
  const getPriorityLeaderboard = useCallback((): Incident[] => {
    return [...incidents]
      .filter(inc => inc.status !== 'resolved')
      .sort((a, b) => b.priority - a.priority);
  }, [incidents]);

  // Get recent incidents
  const getRecentIncidents = useCallback((limit: number = 10): Incident[] => {
    return [...incidents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [incidents]);

  // Filter incidents
  const filterIncidents = useCallback((
    locationFilter?: CampusLocation,
    statusFilter?: IncidentStatus
  ): Incident[] => {
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
