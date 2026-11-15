import { createClient } from '@supabase/supabase-js';

// Get environment variables with new Supabase project as fallback
const DEFAULT_SUPABASE_URL = 'https://qkxnktzmqatgdxoawryr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFreG5rdHptcWF0Z2R4b2F3cnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3MTk3NjAsImV4cCI6MjExMDI5NTc2MH0.J-1WnJ7fKZ_BocO9YVr1dzxxzVvEkYluEGMfXKkq9_U';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Create client
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
