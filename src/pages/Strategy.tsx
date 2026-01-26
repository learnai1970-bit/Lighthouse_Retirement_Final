import { useEffect, useState } from 'react';
import { ArrowUpDown, IndianRupee, Coins, TrendingUp, Calendar, AlertCircle, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AssetVaultItem } from '../lib/supabase';
import { formatCurrency, formatPercentage, calculateAnnualYieldIncome, calculateRealEstateRentalIncome, calculateFutureAssetValue } from '../lib/calculations';

interface AssetWithStrategy extends AssetVaultItem {
  priority: number;
  strategyId: string | null;
}

interface YearProjection {
  year: number;
  expenses: number;
  yield: number;
  corpusRemaining: number;
}

export default function Strategy() {
  const [assets, setAssets] = useState<AssetWithStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // States for Waterfall Math
  const [annualExpenses, setAnnualExpenses] = useState(0);
  const [runwayYears, setRunwayYears] = useState<number | null>(null);
  const [inflationRate, setInflationRate] = useState(6);
  const [projections, setProjections] = useState<YearProjection[]>([]);

  useEffect(() => {
    loadStrategy();
  }, []);

  async function loadStrategy() {
    setLoading(true);
    const { data: vaultItems } = await supabase.from('asset_vault_items').select('*').order('created_at');
    const { data: strategies } = await supabase.from('withdrawal_strategy').select('*');

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setInflationRate(profile.expected_inflation || 6);
    }

    const { data: subcategories } = await supabase.from('expense_subcategories').select('amount, frequency');
    const totalMonthly = subcategories?.reduce((sum, sub) => {
      const val = sub.frequency === 'annual' ? (sub.amount / 12) : sub.amount;
      return sum + Number(val);
    }, 0) || 0;
    const totalAnnualBase = totalMonthly * 12;
    setAnnualExpenses(totalAnnualBase);

    if (vaultItems) {
      const liquidItems = vaultItems.filter(item => item.usage_type !== 'self_use');
      const assetsWithPriority: AssetWithStrategy[] = liquidItems.map((item, index) => {
        const strategy = strategies?.find((s) => s.asset_id === item.id);
        return { ...item, priority: strategy?.priority ?? index + 1, strategyId: strategy?.id ?? null };
      });

      assetsWithPriority.sort((a, b) => a.priority - b.priority);
      setAssets(assetsWithPriority);
      calculateRunway(assetsWithPriority, totalAnnualBase);
    }
    setLoading(false);
  }

  function calculateRunway(currentAssets: AssetWithStrategy[], annualBurn: number) {
    let tempCorpus = currentAssets.reduce((sum, a) => sum + a.value, 0);
    let years = 0;
    let currentBurn = annualBurn;
    const yearData: YearProjection[] = [];

    if (tempCorpus === 0 || annualBurn === 0) {
      setRunwayYears(0);
      setProjections([]);
      return;
    }

    while (tempCorpus > 0 && years < 30) {
      const annualYield = currentAssets.reduce((sum, asset) => {
        const yieldVal = asset.category === 'real_estate' 
          ? calculateRealEstateRentalIncome(asset.value, asset.annual_rental_yield_percent || 0)
          : calculateAnnualYieldIncome(asset.value, asset.annual_rental_yield_percent || 0, asset.usage_type);
        return sum + yieldVal;
      }, 0);

      yearData.push({ year: years + 1, expenses: currentBurn, yield: annualYield, corpusRemaining: tempCorpus });

      const netDeficit = Math.max(0, currentBurn - annualYield);
      tempCorpus -= netDeficit;
      currentBurn = calculateFutureAssetValue(currentBurn, inflationRate, 1);
      if (tempCorpus > 0) years++;
    }
    setRunwayYears(years);
    setProjections(yearData);
  }

  // --- START OF ORIGINAL DRAG/DROP FUNCTIONS ---
  async function updatePriorities(newAssets: AssetWithStrategy[]) {
    for (let i = 0; i < newAssets.length; i++) {
      const asset = newAssets[i];
      const newPriority = i + 1;
      if (asset.strategyId) {
        await supabase.from('withdrawal_strategy').update({ priority: newPriority }).eq('id', asset.strategyId);
      } else {
        const { data } = await supabase.from('withdrawal_strategy').insert({ asset_id: asset.id, priority: newPriority }).select().single();
        if (data) asset.strategyId = data.id;
      }
      asset.priority = newPriority;
    }
    setAssets([...newAssets]);
    calculateRunway(newAssets, annualExpenses);
  }

  function handleDragStart(index: number) { setDraggedIndex(index); }
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newAssets = [...assets];
    const draggedAsset = newAssets[draggedIndex];
    newAssets.splice(draggedIndex, 1);
    newAssets.splice(index, 0, draggedAsset);
    setDraggedIndex(index);
    setAssets(newAssets);
  }
  function handleDragEnd() {
    if (draggedIndex !== null) updatePriorities(assets);
    setDraggedIndex(null);
  }
  // --- END OF ORIGINAL LOGIC ---

  if (loading) return <div className="p-8 bg-slate-950 min-h-screen text-white">Loading Strategy...</div>;

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Waterfall</h1>
          <p className="text-slate-400">Drag to prioritize. Principal is tapped only when yields fall short.</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-right">
          <p className="text-xs text-slate-500 uppercase font-bold">Annual Burn</p>
          <p className="text-2xl font-mono text-white">{formatCurrency(annualExpenses)}</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="text-6xl font-black mb-2">{runwayYears ?? '0'} Years</div>
        <p className="text-blue-100 uppercase text-xs font-bold tracking-widest">Financial Runway Survival</p>
      </div>

      {/* Asset Priority List */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden mb-12">
        <div className="divide-y divide-slate-700">
          {assets.map((asset, index) => (
            <div key={asset.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd}
              className={`grid grid-cols-5 gap-4 px-6 py-4 cursor-move hover:bg-slate-800 transition-colors items-center ${draggedIndex === index ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-blue-400 font-bold">#{asset.priority}</span>
                <span className="text-white font-medium">{asset.name}</span>
              </div>
              <div className="text-right font-mono text-slate-400">{formatCurrency(asset.value)}</div>
              <div className="text-right font-mono text-blue-400">{formatPercentage(asset.annual_rental_yield_percent || 0)}</div>
              <div className="text-right font-mono text-green-400">
                {formatCurrency(asset.category === 'real_estate' 
                  ? calculateRealEstateRentalIncome(asset.value, asset.annual_rental_yield_percent || 0)
                  : calculateAnnualYieldIncome(asset.value, asset.annual_rental_yield_percent || 0, asset.usage_type))}
              </div>
              <div className="text-right text-xs text-slate-500 uppercase">{asset.category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Yearly Breakdown Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
          <List size={18} className="text-blue-400" />
          <h2 className="text-white font-bold uppercase text-xs tracking-wider">Year-by-Year Simulation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-slate-700">
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4 text-right">Projected Expenses</th>
                <th className="px-6 py-4 text-right">Total Yield</th>
                <th className="px-6 py-4 text-right">Net Impact</th>
                <th className="px-6 py-4 text-right">Remaining Corpus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projections.slice(0, 15).map((row) => (
                <tr key={row.year} className="hover:bg-slate-800/30">
                  <td className="px-6 py-3 font-mono text-slate-400 text-sm">Year {row.year}</td>
                  <td className="px-6 py-3 text-right font-mono text-red-400/80 text-sm">{formatCurrency(row.expenses)}</td>
                  <td className="px-6 py-3 text-right font-mono text-green-400/80 text-sm">{formatCurrency(row.yield)}</td>
                  <td className="px-6 py-3 text-right font-mono text-amber-400 text-sm">
                    {formatCurrency(row.yield - row.expenses)}
                  </td>
                  <td className={`px-6 py-3 text-right font-mono font-bold text-sm ${row.corpusRemaining > 0 ? 'text-white' : 'text-red-600'}`}>
                    {formatCurrency(Math.max(0, row.corpusRemaining))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}