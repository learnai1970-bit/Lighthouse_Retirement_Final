import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, Target, IndianRupee } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/calculations';
import type { WealthVaultAsset, AssetMilestoneLink, Milestone, WealthBaseline as WealthBaselineType } from '../lib/supabase';

interface AssetWithLinks extends WealthVaultAsset {
  links: Array<AssetMilestoneLink & { milestone: Milestone }>;
}

export default function CorpusBridge() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [wealthBaseline, setWealthBaseline] = useState<WealthBaselineType | null>(null);
  const [assets, setAssets] = useState<AssetWithLinks[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [child1Age, setChild1Age] = useState<number | null>(null);
  const [child2Age, setChild2Age] = useState<number | null>(null);

  useEffect(() => {
    loadUserProfile();
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      // 1. Fetch Milestones
      const { data: milestonesData } = await supabase.from('milestones').select('*').order('target_age');
      if (milestonesData) setMilestones(milestonesData);

      // 2. Fetch Wealth Baseline
      const { data: baselineData } = await supabase.from('wealth_baseline').select('*').maybeSingle();
      if (baselineData) setWealthBaseline(baselineData);

      // 3. FIX: Changed table name to 'wealth_assets'
      const { data: assetsData } = await supabase.from('wealth_assets').select('*');
      const { data: linksData } = await supabase.from('asset_milestone_links').select('*, milestones(*)');

      if (assetsData) {
        const assetsWithLinks: AssetWithLinks[] = assetsData.map((asset) => ({
          ...asset,
          links: linksData?.filter((link: any) => link.asset_id === asset.id).map((link: any) => ({
            ...link,
            milestone: link.milestones,
          })) || [],
        }));
        setAssets(assetsWithLinks);
      }
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  }

  function loadUserProfile() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setCurrentAge(profile.current_age || 30);
        setRetirementAge(profile.target_retirement_age || 60);
        setChild1Age(profile.child_1_age ?? null);
        setChild2Age(profile.child_2_age ?? null);
      }
    } catch (error) { console.error('Error loading user profile:', error); }
  }

  function calculateProjectedAssetValue(asset: WealthVaultAsset, targetAge: number): number {
    const yearsToTarget = targetAge - currentAge;
    if (yearsToTarget <= 0) return asset.current_value;
    // Use the accumulation_roi we added to the DB, fallback to 10%
    const roi = asset.accumulation_roi || 10;
    return asset.current_value * Math.pow(1 + roi / 100, yearsToTarget);
  }

  function calculateFutureMilestoneCost(milestone: Milestone): number {
    let yearsToTarget: number;
    if (milestone.category === 'education' && milestone.assigned_child) {
      const childAge = milestone.assigned_child === 'child_1' ? child1Age : child2Age;
      yearsToTarget = (childAge !== null) ? milestone.target_age - childAge : milestone.target_age - currentAge;
    } else {
      yearsToTarget = milestone.target_age - currentAge;
    }
    if (yearsToTarget <= 0) return milestone.current_cost;
    return milestone.current_cost * Math.pow(1 + (milestone.inflation_rate || 6) / 100, yearsToTarget);
  }

  // Calculate totals
  const totalProjectedAssets = assets.reduce((sum, a) => sum + calculateProjectedAssetValue(a, retirementAge), 0);
  const wealthBaselineCorpus = wealthBaseline ? (wealthBaseline.epf_ppf || 0) + (wealthBaseline.mutual_funds_stocks || 0) + (wealthBaseline.gold || 0) + (wealthBaseline.cash || 0) : 0;

  function isHistoricalMilestone(milestone: Milestone): boolean {
    if (milestone.category === 'education' && milestone.assigned_child) {
      const childAge = milestone.assigned_child === 'child_1' ? child1Age : child2Age;
      if (childAge !== null) return milestone.target_age <= childAge;
    }
    return milestone.target_age <= currentAge;
  }

  const activeMilestones = milestones.filter(m => !isHistoricalMilestone(m));
  const totalMilestoneFutureCost = activeMilestones.reduce((sum, m) => sum + calculateFutureMilestoneCost(m), 0);
  
  const totalAvailable = totalProjectedAssets + wealthBaselineCorpus;
  const totalNeeded = totalMilestoneFutureCost;
  const coveragePercent = totalNeeded > 0 ? (totalAvailable / totalNeeded) * 100 : 0;

  function getSustainabilityStatus() {
    if (totalAvailable === 0 && totalNeeded > 0) return { status: 'Gap Alert', color: 'text-red-400', icon: AlertCircle, message: 'Action required.' };
    if (coveragePercent >= 120) return { status: 'Safe', color: 'text-green-400', icon: CheckCircle, message: 'Excellent! Surplus wealth detected.' };
    if (coveragePercent >= 100) return { status: 'Green', color: 'text-green-400', icon: CheckCircle, message: 'On track!' };
    if (coveragePercent >= 80) return { status: 'Yellow', color: 'text-yellow-400', icon: AlertTriangle, message: 'Caution: Approaching gap.' };
    return { status: 'Red', color: 'text-red-400', icon: AlertCircle, message: 'Gap Alert: Action required.' };
  }

  const sustainability = getSustainabilityStatus();
  const StatusIcon = sustainability.icon;

  if (loading) return <div className="p-8 text-white bg-navy-950 min-h-screen">Calculating Bridge Data...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">The Corpus Bridge</h1>
        <p className="text-slate-400">Final Report - Reality Check Against Your Milestones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4"><IndianRupee className="text-blue-400" size={24} /><h2 className="text-lg font-semibold">Total Assets Available</h2></div>
            <div className="text-3xl font-bold text-green-400 font-mono">{formatCurrency(totalAvailable)}</div>
            <p className="text-slate-400 text-sm mt-2">Projected at Retirement (Age {retirementAge})</p>
         </div>

         <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4"><Target className="text-amber-400" size={24} /><h2 className="text-lg font-semibold">Total Milestones Cost</h2></div>
            <div className="text-3xl font-bold text-amber-400 font-mono">{formatCurrency(totalNeeded)}</div>
            <p className="text-slate-400 text-sm mt-2">Future Value (Inflation Adjusted)</p>
         </div>

         <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4"><StatusIcon className={sustainability.color} size={24} /><h2 className="text-lg font-semibold">Net Position</h2></div>
            <div className={`text-3xl font-bold ${sustainability.color} font-mono`}>{coveragePercent.toFixed(1)}%</div>
            <p className="text-slate-400 text-sm mt-2">{sustainability.status} Status</p>
         </div>
      </div>

      {totalAvailable === 0 && (
        <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="text-blue-400 shrink-0" size={20} />
          <p className="text-sm text-blue-200">
            Your bridge is empty. Go to the <strong>Wealth Vault</strong> to add assets and link them to your goals to see your projected coverage here.
          </p>
        </div>
      )}
    </div>
  );
}