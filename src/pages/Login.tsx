import React from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          // Hardcoding the local address ensures Google knows exactly where to return
          redirectTo: 'http://localhost:5173',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Error connecting to Google. Please check your console.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] p-10 rounded-2xl border border-slate-800 text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2">Financial Dignity</h1>
        <p className="text-slate-400 mb-8 text-sm">
          Plan your future with precision. 
          Sign in to start your 90-minute free preview.
        </p>
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black py-3 rounded-lg font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-4 h-4" 
          />
          Sign in with Google
        </button>
        
        <p className="mt-6 text-xs text-slate-500">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}