import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_APP_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_APP_SUPABASE_ANON || 'placeholder-key';

export async function getServerSupabase() {
  const cookieStore = await cookies();
  const token = cookieStore.get('rewise_session_token')?.value;

  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  // Fallback client (anonymous or unauthenticated server requests)
  return createClient(supabaseUrl, supabaseAnonKey);
}
