import { createClient } from '@supabase/supabase-js';

// Get environment variables with new Supabase project as fallback
const DEFAULT_SUPABASE_URL = 'https://pxavmpkgvonxckmbaksh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YXZtcGtndm9ueGNrbWJha3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODU0ODgsImV4cCI6MjEwNjA2MTQ4OH0.cPg6lBE7MuaLNOYHwFhBZcI8NpsDdnhwcr_nKIBbi8A';

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
