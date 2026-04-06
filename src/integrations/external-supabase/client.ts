import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://pbzojbamztzdhlvxwhyw.supabase.co';
// This anon key needs to be set — replace with real key
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiem9qYmFtenR6ZGhsdnh3aHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzk4NzIsImV4cCI6MjA5MDk1NTg3Mn0.CrP4zpBjc4HdUDvSK_g6SYk5o6osx1AoGTsTtHFcSMI';

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);
