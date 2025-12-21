import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  voter_id: string;
  full_name: string;
  role: 'admin' | 'voter';
  has_voted: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  description: string;
  vote_count: number;
}

export interface Vote {
  id: string;
  user_id: string;
  candidate_id: string;
  voted_at: string;
}
