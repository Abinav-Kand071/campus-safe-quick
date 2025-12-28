export type CampusLocation = 
  | 'Block A'
  | 'Block K'
  | 'Block T'
  | 'New Block'
  | 'Playground'
  | 'Parking'
  | 'Pharmacy Block'
  | 'Boys Hostel'
  | 'Girls Hostel';

export type IncidentType = 
  | 'riot'
  | 'fight'
  | 'safety_threat'
  | 'suspicious_activity'
  | 'other';

export type IncidentStatus = 
  | 'reported'
  | 'under_review'
  | 'action_taken'
  | 'resolved';

export type AdminRole = 
  | 'security_guard'
  | 'security_head'
  | 'principal';

export interface Incident {
  id: string;
  location: CampusLocation;
  type: IncidentType;
  description: string;
  videoUrl?: string;
  timestamp: string;
  reportedBy: string;
  status: IncidentStatus;
  priority: number;
  duplicateCount: number;
}

export interface Student {
  id: string;
  collegeId?: string;
  isGuest: boolean;
  name: string;
}

export interface Admin {
  id: string;
  name: string;
  role: AdminRole;
  email: string;
  phone: string;
}

export interface LocationStats {
  location: CampusLocation;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  'Block A',
  'Block K',
  'Block T',
  'New Block',
  'Playground',
  'Parking',
  'Pharmacy Block',
  'Boys Hostel',
  'Girls Hostel',
];

export const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'riot', label: 'Riot' },
  { value: 'fight', label: 'Fight' },
  { value: 'safety_threat', label: 'Safety Threat' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'other', label: 'Other' },
];

export const INCIDENT_STATUSES: { value: IncidentStatus; label: string }[] = [
  { value: 'reported', label: 'Reported' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'action_taken', label: 'Action Taken' },
  { value: 'resolved', label: 'Resolved' },
];

export const ADMIN_ROLES: { value: AdminRole; label: string }[] = [
  { value: 'security_guard', label: 'Security Guard' },
  { value: 'security_head', label: 'Security Head' },
  { value: 'principal', label: 'Principal' },
];
