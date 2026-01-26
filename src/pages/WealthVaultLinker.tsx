import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Link as LinkIcon,
  TrendingUp,
  AlertCircle,
  X,
  PiggyBank,
  Building2,
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
import { useFutureWealth } from '../contexts/FutureWealthContext';

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
  const { milestones, refresh: refreshMilestones } = useFutureWealth();
  const [assets, setAssets] = useState<AssetWithLinks[]>([]);
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
    loadAssets();
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

  async function loadAssets() {
    try {
      const { data: assetsData } = await supabase
        .from('wealth_vault_assets')
        .select('*')
        .order('category, subcategory');

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

    await supabase.from('wealth_vault_assets').insert(asset);

    setFormData({
      category: 'retirement_base',
      subcategory: 'EPF',
      name: '',
      current_value: '',
      annual_yield_percent: '0',
      usage_type: 'liquid',
    });
    setShowAddForm(false);
    loadAssets();
  }

  async function handleDeleteAsset(id: string) {
    if (!confirm('Delete this asset and all its milestone links?')) return;
    await supabase.from('wealth_vault_assets').delete().eq('id', id);
    loadAssets();
  }

  async function handleLinkMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAsset) return;

    const link = {
      asset_id: selectedAsset.id,
      milestone_id: linkFormData.milestone_id,
      allocation_percentage: parseFloat(linkFormData.allocation_percentage),
    };

    await supabase.from('asset_milestone_links').insert(link);

    setLinkFormData({ milestone_id: '', allocation_percentage: '100' });
    setShowLinkModal(false);
    loadAssets();
  }

  async function handleUnlinkMilestone(linkId: string) {
    await supabase.from('asset_milestone_links').delete().eq('id', linkId);
    loadAssets();
  }

  async function updateGlobalROI() {
    const updates = {
      accumulation_roi: globalAccumulationROI,
      distribution_roi: globalDistributionROI,
      updated_at: new Date().toISOString(),
    };

    for (const asset of assets) {
      await supabase.from('wealth_vault_assets').update(updates).eq('id', asset.id);
    }

    loadAssets();
  }

  function calculateProjectedValue(asset: WealthVaultAsset, targetAge: number): number {
    const yearsToTarget = targetAge - currentAge;
    if (yearsToTarget <= 0) return asset.current_value;

    return asset.current_value * Math.pow(1 + asset.accumulation_roi / 100, yearsToTarget);
  }

  function calculateFutureMilestoneCost(milestone: Milestone): number {
    const yearsToTarget = milestone.target_age - currentAge;
    if (yearsToTarget <= 0) return milestone.current_cost;

    return milestone.current_cost * Math.pow(1 + milestone.inflation_rate / 100, yearsToTarget);
  }

  function calculateFundingPercentage(asset: WealthVaultAsset, milestone: Milestone): number {
    const projectedValue = calculateProjectedValue(asset, milestone.target_age);
    const futureCost = calculateFutureMilestoneCost(milestone);

    if (futureCost === 0) return 0;
    return (projectedValue / futureCost) * 100;
  }

  function isCoreResponsibility(milestone: Milestone): boolean {
    return milestone.category === 'education' || milestone.category === 'cultural';
  }

  function isHistoricalMilestone(milestone: Milestone): boolean {
    if (milestone.category === 'education' && milestone.assigned_child) {
      const childAge = milestone.assigned_child === 'child_1' ? child1Age : child2Age;
      if (childAge !== null) {
        return milestone.target_age <= childAge;
      }
    }
    return milestone.target_age <= currentAge;
  }

  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.current_value, 0);

  const categoryTotals = ASSET_CATEGORIES.map((cat) => ({
    ...cat,
    value: assets
      .filter((a) => a.category === cat.id)
      .reduce((sum, a) => sum + a.current_value, 0),
  })).filter((cat) => cat.value > 0);

  function getCategoryIcon(category: WealthVaultCategory) {
    const cat = ASSET_CATEGORIES.find((c) => c.id === category);
    if (!cat) return Building2;
    return cat.icon;
  }

  function getCategoryColor(category: WealthVaultCategory) {
    const cat = ASSET_CATEGORIES.find((c) => c.id === category);
    return cat?.color || '#64748b';
  }

  const availableMilestones = milestones.filter(
    (m) => !selectedAsset?.links.some((l) => l.milestone_id === m.id) && !isHistoricalMilestone(m)
  );

  return (
    <div className="p-8 bg-navy-950 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wealth Vault & Linker</h1>
          <p className="text-slate-400">
            Standalone Asset Management with Milestone Mapping
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Asset
        </button>
      </div>

      <div className="mb-6 bg-slate-900 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={24} className="text-blue-400" />
          ROI Control Center
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-400 text-sm mb-2">
              Accumulation ROI (%) - Growth Phase
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={globalAccumulationROI}
                onChange={(e) => setGlobalAccumulationROI(parseFloat(e.target.value))}
                className="flex-1"
                min="5"
                max="15"
                step="0.5"
              />
              <input
                type="number"
                value={globalAccumulationROI}
                onChange={(e) => setGlobalAccumulationROI(parseFloat(e.target.value))}
                className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-blue-500"
                min="5"
                max="15"
                step="0.1"
              />
              <span className="text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">5% - 15% range (Default: 10%)</p>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2">
              Distribution ROI (%) - Withdrawal Phase
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={globalDistributionROI}
                onChange={(e) => setGlobalDistributionROI(parseFloat(e.target.value))}
                className="flex-1"
                min="4"
                max="8"
                step="0.5"
              />
              <input
                type="number"
                value={globalDistributionROI}
                onChange={(e) => setGlobalDistributionROI(parseFloat(e.target.value))}
                className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-blue-500"
                min="4"
                max="8"
                step="0.1"
              />
              <span className="text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">4% - 8% range (Default: 7%)</p>
          </div>

          <div className="col-span-2">
            <button
              onClick={updateGlobalROI}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Apply ROI to All Assets
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Asset</h2>
          <form onSubmit={handleAddAsset} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const category = e.target.value as WealthVaultCategory;
                  const cat = ASSET_CATEGORIES.find((c) => c.id === category);
                  setFormData({
                    ...formData,
                    category,
                    subcategory: cat?.subcategories[0] || 'EPF',
                  });
                }}
                className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {ASSET_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Subcategory</label>
              <select
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory: e.target.value as WealthVaultSubcategory })
                }
                className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {ASSET_CATEGORIES.find((c) => c.id === formData.category)?.subcategories.map(
                  (sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Asset Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., My EPF Account"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Current Value (₹)</label>
              <input
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="500000"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Annual Yield % (Income)</label>
              <input
                type="number"
                value={formData.annual_yield_percent}
                onChange={(e) => setFormData({ ...formData, annual_yield_percent: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="0.0"
                min="0"
                max="15"
                step="0.1"
              />
              <p className="text-xs text-slate-500 mt-1">If 0%, Annual Income = ₹0</p>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Usage Type</label>
              <select
                value={formData.usage_type}
                onChange={(e) => setFormData({ ...formData, usage_type: e.target.value as 'liquid' | 'self_use' })}
                className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="liquid">Liquid (Investment)</option>
                <option value="self_use">Self-Use (Excluded from Retirement Pool)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Self-use assets show ₹0 income</p>
            </div>

            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Add Asset
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {ASSET_CATEGORIES.map((category) => {
            const categoryAssets = assets.filter((a) => a.category === category.id);
            if (categoryAssets.length === 0) return null;

            const Icon = category.icon;

            return (
              <div key={category.id} className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon size={24} style={{ color: category.color }} />
                  <h2 className="text-xl font-semibold text-white">{category.name}</h2>
                  <span className="text-slate-400 text-sm ml-auto">
                    {formatCurrency(
                      categoryAssets.reduce((sum, a) => sum + a.current_value, 0)
                    )}
                  </span>
                </div>

                <div className="space-y-3">
                  {categoryAssets.map((asset) => {
                    const hasShortfall = asset.links.some((link) => {
                      const fundingPct = calculateFundingPercentage(asset, link.milestone);
                      return isCoreResponsibility(link.milestone) && fundingPct < 100;
                    });

                    return (
                      <div
                        key={asset.id}
                        className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold">{asset.name}</h3>
                              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                {asset.subcategory}
                              </span>
                              {hasShortfall && (
                                <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                  <AlertCircle size={12} />
                                  Action Required
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-green-400 font-mono">
                              {formatCurrency(asset.current_value)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowLinkModal(true);
                              }}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              <LinkIcon size={14} />
                              Link
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {asset.links.length > 0 && (
                          <div className="border-t border-slate-700 pt-3 space-y-2">
                            <div className="text-xs text-slate-400 mb-2">Linked Milestones:</div>
                            {asset.links.map((link) => {
                              const fundingPct = calculateFundingPercentage(
                                asset,
                                link.milestone
                              );
                              const isShortfall =
                                isCoreResponsibility(link.milestone) && fundingPct < 100;
                              const isPassed = isHistoricalMilestone(link.milestone);

                              return (
                                <div
                                  key={link.id}
                                  className={`rounded p-2 flex items-center justify-between ${
                                    isPassed ? 'bg-slate-800/30 border border-slate-700' : 'bg-slate-700/50'
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm ${isPassed ? 'text-slate-500 line-through' : 'text-white'}`}>
                                        {link.milestone.name}
                                      </span>
                                      {isPassed && (
                                        <span className="text-xs bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded">
                                          Passed/Completed
                                        </span>
                                      )}
                                      {!isPassed && isCoreResponsibility(link.milestone) && (
                                        <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                          Core
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-xs mt-1 ${isPassed ? 'text-slate-600' : 'text-slate-400'}`}>
                                      {isPassed ? 'Target Age: ' : 'Future Cost: '}
                                      {isPassed ? link.milestone.target_age : formatCurrency(calculateFutureMilestoneCost(link.milestone))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {!isPassed && (
                                      <div className="text-right">
                                        <div
                                          className={`text-lg font-bold font-mono ${
                                            isShortfall ? 'text-red-400' : 'text-green-400'
                                          }`}
                                        >
                                          {fundingPct.toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-slate-400">Funded</div>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => handleUnlinkMilestone(link.id)}
                                      className="text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {assets.length === 0 && (
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-12 text-center">
              <PiggyBank className="text-slate-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">No Assets Added Yet</h3>
              <p className="text-slate-400">
                Start building your wealth vault by adding your first asset
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Total Wealth Portfolio</h2>

            {totalPortfolioValue === 0 ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-slate-400">No assets to display</p>
              </div>
            ) : (
              <>
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <svg viewBox="0 0 200 200" className="transform -rotate-90">
                    {(() => {
                      let cumulativePercent = 0;
                      return categoryTotals.map((cat, index) => {
                        const percent = (cat.value / totalPortfolioValue) * 100;
                        const circumference = 2 * Math.PI * 80;
                        const strokeDasharray = `${
                          (percent / 100) * circumference
                        } ${circumference}`;
                        const strokeDashoffset = (-cumulativePercent * circumference) / 100;
                        cumulativePercent += percent;

                        return (
                          <circle
                            key={index}
                            cx="100"
                            cy="100"
                            r="80"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="40"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-slate-400">Total</div>
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(totalPortfolioValue, 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {categoryTotals.map((cat) => {
                    const Icon = cat.icon;
                    const percent = (cat.value / totalPortfolioValue) * 100;
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-2 bg-slate-800 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <Icon size={14} style={{ color: cat.color }} />
                          <span className="text-white text-sm">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-mono text-sm">
                            {formatCurrency(cat.value)}
                          </div>
                          <div className="text-slate-400 text-xs">{percent.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <h3 className="text-white font-semibold mb-2">About This Module:</h3>
            <ul className="text-slate-400 space-y-1 text-xs">
              <li>• Standalone vault - no impact on existing modules</li>
              <li>• Link assets to specific milestones for planning</li>
              <li>• Track funding percentage in real-time</li>
              <li>• Core responsibilities (education, cultural) flagged when underfunded</li>
              <li>• Independent ROI controls for growth and withdrawal phases</li>
            </ul>
          </div>
        </div>
      </div>

      {showLinkModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Link to Milestone</h2>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedAsset(null);
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-slate-400 text-sm mb-2">Asset:</div>
              <div className="text-white font-semibold">{selectedAsset.name}</div>
              <div className="text-green-400 font-mono">
                {formatCurrency(selectedAsset.current_value)}
              </div>
            </div>

            {availableMilestones.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-slate-400">
                  All milestones are already linked to this asset. Create new milestones or unlink
                  existing ones to link more.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLinkMilestone} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Select Milestone</label>
                  <select
                    value={linkFormData.milestone_id}
                    onChange={(e) =>
                      setLinkFormData({ ...linkFormData, milestone_id: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a milestone...</option>
                    {availableMilestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.name} - {formatCurrency(milestone.current_cost)} (Age{' '}
                        {milestone.target_age})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-2">
                    Allocation Percentage
                  </label>
                  <input
                    type="number"
                    value={linkFormData.allocation_percentage}
                    onChange={(e) =>
                      setLinkFormData({ ...linkFormData, allocation_percentage: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    min="1"
                    max="100"
                    step="1"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    % of this asset allocated to the milestone
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Link Milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkModal(false);
                      setSelectedAsset(null);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
