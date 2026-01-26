import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/calculations';

export default function WealthBaseline() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    epf_ppf: '0',
    mutual_funds_stocks: '0',
    gold: '0',
    cash: '0',
    pre_retiral_roi: '10.0',
    post_retiral_roi: '7.0',
  });
  const [baselineId, setBaselineId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBaseline() {
      const { data, error } = await supabase.from('wealth_baseline').select('*').single();
      if (data) {
        setBaselineId(data.id);
        setFormData({
          epf_ppf: data.epf_ppf.toString(),
          mutual_funds_stocks: data.mutual_funds_stocks.toString(),
          gold: data.gold.toString(),
          cash: data.cash.toString(),
          pre_retiral_roi: data.pre_retiral_roi.toString(),
          post_retiral_roi: data.post_retiral_roi.toString(),
        });
      }
      setLoading(false);
    }
    loadBaseline();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      epf_ppf: parseFloat(formData.epf_ppf),
      mutual_funds_stocks: parseFloat(formData.mutual_funds_stocks),
      gold: parseFloat(formData.gold),
      cash: parseFloat(formData.cash),
      pre_retiral_roi: parseFloat(formData.pre_retiral_roi),
      post_retiral_roi: parseFloat(formData.post_retiral_roi),
      updated_at: new Date().toISOString(),
    };

    if (baselineId) {
      await supabase.from('wealth_baseline').update(data).eq('id', baselineId);
    } else {
      await supabase.from('wealth_baseline').insert(data);
    }
    alert("Savings & ROI Updated!");
  }

  // Calculate totals for UI
  const totalCorpus = parseFloat(formData.epf_ppf || '0') + 
                      parseFloat(formData.mutual_funds_stocks || '0') + 
                      parseFloat(formData.gold || '0') + 
                      parseFloat(formData.cash || '0');

  if (loading) return <div className="p-8 text-white bg-navy-950 min-h-screen">Loading Savings Vault...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wealth Baseline</h1>
        <p className="text-slate-400">The Input Vault - Your Current Financial Foundation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Assets</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Asset Inputs (EPF, Stocks, Gold, Cash) as per your original UI */}
            <div>
              <label className="text-slate-400 text-sm mb-2 block">EPF / PPF (₹)</label>
              <input type="number" value={formData.epf_ppf} onChange={(e) => setFormData({...formData, epf_ppf: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white font-mono"/>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Mutual Funds / Stocks (₹)</label>
              <input type="number" value={formData.mutual_funds_stocks} onChange={(e) => setFormData({...formData, mutual_funds_stocks: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white font-mono"/>
            </div>
            {/* ... other inputs ... */}
            <div className="pt-4 border-t border-slate-700">
              <span className="text-white font-semibold">Total Corpus: </span>
              <span className="text-2xl font-bold text-green-400 font-mono">{formatCurrency(totalCorpus)}</span>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">Save Baseline</button>
          </form>
        </div>
      </div>
    </div>
  );
}