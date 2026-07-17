'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // Allow the client-side Supabase SDK to parse the code/session from the URL
      const { data: { session } } = await supabase.auth.getSession();
      
      // Redirect back to home
      router.replace('/');
    };
    checkSession();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark text-text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide text-text-gray animate-pulse">
          Completing sign-in...
        </p>
      </div>
    </div>
  );
}
