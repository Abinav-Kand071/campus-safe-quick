import { createClient } from '@supabase/supabase-js';

// PASTE YOUR REAL KEYS FROM THE DASHBOARD HERE
const supabaseUrl = 'https://bzurptwcfzurglqmbmgr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dXJwdHdjZnp1cmdscW1ibWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTE1NTcsImV4cCI6MjA4NTk2NzU1N30.8Oz35ZwTR_HdgxGZjj9-LzQQ-xllp3FVX-W_nAtHRpg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);