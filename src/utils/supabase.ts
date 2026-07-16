import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_APP_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_APP_SUPABASE_ANON || 'placeholder-key';

if (!process.env.NEXT_APP_URL || !process.env.NEXT_APP_SUPABASE_ANON) {
  console.warn(
    'Supabase environment variables (NEXT_APP_URL / NEXT_APP_SUPABASE_ANON) are missing. Using build-time placeholders.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
