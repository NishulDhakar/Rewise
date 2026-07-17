'use client';

import React, { useState } from 'react';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface UserProfile {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface AuthButtonProps {
  user: UserProfile | null;
}

export default function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error signing in:', err);
      alert('Failed to sign in with Google. Check console for details.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // The onAuthStateChange in DashboardClient will clear cookies and refresh
    } catch (err) {
      console.error('Error signing out:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark text-text-gray text-xs font-semibold">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Processing...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark text-xs">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User Avatar'}
              className="w-5 h-5 rounded-full border border-border-subtle object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-brand-cyan/20 border border-brand-cyan flex items-center justify-center text-[10px] font-bold text-brand-cyan">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}
          <span className="font-semibold text-text-white hidden md:inline truncate max-w-[120px]">
            {user.name || user.email}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-dark hover:border-red-500/50 hover:text-red-400 transition-all text-xs font-semibold cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-cyan bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-all text-xs glow-btn font-semibold cursor-pointer"
    >
      <LogIn className="w-3.5 h-3.5" />
      Sign in with Google
    </button>
  );
}
