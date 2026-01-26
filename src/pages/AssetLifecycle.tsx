import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
// Ensure these imports match your updated lib/calculations.ts
import { calculateLifecycleProvision, formatCurrency } from '../lib/calculations';

export default function AssetLifecycle() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userCurrentAge, setUserCurrentAge] = useState(30);

  const [formData, setFormData] = useState({
    asset_name: '',
    replacement_cost: '',
    quantity: '1',
    useful_life: '',
    current_age: '0',
  });

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    setUserCurrentAge(profile.current_age || 30);
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('asset_lifecycle_items')
        .select('*')
        .order('created_at');
      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      asset_name: formData.asset_name,
      replacement_cost: parseFloat(formData.replacement_cost),
      quantity: parseInt(formData.quantity),
      useful_life: parseInt(formData.useful_life),
      current_age: parseInt(formData.current_age)
    };

    const { error } = await supabase.from('asset_lifecycle_items').insert([payload]);
    if (error) {
      alert("Save Failed: " + error.message);
    } else {
      setFormData({ asset_name: '', replacement_cost: '', quantity: '1', useful_life: '', current_age: '0' });
      setShowForm(false);
      loadAssets();
    }
  }

  async function deleteAsset(id: string) {
    await supabase.from('asset_lifecycle_items').delete().eq('id', id);
    loadAssets();
  }

  // Calculate math using the logic in calculations.ts
  const lifecycleData = calculateLifecycleProvision(assets, userCurrentAge);

  // --- THE FIXED BRIDGE ---
  useEffect(() => {
    async function sync() {
      // Don't sync if loading or if there's nothing to sync
      if (loading) return;
      
      setIsSyncing(true);
      try {
        const { data: row } = await supabase
          .from('expense_subcategories')
          .select('id')
          .ilike('name', 'Asset Amortization Provision')
          .maybeSingle();

        if (row) {
          // MATH FIX: Convert Annual to Monthly because Tracker is set to 'M'
          const monthlyAmount = Math.round((lifecycleData.annualProvision || 0) / 12);

          await supabase.from('expense_subcategories')
            .update({ amount: monthlyAmount })
            .eq('id', row.id);
        }
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        setIsSyncing(false);
      }
    }
    sync();
  }, [lifecycleData.annualProvision, loading]); // Added annualProvision as a dependency

  if (loading) return <div className="p-8 text-white font-mono">Loading...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Asset Lifecycle Manager</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 px-6 py-2 rounded-lg font-bold">
          {showForm ? 'Cancel' : 'Add Asset'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <div className="col-span-1">
              <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Asset Name</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={formData.asset_name} onChange={e => setFormData({...formData, asset_name: e.target.value})} required />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Current Price (₹)</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={formData.replacement_cost} onChange={e => setFormData({...formData, replacement_cost: e.target.value})} required />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Quantity</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Useful Life (Years)</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={formData.useful_life} onChange={e => setFormData({...formData, useful_life: e.target.value})} required />
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Current Age (Years)</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={formData.current_age} onChange={e => setFormData({...formData, current_age: e.target.value})} required />
            </div>
            <button type="submit" className="col-span-2 bg-blue-600 py-3 rounded-lg font-bold">Add Asset</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-8">
        {assets.map(asset => (
          <div key={asset.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-bold text-white">{asset.asset_name}</p>
              <p className="text-xs text-slate-500">Life: {asset.useful_life}y | Age: {asset.current_age}y</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-mono text-blue-400">{formatCurrency(asset.replacement_cost)}</p>
              <button onClick={() => deleteAsset(asset.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 p-8 rounded-2xl flex justify-between items-center shadow-xl">
        <div>
          <h3 className="text-blue-100 text-xs font-bold uppercase mb-2">Annual Amortization Provision</h3>
          <p className="text-4xl font-mono font-bold text-white">{formatCurrency(lifecycleData.annualProvision)}</p>
        </div>
        {isSyncing && <RefreshCw className="animate-spin text-white" size={32} />}
      </div>
    </div>
  );
}