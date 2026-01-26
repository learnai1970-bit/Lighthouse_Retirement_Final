import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, calculateFutureAssetValue, INFLATION_MIN, INFLATION_MAX } from '../lib/calculations';
import { TrendingUp, Info } from 'lucide-react';

interface ProjectionRow {
  year: number;
  age: number;
  monthly: number;
  annual: number;
  multiplier: string;
}

export default function FutureSpendJourney() {
  const [loading, setLoading] = useState(true);
  const [projections, setProjections] = useState<ProjectionRow[]>([]);
  const [baseMonthlySpend, setBaseMonthlySpend] = useState(0);
  const [inflationRate, setInflationRate] = useState(6); 
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);

  useEffect(() => {
    fetchJourneyData();
  }, [inflationRate]);

  async function fetchJourneyData() {
    setLoading(true);
    
    // 1. Get User Profile Context
    const savedProfile = localStorage.getItem('userProfile');
    let age = 30;
    let rAge = 60;
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      age = profile.current_age || 30;
      rAge = profile.target_retirement_age || 60;
      setCurrentAge(age);
      setRetirementAge(rAge);
    }

    try {
      // 2. Fetch Live Subcategory Data (This contains our synced Asset Provision)
      const { data: subcategories } = await supabase
        .from('expense_subcategories')
        .select('amount, frequency, category_id');
      
      const { data: categories } = await supabase
        .from('expense_categories')
        .select('id, name');

      const inflowCat = categories?.find(c => c.name === 'Monthly Inflows');

      // 3. Calculate True Monthly Baseline
      const totalMonthly = subcategories?.reduce((sum, sub) => {
        // Skip inflows to show only the SPENDING journey
        if (inflowCat && sub.category_id === inflowCat.id) return sum;

        // Correct Scale: If DB says 'annual', divide by 12. Else it's already monthly.
        const monthlyVal = sub.frequency === 'annual' ? (sub.amount / 12) : sub.amount;
        return sum + Number(monthlyVal);
      }, 0) || 0;

      setBaseMonthlySpend(totalMonthly);

      // 4. Generate 40-Year Projection
      const journey: ProjectionRow[] = [];
      for (let i = 0; i <= 40; i++) {
        const projectedMonthly = calculateFutureAssetValue(totalMonthly, inflationRate, i);
        
        // Safety: Prevent NaN if totalMonthly is 0
        const multiplierValue = totalMonthly > 0 
          ? (projectedMonthly / totalMonthly).toFixed(1) 
          : "1.0";

        journey.push({
          year: new Date().getFullYear() + i,
          age: age + i,
          monthly: projectedMonthly,
          annual: projectedMonthly * 12,
          multiplier: multiplierValue
        });
      }

      setProjections(journey);
    } catch (error) {
      console.error("Error generating journey:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-white font-mono">Calculating your lifestyle journey...</div>;

  const retirementRow = projections.find(p => p.age === retirementAge);

  return (
    <div className="p-8 bg-navy-950 min-h-screen text-slate-200">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Future Spend Journey</h1>
          <p className="text-slate-400">Projecting your lifestyle baseline across time</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Current Monthly Burn</p>
          <p className="text-2xl font-mono font-bold text-white">{formatCurrency(baseMonthlySpend)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              Inflation Assumption
            </h3>
            <span className="text-3xl font-black text-blue-400">{inflationRate}%</span>
          </div>
          <input 
            type="range" 
            min={INFLATION_MIN} 
            max={INFLATION_MAX} 
            value={inflationRate} 
            onChange={(e) => setInflationRate(Number(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4"
          />
          <p className="text-sm text-slate-500 italic">
            "I am giving discretion to choose the inflation rate." — Adjust this to see how your future costs scale.
          </p>
        </div>

        <div className="bg-blue-600 p-8 rounded-2xl shadow-xl flex flex-col justify-center">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Target Retirement Spend (Age {retirementAge})</p>
          <h2 className="text-3xl font-black text-white font-mono">
            {retirementRow ? formatCurrency(retirementRow.annual) : '---'}
          </h2>
          <p className="text-blue-200 text-sm mt-2 font-medium">Annual income needed to maintain today's lifestyle.</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Year (Age)</th>
                <th className="px-8 py-5 text-right">Monthly Spend</th>
                <th className="px-8 py-5 text-right">Annual Cost</th>
                <th className="px-8 py-5 text-center">Cost Multiplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projections.map((row) => {
                const isRetirement = row.age === retirementAge;
                return (
                  <tr 
                    key={row.year} 
                    className={`transition-colors hover:bg-white/5 ${isRetirement ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''}`}
                  >
                    <td className="px-8 py-4">
                      <div className={`font-bold ${isRetirement ? 'text-blue-400' : 'text-white'}`}>
                        {row.year} {isRetirement && '🎯'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Age {row.age}</div>
                    </td>
                    <td className="px-8 py-4 text-right font-mono text-slate-300">
                      {formatCurrency(row.monthly)}
                    </td>
                    <td className="px-8 py-4 text-right font-mono text-white font-bold">
                      {formatCurrency(row.annual)}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        isRetirement ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {row.multiplier}x Today
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
        <Info className="text-blue-400 shrink-0" size={20} />
        <p className="text-xs text-slate-500 leading-relaxed">
          This journey calculates the <strong>Purchasing Power</strong> needed to sustain your current lifestyle. 
          Inflation erodes value, requiring more capital for the same goods. [cite: 2026-01-11]
        </p>
      </div>
    </div>
  );
}