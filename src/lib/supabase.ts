import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Tournament {
  id: string;
  tournament_name: string;
  date: string;
  maps: number;
  idp_time: string;
  start_time: string;
  room_type: 'League Room' | 'Normal Room';
  status: 'scheduled' | 'completed' | 'qualified' | 'delayed' | 'canceled';
  result?: string;
  delayed_date?: string;
  tournament_type?: string;
  prize_pool?: string;
  created_at: string;
  updated_at: string;
}
