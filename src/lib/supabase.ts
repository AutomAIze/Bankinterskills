import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://lcnyvckoyxkelwynczhq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjbnl2Y2tveXhrZWx3eW5jemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDI3MjEsImV4cCI6MjA4NzA3ODcyMX0.NBXHUGyqSeKxMbyM03E6mXPJHyFUA2Z7LKIvnrc1OGk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
