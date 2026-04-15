'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase().auth.getUser();
        if (user) {
          console.log('User session found, redirecting to dashboard...');
          router.replace('/admin/dashboard');
        }
      } catch (e) {
        console.error('Session check failed:', e);
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions

    console.log('Login attempt started for:', email);
    setLoading(true);
    setError(null);

    try {
      const client = supabase();
      
      // Explicitly awaiting the sign in
      const { data, error: authError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.user) {
        // Refresh the router to ensure cookies are parsed by the server on next navigation
        router.refresh();
        // Using router.push instead of window.location for better SPA experience
        router.push('/admin/dashboard');
      } else {
        throw new Error('No user data returned from authentication');
      }
    } catch (err: any) {
      // Map common errors to friendly messages
      let message = 'Invalid email or password';
      if (err.message?.includes('Email not confirmed')) {
        message = 'Please confirm your email address';
      } else if (err.message?.includes('Network request failed')) {
        message = 'Connectivity issue. Please check your network.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      // Small delay to prevent UI flicking if auth is extremely fast
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg ring-4 ring-blue-50">
              <ShieldAlert className="text-white" size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2 font-heading">V Grand Admin</h1>
          <p className="text-slate-500 text-center mb-8 text-sm">Please sign in to access the dashboard</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 bg-slate-50 border-none ring-1 ring-slate-200"
                placeholder="admin@vgrand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 bg-slate-50 border-none ring-1 ring-slate-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-600 rounded-full" />
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 group ${
                loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-blue-400" size={20} />
                  <span className="text-slate-300">Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ShieldAlert className="group-hover:translate-x-1 transition-transform opacity-50" size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Secure Access Gateway &bull; V Grand Group
          </p>
        </div>
      </div>
    </div>
  );
}
