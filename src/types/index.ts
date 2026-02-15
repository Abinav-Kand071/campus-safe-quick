// src/types/index.ts

// --- 1. CAMPUS LOCATIONS (Single Source of Truth) ---
// We define the array FIRST as a constant.
export const CAMPUS_LOCATIONS = [
  'Block A',
  'Block R9',
  'Btech EM Main Block',
  'New Block',
  'Playground',
  'Pharmacy Block',
  'Parking',
  'Boys Hostel',
  'RC Main Block',
  'Girls Hostel',
  'RC Diploma Block',
  'RC Civil Block',
  'Canteen',
  'Block T',
  'Gate C',
  'Gate B',
  'Gate A'
] as const;

// Then we create the Type automatically from that array.
// This prevents typos between your dropdowns and your types.
export type CampusLocation = typeof CAMPUS_LOCATIONS[number];

// --- 2. INCIDENT TYPES ---
export type IncidentType = 
  | 'fire'
  | 'fight'
  | 'medical'
  | 'harassment'
  | 'theft'
  | 'suspicious_activity'
  | 'vandalism'
  | 'other';

export const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'fire', label: 'Fire Hazard' },
  { value: 'fight', label: 'Physical Altercation' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'harassment', label: 'Harassment/Bullying' },
  { value: 'theft', label: 'Theft' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'other', label: 'Other' },
];

// --- 3. STATUSES ---
export type IncidentStatus = 
  | 'reported'      // Initial state
  | 'investigating' // Security is on the way
  | 'action_taken'  // Steps taken to mitigate
  | 'resolved';     // Case closed

export const INCIDENT_STATUSES: { value: IncidentStatus; label: string }[] = [
  { value: 'reported', label: 'Reported' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'action_taken', label: 'Action Taken' },
  { value: 'resolved', label: 'Resolved' },
];

// --- 4. ROLES (Matches Database) ---
export type UserRole = 
  | 'student'
  | 'admin'
  | 'security_head'
  | 'principal'
  | 'hod'
  | 'class_in_charge';

// --- 5. INTERFACES ---

// The main User interface used across the app
export interface User {
  id: string;
  name: string;
  email: string; // Acts as College ID
  role: UserRole;
  status: string; // 'pending' | 'approved' | 'banned'
  phone?: string; // Biometric ID
  is_banned?: boolean;
}

// The Incident interface for Frontend (camelCase)
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

// Stats interface for the Heatmap
export interface LocationStats {
  location: CampusLocation;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}