import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_APP_URL || '';
const supabaseAnonKey = process.env.NEXT_APP_SUPABASE_ANON || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Please verify NEXT_APP_URL and NEXT_APP_SUPABASE_ANON are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
