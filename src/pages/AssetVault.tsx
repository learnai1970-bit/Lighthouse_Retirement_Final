import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Landmark, Home, Coins, ShieldCheck, Landmark as Bank, ScrollText, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AssetVaultItem, AssetVaultCategory } from '../lib/supabase';
import {
  calculateGoldValue,
  calculateFutureAssetValue,
  formatCurrency,
  INFLATION_MIN,
  INFLATION_MAX,
  PROJECTION_YEARS_DEFAULT,
} from '../lib/calculations';
import { useProjections } from '../contexts/ProjectionContext';

interface CategoryConfig {
  id: string;
  name: string;
  icon: typeof TrendingUp;
  color: string;
}

export default function AssetVault() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('equity');
  const [yearsToRetirement, setYearsToRetirement] = useState(PROJECTION_YEARS_DEFAULT);
  const { refresh: refreshProjections } = useProjections();

  const categories: CategoryConfig[] = [
    { id: 'equity', name: 'Equity/MF', icon: TrendingUp, color: 'blue' },
    { id: 'debt', name: 'Fixed Income (Debt)', icon: Bank, color: 'green' },
    { id: 'epf', name: 'EPF', icon: ShieldCheck, color: 'indigo' },
    { id: 'ppf', name: 'PPF', icon: PiggyBank, color: 'emerald' },
    { id: 'fd', name: 'Fixed Deposits', icon: Landmark, color: 'cyan' },
    { id: 'real_estate', name: 'Real Estate', icon: Home, color: 'purple' },
    { id: 'gold', name: 'Gold', icon: Coins, color: 'amber' },
    { id: 'postal', name: 'Postal Savings', icon: ScrollText, color: 'red' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    value: '',
    gold_grams: '',
    gold_rate_per_gram: '',
    property_value: '',
    annual_rental_yield_percent: '',
    expected_growth_rate: '7',
    usage_type: 'liquid' as 'liquid' | 'self_use',
  });

  useEffect(() => {
    loadUserProfile();
    loadAssets();
  }, []);

  function loadUserProfile() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        const years = profile.target_retirement_age - profile.current_age;
        setYearsToRetirement(years > 0 ? years : PROJECTION_YEARS_DEFAULT);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async function loadAssets() {
    setLoading(true);
    const { data, error } = await supabase.from('asset_vault_items').select('*').order('created_at');
    if (data) setAssets(data);
    setLoading(false);
    refreshProjections();
  }

  function resetForm() {
    setFormData({
      name: '', value: '', gold_grams: '', gold_rate_per_gram: '',
      property_value: '', annual_rental_yield_percent: '',
      expected_growth_rate: '7', usage_type: 'liquid',
    });
    setEditingAsset(null);
    setShowForm(false);
  }

  function handleEdit(asset: any) {
    setSelectedCategory(asset.category);
    setFormData({
      name: asset.name,
      value: asset.value.toString(),
      gold_grams: asset.gold_grams?.toString() || '',
      gold_rate_per_gram: asset.gold_rate_per_gram?.toString() || '',
      property_value: asset.property_value?.toString() || '',
      annual_rental_yield_percent: asset.annual_rental_yield_percent?.toString() || '',
      expected_growth_rate: asset.expected_growth_rate.toString(),
      usage_type: (asset.usage_type as 'liquid' | 'self_use') || 'liquid',
    });
    setEditingAsset(asset);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let calculatedValue = 0;
    if (selectedCategory === 'gold') {
      calculatedValue = calculateGoldValue(parseFloat(formData.gold_grams), parseFloat(formData.gold_rate_per_gram));
    } else if (selectedCategory === 'real_estate') {
      calculatedValue = parseFloat(formData.property_value);
    } else {
      calculatedValue = parseFloat(formData.value);
    }

    const assetData = {
      category: selectedCategory,
      name: formData.name,
      value: calculatedValue,
      gold_grams: selectedCategory === 'gold' ? parseFloat(formData.gold_grams) : null,
      gold_rate_per_gram: selectedCategory === 'gold' ? parseFloat(formData.gold_rate_per_gram) : null,
      property_value: selectedCategory === 'real_estate' ? parseFloat(formData.property_value) : null,
      annual_rental_yield_percent: parseFloat(formData.annual_rental_yield_percent) || 0,
      expected_growth_rate: parseFloat(formData.expected_growth_rate),
      usage_type: formData.usage_type,
    };

    const { error } = editingAsset 
      ? await supabase.from('asset_vault_items').update(assetData).eq('id', editingAsset.id)
      : await supabase.from('asset_vault_items').insert([assetData]);

    if (!error) { loadAssets(); resetForm(); }
  }

  async function handleDelete(id: string) {
    if (confirm('Delete asset?')) {
      await supabase.from('asset_vault_items').delete().eq('id', id);
      loadAssets();
    }
  }

  // --- MATH REPAIR BLOCK ---
  const totalCurrentValue = assets.reduce((sum, asset) => sum + (Number(asset.value) || 0), 0);
  
  const totalFutureValue = assets
    .filter(a => a.usage_type !== 'self_use') 
    .reduce((sum, a) => {
      const projected = calculateFutureAssetValue(
        Number(a.value) || 0, 
        Number(a.expected_growth_rate) || 0, 
        yearsToRetirement
      );
      return sum + projected;
    }, 0);

  const isIncomeAsset = ['equity', 'debt', 'real_estate', 'fd', 'bonds'].includes(selectedCategory);

  if (loading) return <div className="flex items-center justify-center h-screen bg-navy-950 text-white">Restoring Vault...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen text-slate-200">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">The Asset Vault</h1>
          <p className="text-slate-400">Wealth tracking & future projections</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all font-bold">
          <Plus size={20} /> {showForm ? 'Cancel' : 'Add Asset'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-slate-900 rounded-xl border border-slate-700 p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">{editingAsset ? 'Edit Asset' : 'New Asset'}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none">
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Asset Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Name" required />
              </div>
            </div>

            {selectedCategory === 'gold' ? (
              <div className="grid grid-cols-2 gap-6">
                <input type="number" value={formData.gold_grams} onChange={(e) => setFormData({ ...formData, gold_grams: e.target.value })}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Grams" />
                <input type="number" value={formData.gold_rate_per_gram} onChange={(e) => setFormData({ ...formData, gold_rate_per_gram: e.target.value })}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Rate/gm (₹)" />
              </div>
            ) : (
              <input type="number" value={selectedCategory === 'real_estate' ? formData.property_value : formData.value} 
                onChange={(e) => setFormData({ ...formData, [selectedCategory === 'real_estate' ? 'property_value' : 'value']: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Current Value (₹)" required />
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Expected Growth (%)</label>
                <input type="number" value={formData.expected_growth_rate} onChange={(e) => setFormData({ ...formData, expected_growth_rate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" step="0.1" required />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Annual Yield (%)</label>
                <input type="number" disabled={selectedCategory === 'real_estate'} value={formData.annual_rental_yield_percent} 
                  onChange={(e) => setFormData({ ...formData, annual_rental_yield_percent: e.target.value })}
                  className={`w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white ${!isIncomeAsset ? 'opacity-30' : ''}`} placeholder="0.0" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Usage Purpose</label>
              <select value={formData.usage_type} onChange={(e) => setFormData({ ...formData, usage_type: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white">
                <option value="liquid">Retirement Consumption</option>
                <option value="self_use">Legacy / Self-Use</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold">Save</button>
              <button type="button" onClick={resetForm} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {categories.map((cat) => {
          const catAssets = assets.filter(a => a.category === cat.id);
          const total = catAssets.reduce((s, a) => s + (Number(a.value) || 0), 0);
          return (
            <div key={cat.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 group">
              <div className="p-3 rounded-lg bg-slate-800 text-blue-400 w-fit mb-4"><cat.icon size={24}/></div>
              <h3 className="text-slate-400 text-sm font-medium">{cat.name}</h3>
              <div className="text-2xl font-bold text-white mt-1">{formatCurrency(total)}</div>
              <div className="mt-4 space-y-2">
                {catAssets.map(asset => (
                  <div key={asset.id} className="flex justify-between items-center text-[11px] bg-slate-800/40 p-2 rounded">
                    <span className="truncate w-24 text-slate-300">{asset.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(asset)} className="text-blue-500"><Edit2 size={10}/></button>
                      <button onClick={() => handleDelete(asset.id)} className="text-red-500"><Trash2 size={10}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 flex justify-between items-center shadow-xl border-l-4 border-l-blue-500">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Portfolio</p>
          <h2 className="text-4xl font-black text-white font-mono">{formatCurrency(totalCurrentValue)}</h2>
        </div>
        <div className="text-right">
          <p className="text-green-500 text-xs font-bold uppercase mb-1">Projected Corpus ({yearsToRetirement}y)</p>
          <h2 className="text-4xl font-black text-green-400 font-mono">{formatCurrency(totalFutureValue)}</h2>
        </div>
      </div>
    </div>
  );
}