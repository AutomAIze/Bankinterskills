import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://example-project.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key-not-configured';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
