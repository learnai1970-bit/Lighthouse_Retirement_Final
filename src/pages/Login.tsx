import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Attempt to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    // If user doesn't exist, create them automatically
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: pin,
      });
      if (signUpError) alert(signUpError.message);
    } else if (signInError) {
      alert(signInError.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b1120] text-white p-4">
      <div className="w-full max-w-md bg-[#172033] p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2 text-center">Financial Dignity Vault</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Enter your credentials to unlock your data.</p>
        
        <form onSubmit={handleAccess} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500 ml-1">Identity</label>
                <input 
                  type="email" 
                  placeholder="email@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full p-4 rounded-xl bg-[#0b1120] border border-slate-600 focus:border-blue-500 outline-none"
                  required 
                />
              </div>
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
              >
                Next Step
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500 ml-1">8-Digit Vault PIN</label>
                <input 
                  type="password" 
                  maxLength={8} 
                  placeholder="••••••••" 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} 
                  className="w-full text-center text-3xl tracking-[0.5em] p-4 rounded-xl bg-[#0b1120] border border-slate-600 focus:border-green-500 outline-none font-mono"
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || pin.length < 8} 
                className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Unlock Vault'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full text-sm text-slate-500 hover:text-white transition-colors"
              >
                Change Email
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
