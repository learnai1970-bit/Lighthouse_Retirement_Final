import { useEffect, useState } from 'react';
import { TrendingUp, IndianRupee, Package, Calendar, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  calculateFutureCost, 
  calculateActualYield, 
  formatCurrency, 
  PROJECTION_YEARS_DEFAULT 
} from '../lib/calculations';
import type { ExpenseCategory, ExpenseSubcategory, AssetVaultItem } from '../lib/supabase';
import LifetimeCashflowChart from '../components/LifetimeCashflowChart';
import DignityGauge from '../components/DignityGauge';
import CorpusPieChart from '../components/CorpusPieChart';
import { useProjections } from '../contexts/ProjectionContext';
import { useSettings } from '../contexts/SettingsContext';

interface CashflowDataPoint {
  age: number;
  corpus: number;
  expenses: number;
}

export default function Dashboard() {
  const { baseYearLifestyleExpenses, baseYearSinkingFund, baseYearTotalNeed } = useProjections();
  const { inflationRate, setInflationRate } = useSettings();
  
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [currentYearActualYield, setCurrentYearActualYield] = useState(0);
  const [currentAge, setCurrentAge] = useState(30);
  const [editingAge, setEditingAge] = useState(false);
  const [cashflowData, setCashflowData] = useState<CashflowDataPoint[]>([]);
  const [zeroDignityAge, setZeroDignityAge] = useState<number | null>(null);
  const [vaultItems, setVaultItems] = useState<AssetVaultItem[]>([]);
  const [yearsToRetirement, setYearsToRetirement] = useState(PROJECTION_YEARS_DEFAULT);
  const [baseInflation, setBaseInflation] = useState(6);
  const [healthInflation, setHealthInflation] = useState(10);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);

  useEffect(() => {
    loadUserProfile();
    loadDashboardData();

    const handleProfileUpdate = () => {
      loadUserProfile();
      loadDashboardData();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, []);

  function loadUserProfile() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        const years = (profile.target_retirement_age || 60) - (profile.current_age || 30);
        setYearsToRetirement(years > 0 ? years : PROJECTION_YEARS_DEFAULT);
        setCurrentAge(profile.current_age || 30);
        setBaseInflation(profile.base_inflation || 6);
        setHealthInflation(profile.health_inflation || 10);
        setLifeExpectancy(profile.life_expectancy || 90);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async function loadDashboardData() {
    if (!supabase) return;

    const { data: categories } = await supabase.from('expense_categories').select('*');
    const { data: subcategories } = await supabase.from('expense_subcategories').select('*');
    const { data: vItems } = await supabase.from('asset_vault_items').select('*');

    if (categories && subcategories) {
      let futureTotal = 0;
      const healthCategoryId = categories?.find((c: ExpenseCategory) => c.name === 'Health')?.id;

      subcategories.forEach((sub: ExpenseSubcategory) => {
        const subAnnualAmount = sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount;
        const subRate = sub.category_id === healthCategoryId ? healthInflation : baseInflation;
        futureTotal += calculateFutureCost(subAnnualAmount, subRate, yearsToRetirement);
      });

      setTotalExpenses(futureTotal);
      setCategoryCount(categories.length);
    }

    if (vItems) {
      const liquidItems = vItems.filter(item => item.usage_type !== 'self_use');
      const actualYield = liquidItems.reduce((sum, item) => {
        return sum + calculateActualYield(
          item.value,
          item.category,
          item.expected_growth_rate,
          item.annual_rental_yield_percent
        );
      }, 0);

      setCurrentYearActualYield(actualYield);
      setVaultItems(vItems);
      calculateLifetimeCashflow(vItems, baseYearLifestyleExpenses, currentAge, lifeExpectancy);
    }
  }

  async function calculateLifetimeCashflow(assets: AssetVaultItem[], currentExpenses: number, age: number, maxAge: number) {
    const liquidAssets = assets.filter(asset => asset.usage_type !== 'self_use');
    let corpus = liquidAssets.reduce((sum, asset) => sum + asset.value, 0);
    if (corpus === 0) return;

    const weightedGrowthRate = liquidAssets.reduce((sum, asset) => sum + (asset.expected_growth_rate * (asset.value / corpus)), 0) / 100;
    const weightedYieldRate = liquidAssets.reduce((sum, asset) => sum + ((asset.annual_rental_yield_percent || 0) * (asset.value / corpus)), 0) / 100;

    const data: CashflowDataPoint[] = [];
    let dignityAge: number | null = null;

    for (let cAge = age; cAge <= maxAge; cAge++) {
      const yearsFromNow = cAge - age;
      const inflatedExp = calculateFutureCost(currentExpenses, baseInflation, yearsFromNow) + baseYearSinkingFund;
      
      const yieldAmt = corpus * weightedYieldRate;
      const growthAmt = corpus * weightedGrowthRate;
      const shortfall = Math.max(0, inflatedExp - yieldAmt);
      corpus = corpus + growthAmt - shortfall;

      if (corpus <= 0 && dignityAge === null) dignityAge = cAge;

      data.push({ age: cAge, corpus: Math.max(0, corpus), expenses: inflatedExp });
    }
    setCashflowData(data);
    setZeroDignityAge(dignityAge);
  }

  // --- STABLE GAUGE LOGIC ---
  const absAnnualNeed = Math.abs(baseYearTotalNeed);
  const dignityRatio = absAnnualNeed > 0 ? (currentYearActualYield / absAnnualNeed) : 0;
  
  const debtYield = vaultItems.filter(i => i.category === 'debt')
    .reduce((s, i) => s + calculateActualYield(i.value, i.category, i.expected_growth_rate, i.annual_rental_yield_percent), 0);
  
  const rentalYield = vaultItems.filter(i => i.category === 'real_estate')
    .reduce((s, i) => s + calculateActualYield(i.value, i.category, i.expected_growth_rate, i.annual_rental_yield_percent), 0);

  const corpusSegments = [
    { name: 'Equity/MF', value: vaultItems.filter(i => i.category === 'equity').reduce((s, i) => s + i.value, 0), color: '#3b82f6' },
    { name: 'Debt/Fixed Income', value: vaultItems.filter(i => i.category === 'debt').reduce((s, i) => s + i.value, 0), color: '#10b981' },
    { name: 'Real Estate', value: vaultItems.filter(i => i.category === 'real_estate').reduce((s, i) => s + i.value, 0), color: '#a855f7' },
    { name: 'Gold', value: vaultItems.filter(i => i.category === 'gold').reduce((s, i) => s + i.value, 0), color: '#f59e0b' },
  ].filter(s => s.value > 0);

  return (
    <div className="p-8 bg-navy-950 min-h-screen">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Your retirement planning overview</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 rounded-lg border border-slate-700 px-4 py-3">
          <label className="text-slate-400 text-sm">Global Inflation Rate:</label>
          <input
            type="number"
            value={inflationRate}
            onChange={(e) => setInflationRate(parseFloat(e.target.value) || 6)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white font-mono w-20"
          />
          <span className="text-slate-400 text-sm">%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DignityGauge ratio={dignityRatio} annualIncome={currentYearActualYield} annualExpenses={absAnnualNeed} />
        <CorpusPieChart segments={corpusSegments} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg"><IndianRupee className="text-blue-400" size={24} /></div>
            <span className="text-slate-500 text-sm">Future Annual</span>
          </div>
          <div className="font-mono text-2xl font-bold text-white mb-1">{formatCurrency(totalExpenses + baseYearSinkingFund)}</div>
          <p className="text-slate-400 text-sm">Target expenses in {yearsToRetirement} years</p>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg"><TrendingUp className="text-green-400" size={24} /></div>
            <span className="text-slate-500 text-sm">Categories</span>
          </div>
          <div className="font-mono text-2xl font-bold text-white mb-1">{categoryCount}</div>
          <p className="text-slate-400 text-sm">Expense categories tracked</p>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-500/10 p-3 rounded-lg"><Package className="text-amber-400" size={24} /></div>
            <span className="text-slate-500 text-sm">Asset Amortization</span>
          </div>
          <div className="font-mono text-2xl font-bold text-white mb-1">{formatCurrency(baseYearSinkingFund)}</div>
          <p className="text-slate-400 text-sm">Annual provision for replacements</p>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500/10 p-3 rounded-lg"><Calendar className="text-purple-400" size={24} /></div>
            <span className="text-slate-500 text-sm">Assets</span>
          </div>
          <div className="font-mono text-2xl font-bold text-white mb-1">{vaultItems.length}</div>
          <p className="text-slate-400 text-sm">Total items in Asset Vault</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Income Breakdown (Baseline)</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">Debt & Fixed Income</span>
              <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(debtYield)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">Real Estate Rental</span>
              <span className="font-mono text-purple-400 font-semibold">{formatCurrency(rentalYield)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">Equity & Other Yields</span>
              <span className="font-mono text-blue-400 font-semibold">{formatCurrency(currentYearActualYield - (debtYield + rentalYield))}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-white font-semibold">Total Actual Yield</span>
              <span className="font-mono text-green-400 font-bold text-xl">{formatCurrency(currentYearActualYield)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Expense Breakdown (Baseline)</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">Lifestyle Expenses</span>
              <span className="font-mono text-blue-400 font-semibold">{formatCurrency(baseYearLifestyleExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">Asset Sinking Fund</span>
              <span className="font-mono text-amber-400 font-semibold">{formatCurrency(baseYearSinkingFund)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-white font-semibold">Total Annual Need</span>
              <span className="font-mono text-red-400 font-bold text-xl">{formatCurrency(absAnnualNeed)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Sthiti Engine</h2>
        </div>
        <LifetimeCashflowChart data={cashflowData} currentAge={currentAge} lifeExpectancy={lifeExpectancy} zeroDignityAge={zeroDignityAge} />
      </div>
    </div>
  );
}