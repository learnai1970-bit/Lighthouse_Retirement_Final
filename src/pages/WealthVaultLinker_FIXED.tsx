import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Link as LinkIcon,
  TrendingUp,
  X,
  PiggyBank,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type {
  WealthVaultAsset,
  AssetMilestoneLink,
  Milestone,
  WealthVaultCategory,
  WealthVaultSubcategory,
} from '../lib/supabase';
import { formatCurrency } from '../lib/calculations';

interface AssetWithLinks extends WealthVaultAsset {
  links: Array<AssetMilestoneLink & { milestone: Milestone }>;
}

const ASSET_CATEGORIES = [
  {
    id: 'retirement_base' as WealthVaultCategory,
    name: 'Retirement Base',
    icon: PiggyBank,
    color: '#3b82f6',
    subcategories: ['EPF', 'PPF'] as WealthVaultSubcategory[],
  },
  {
    id: 'market_assets' as WealthVaultCategory,
    name: 'Market Assets',
    icon: TrendingUp,
    color: '#10b981',
    subcategories: ['Equity', 'MutualFunds'] as WealthVaultSubcategory[],
  },
  {
    id: 'debt_fixed' as WealthVaultCategory,
    name: 'Debt/Fixed Income',
    icon: ShieldCheck,
    color: '#8b5cf6',
    subcategories: ['Bonds', 'BankFD', 'NBFC', 'PostalSavings'] as WealthVaultSubcategory[],
  },
  {
    id: 'physical' as WealthVaultCategory,
    name: 'Physical Assets',
    icon: Coins,
    color: '#f59e0b',
    subcategories: ['Gold'] as WealthVaultSubcategory[],
  },
];

export default function WealthVaultLinker() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [assets, setAssets] = useState<AssetWithLinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithLinks | null>(null);
  
  const [currentAge, setCurrentAge] = useState(30);
  const [child1Age, setChild1Age] = useState<number | null>(null);
  const [child2Age, setChild2Age] = useState<number | null>(null);
  
  const [globalAccumulationROI, setGlobalAccumulationROI] = useState(10.0);
  const [globalDistributionROI, setGlobalDistributionROI] = useState(7.0);

  const [formData, setFormData] = useState({
    category: 'retirement_base' as WealthVaultCategory,
    subcategory: 'EPF' as WealthVaultSubcategory,
    name: '',
    current_value: '',
    annual_yield_percent: '0',
    usage_type: 'liquid' as 'liquid' | 'self_use',
  });

  const [linkFormData, setLinkFormData] = useState({
    milestone_id: '',
    allocation_percentage: '100',
  });

  useEffect(() => {
    loadUserProfile();
    loadAllData();
  }, []);

  function loadUserProfile() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setCurrentAge(profile.current_age || 30);
        setChild1Age(profile.child_1_age ?? null);
        setChild2Age(profile.child_2_age ?? null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async function loadAllData() {
    setLoading(true);
    try {
      const { data: mData } = await supabase.from('milestones').select('*').order('target_age');
      if (mData) setMilestones(mData);
      await loadAssets();
    } catch (err) {
      console.error("Critical Load Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssets() {
    try {
      // FIX: Changed table name to wealth_assets
      const { data: assetsData, error: assetError } = await supabase
        .from('wealth_assets')
        .select('*')
        .order('category', { ascending: true });

      if (assetError) throw assetError;
      if (!assetsData) return;

      const { data: linksData } = await supabase
        .from('asset_milestone_links')
        .select('*, milestones(*)');

      const assetsWithLinks: AssetWithLinks[] = assetsData.map((asset) => ({
        ...asset,
        links:
          linksData
            ?.filter((link: any) => link.asset_id === asset.id)
            .map((link: any) => ({
              id: link.id,
              asset_id: link.asset_id,
              milestone_id: link.milestone_id,
              allocation_percentage: link.allocation_percentage,
              created_at: link.created_at,
              milestone: link.milestones,
            })) || [],
      }));

      setAssets(assetsWithLinks);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  }

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    const asset = {
      category: formData.category,
      subcategory: formData.subcategory,
      name: formData.name,
      current_value: parseFloat(formData.current_value),
      accumulation_roi: globalAccumulationROI,
      distribution_roi: globalDistributionROI,
      annual_yield_percent: parseFloat(formData.annual_yield_percent),
      usage_type: formData.usage_type,
      updated_at: new Date().toISOString(),
    };

    // FIX: Changed table name to wealth_assets
    const { error } = await supabase.from('wealth_assets').insert(asset);
    
    if (error) {
      alert("Error adding asset: " + error.message);
      return;
    }

    setFormData({ category: 'retirement_base', subcategory: 'EPF', name: '', current_value: '', annual_yield_percent: '0', usage_type: 'liquid' });
    setShowAddForm(false);
    loadAssets();
  }

  async function handleDeleteAsset(id: string) {
    if (!confirm('Delete this asset and all its milestone links?')) return;
    // FIX: Changed table name to wealth_assets
    await supabase.from('wealth_assets').delete().eq('id', id);
    loadAssets();
  }

  async function handleLinkMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAsset) return;
    const link = { 
      asset_id: selectedAsset.id, 
      milestone_id: linkFormData.milestone_id, 
      allocation_percentage: parseFloat(linkFormData.allocation_percentage) 
    };
    await supabase.from('asset_milestone_links').insert(link);
    setLinkFormData({ milestone_id: '', allocation_percentage: '100' });
    setShowLinkModal(false);
    loadAssets();
  }

  async function updateGlobalROI() {
    const updates = { 
      accumulation_roi: globalAccumulationROI, 
      distribution_roi: globalDistributionROI, 
      updated_at: new Date().toISOString() 
    };
    for (const asset of assets) {
      // FIX: Changed table name to wealth_assets
      await supabase.from('wealth_assets').update(updates).eq('id', asset.id);
    }
    loadAssets();
  }

  // Math Helpers
  function calculateProjectedValue(asset: WealthVaultAsset, targetAge: number): number {
    const yearsToTarget = targetAge - currentAge;
    if (yearsToTarget <= 0) return asset.current_value;
    return asset.current_value * Math.pow(1 + (asset.accumulation_roi || 10) / 100, yearsToTarget);
  }

  function calculateFutureMilestoneCost(milestone: Milestone): number {
    const yearsToTarget = milestone.target_age - currentAge;
    if (yearsToTarget <= 0) return milestone.current_cost;
    return milestone.current_cost * Math.pow(1 + (milestone.inflation_rate || 6) / 100, yearsToTarget);
  }

  function calculateFundingPercentage(asset: WealthVaultAsset, milestone: Milestone): number {
    const projectedValue = calculateProjectedValue(asset, milestone.target_age);
    const futureCost = calculateFutureMilestoneCost(milestone);
    if (futureCost === 0) return 0;
    return (projectedValue / futureCost) * 100;
  }

  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.current_value, 0);

  const categoryTotals = ASSET_CATEGORIES.map((cat) => ({
    ...cat,
    value: assets.filter((a) => a.category === cat.id).reduce((sum, a) => sum + a.current_value, 0),
  })).filter((cat) => cat.value > 0);

  const availableMilestones = milestones.filter(
    (m) => !selectedAsset?.links.some((l) => l.milestone_id === m.id) && m.target_age > currentAge
  );

  if (loading) return <div className="p-8 text-white bg-navy-950 min-h-screen">Loading Wealth Vault...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wealth Vault & Linker</h1>
          <p className="text-slate-400">Standalone Asset Management with Milestone Mapping</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Asset
        </button>
      </div>

      {/* ROI Control Center */}
      <div className="mb-6 bg-slate-900 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={24} className="text-blue-400" />
          ROI Control Center
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Accumulation ROI (%) - Growth Phase</label>
            <div className="flex items-center gap-4">
              <input type="range" value={globalAccumulationROI} onChange={(e) => setGlobalAccumulationROI(parseFloat(e.target.value))} className="flex-1" min="5" max="15" step="0.5" />
              <span className="text-white font-mono w-12 text-right">{globalAccumulationROI}%</span>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Distribution ROI (%) - Withdrawal Phase</label>
            <div className="flex items-center gap-4">
              <input type="range" value={globalDistributionROI} onChange={(e) => setGlobalDistributionROI(parseFloat(e.target.value))} className="flex-1" min="4" max="8" step="0.5" />
              <span className="text-white font-mono w-12 text-right">{globalDistributionROI}%</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <button onClick={updateGlobalROI} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">Apply ROI to All Assets</button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 bg-slate-900 rounded-lg border border-slate-700 p-6 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-slate-400 text-sm mb-2">Category</label>
              <select value={formData.category} onChange={(e) => {
                  const category = e.target.value as WealthVaultCategory;
                  const cat = ASSET_CATEGORIES.find((c) => c.id === category);
                  setFormData({ ...formData, category, subcategory: cat?.subcategories[0] || 'EPF' });
                }} className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white">
                {ASSET_CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Asset Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white" required />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Current Value (₹)</label>
              <input type="number" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white font-mono" required />
            </div>
            <div className="md:col-span-2 flex gap-4 mt-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-bold">Save Asset</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded text-white">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {assets.length === 0 ? (
             <div className="bg-slate-900 border border-dashed border-slate-700 rounded-lg p-12 text-center text-slate-500">
               No assets found. Click "Add Asset" to begin.
             </div>
           ) : (
             ASSET_CATEGORIES.map((category) => {
              const categoryAssets = assets.filter((a) => a.category === category.id);
              if (categoryAssets.length === 0) return null;
              const Icon = category.icon;
              return (
                <div key={category.id} className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon size={24} style={{ color: category.color }} />
                    <h2 className="text-xl font-semibold text-white">{category.name}</h2>
                  </div>
                  <div className="space-y-3">
                    {categoryAssets.map((asset) => (
                      <div key={asset.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-white font-semibold">{asset.name}</h3>
                            <div className="text-2xl font-bold text-green-400 font-mono">{formatCurrency(asset.current_value)}</div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => { setSelectedAsset(asset); setShowLinkModal(true); }} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white"><LinkIcon size={14} /> Link</button>
                             <button onClick={() => handleDeleteAsset(asset.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        {asset.links.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Linked Milestones</p>
                            {asset.links.map(link => (
                              <div key={link.id} className="text-xs bg-slate-900/50 p-2 rounded flex justify-between items-center border border-slate-700">
                                <span className="text-slate-300">{link.milestone.name}</span>
                                <span className="text-green-400 font-bold">{calculateFundingPercentage(asset, link.milestone).toFixed(1)}% Funded</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
           )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold text-white mb-4">Total Portfolio</h2>
            <div className="text-3xl font-bold text-white font-mono mb-6">{formatCurrency(totalPortfolioValue)}</div>
            <div className="space-y-3">
              {categoryTotals.map(cat => (
                <div key={cat.id} className="flex justify-between text-sm items-center">
                  <span className="text-slate-400">{cat.name}</span>
                  <span className="text-white font-mono">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLinkModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Link Asset to Milestone</h2>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <p className="text-sm text-slate-400 mb-6">Allocate <span className="text-blue-400 font-bold">{selectedAsset.name}</span> to a future goal.</p>
            <form onSubmit={handleLinkMilestone} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Select Milestone</label>
                <select value={linkFormData.milestone_id} onChange={(e) => setLinkFormData({ ...linkFormData, milestone_id: e.target.value })} className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700" required>
                  <option value="">Choose a goal...</option>
                  {availableMilestones.map(m => <option key={m.id} value={m.id}>{m.name} (Age {m.target_age})</option>)}
                </select>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white font-bold flex-1">Link Milestone</button>
                <button type="button" onClick={() => setShowLinkModal(false)} className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg text-white flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}