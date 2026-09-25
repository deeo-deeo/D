import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wyqtpdqhztuqqwqijzzm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cXRwZHFoenR1cXF3cWlqenptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzk1NzgsImV4cCI6MjEwNDcxNTU3OH0.122oCbpQw0jGXLOofu0QqWNRciF2ZTJp0Q6-uFVepR4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
