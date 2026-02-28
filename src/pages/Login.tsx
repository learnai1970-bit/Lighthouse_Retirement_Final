import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Try to Sign In first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    // 2. If Sign In fails because user doesn't exist, try to Sign Up
    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: pin,
        });

        if (signUpError) {
          setError(signUpError.message);
        }
      } else {
        setError(signInError.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Financial Dignity Vault</h1>
          <p className="text-slate-400 mt-2">Enter your email and 8-digit PIN to unlock</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">8-Digit PIN</label>
            <input
              type="password"
              required
              maxLength={8}
              minLength={8}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white text-center text-2xl tracking-[1em] placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
