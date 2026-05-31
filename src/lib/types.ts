// =============================================
// EstateFlow CRM - Core TypeScript Types
// =============================================

export type Role = 'admin' | 'sales_manager' | 'sales_agent' | 'field_executive' | 'social_media_manager';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'on_hold';

export type LeadTemperature = 'hot' | 'warm' | 'cold';

export type LeadSource = 
  | 'website' | 'referral' | 'social_media' | 'cold_call' 
  | 'walk_in' | 'portal' | 'advertisement' | 'other';

export type PropertyType = 
  | 'apartment' | 'villa' | 'plot' | 'commercial' 
  | 'office' | 'warehouse' | 'farmhouse' | 'penthouse';

export type PropertyStatus = 'available' | 'sold' | 'reserved' | 'under_construction';

export type CallStatus = 
  | 'pending' | 'initiated' | 'ringing' | 'in_progress' 
  | 'completed' | 'failed' | 'no_answer' | 'busy';

export type MessageChannel = 'whatsapp' | 'sms' | 'email';

export type FollowUpStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled';

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'late';

export type SocialPostStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'rejected';

// =============================================
// Database Models
// =============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: Role;
  avatar_url?: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  property_type?: PropertyType;
  budget_min?: number;
  budget_max?: number;
  location_preference?: string;
  status: LeadStatus;
  temperature: LeadTemperature;
  assigned_to?: string;
  assigned_user?: User;
  notes?: string;
  follow_up_date?: string;
  last_contact_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  lead_id?: string;
  user_id: string;
  user?: User;
  type: 'call' | 'message' | 'email' | 'note' | 'status_change' | 'assignment' | 'follow_up' | 'visit';
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Call {
  id: string;
  organization_id: string;
  lead_id: string;
  lead?: Lead;
  agent_id: string;
  agent?: User;
  twilio_call_sid?: string;
  status: CallStatus;
  direction: 'inbound' | 'outbound';
  duration?: number;
  recording_url?: string;
  outcome?: 'interested' | 'not_interested' | 'callback' | 'no_answer' | 'wrong_number';
  notes?: string;
  initiated_at?: string;
  answered_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface Message {
  id: string;
  organization_id: string;
  lead_id: string;
  lead?: Lead;
  user_id: string;
  user?: User;
  channel: MessageChannel;
  direction: 'inbound' | 'outbound';
  content: string;
  template_id?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata: Record<string, unknown>;
  sent_at: string;
  created_at: string;
}

export interface FollowUp {
  id: string;
  organization_id: string;
  lead_id: string;
  lead?: Lead;
  assigned_to: string;
  assigned_user?: User;
  title: string;
  description?: string;
  channel: MessageChannel | 'call';
  status: FollowUpStatus;
  scheduled_at: string;
  completed_at?: string;
  snoozed_until?: string;
  template_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  location: string;
  type: PropertyType;
  price: number;
  size?: number;
  size_unit?: 'sqft' | 'sqm' | 'acres';
  bedrooms?: number;
  bathrooms?: number;
  status: PropertyStatus;
  amenities: string[];
  images: string[];
  documents: { name: string; url: string }[];
  share_link?: string;
  featured: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  organization_id: string;
  user_id: string;
  user?: User;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_location?: { lat: number; lng: number };
  check_out_location?: { lat: number; lng: number };
  selfie_url?: string;
  notes?: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  organization_id: string;
  created_by: string;
  created_by_user?: User;
  title: string;
  caption: string;
  media_urls: string[];
  platforms: ('instagram' | 'facebook' | 'twitter' | 'linkedin')[];
  status: SocialPostStatus;
  scheduled_at?: string;
  published_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  property_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_user?: User;
  lead_id?: string;
  property_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  due_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'call' | 'lead' | 'follow_up' | 'message' | 'system';
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

// =============================================
// API / Service Types
// =============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CallAutomationConfig {
  lead_id: string;
  dry_run?: boolean;
  retry_count?: number;
}

export interface PropertySharePayload {
  property_id: string;
  lead_id: string;
  channel: MessageChannel;
  custom_message?: string;
  dry_run?: boolean;
}

export interface DashboardKPIs {
  new_leads: number;
  total_calls: number;
  follow_ups_due: number;
  hot_leads: number;
  site_visits: number;
  total_properties: number;
  present_today: number;
  total_revenue_potential: number;
}

export interface LeadFilters {
  status?: LeadStatus;
  temperature?: LeadTemperature;
  source?: LeadSource;
  assigned_to?: string;
  property_type?: PropertyType;
  budget_min?: number;
  budget_max?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PropertyFilters {
  status?: PropertyStatus;
  type?: PropertyType;
  price_min?: number;
  price_max?: number;
  location?: string;
  bedrooms?: number;
  search?: string;
  page?: number;
  per_page?: number;
}
