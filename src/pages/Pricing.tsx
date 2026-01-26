import React from 'react';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h1>
          <p className="text-slate-400">Your 90-minute preview has ended. Select a plan to continue.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div className="bg-[#0f172a] p-8 rounded-2xl border border-slate-800 text-center">
            <h2 className="text-xl text-slate-400 mb-2">Monthly</h2>
            <div className="text-4xl font-bold text-white mb-4">₹299</div>
            <p className="text-sm text-slate-500 mb-8">Full access for 30 days.</p>
            <button className="w-full border border-amber-500 text-amber-500 py-3 rounded-lg hover:bg-amber-500/10 transition-colors">
              Subscribe Monthly
            </button>
          </div>
          
          {/* Annual Plan */}
          <div className="bg-[#1e293b] p-8 rounded-2xl border border-amber-500 text-center relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase">Best Value</span>
            <h2 className="text-xl text-slate-300 mb-2">Annual</h2>
            <div className="text-4xl font-bold text-white mb-4">₹999</div>
            <p className="text-sm text-slate-400 mb-8">Save significantly with yearly planning.</p>
            <button className="w-full bg-amber-500 text-black py-3 rounded-lg font-bold hover:bg-amber-400 transition-colors">
              Subscribe Yearly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}