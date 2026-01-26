import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, AlertCircle, TrendingUp, ArrowDownCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ExpenseCategory, ExpenseSubcategory, ExpenseItem } from '../lib/supabase';
import {
  calculateFutureCost,
  formatCurrency,
  formatPercentage,
  INFLATION_MIN,
  INFLATION_MAX,
  PROJECTION_YEARS_DEFAULT,
} from '../lib/calculations';

interface CategoryWithDetails extends ExpenseCategory {
  subcategories: (ExpenseSubcategory & {
    items: ExpenseItem[];
  })[];
}

export default function ExpenseArchitect() {
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [yearsToRetirement, setYearsToRetirement] = useState(PROJECTION_YEARS_DEFAULT);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
    loadData();
    const handleProfileUpdate = () => loadUserProfile();
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, []);

  function loadUserProfile() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        const years = profile.target_retirement_age - profile.current_age;
        setYearsToRetirement(years > 0 ? years : PROJECTION_YEARS_DEFAULT);
      }
    } catch (error) { console.error('Error loading user profile:', error); }
  }

  async function loadData() {
    setLoading(true);
    setDbError(null);
    try {
      const { data: categoriesData } = await supabase.from('expense_categories').select('*').order('sort_order');
      const { data: subcategoriesData } = await supabase.from('expense_subcategories').select('*').order('sort_order');
      const { data: itemsData } = await supabase.from('expense_items').select('*').order('sort_order');

      if (categoriesData && subcategoriesData) {
        const categoriesWithDetails: CategoryWithDetails[] = categoriesData.map((cat) => ({
          ...cat,
          subcategories: subcategoriesData
            .filter((sub) => sub.category_id === cat.id)
            .map((sub) => ({
              ...sub,
              items: itemsData ? itemsData.filter((item) => item.subcategory_id === sub.id) : [],
            })),
        }));
        setCategories(categoriesWithDetails);
      }
    } catch (err: any) { setDbError(err.message); } 
    finally { setLoading(false); }
  }

  // --- UI ACTIONS ---
  async function addCategory() {
    const name = prompt('Category name:');
    if (!name) return;
    const { data } = await supabase.from('expense_categories').insert({ name: name.trim(), inflation_rate: 0.06, sort_order: categories.length }).select();
    if (data) loadData();
  }

  async function deleteCategory(id: string) {
    if (confirm('Delete category?')) {
      await supabase.from('expense_categories').delete().eq('id', id);
      loadData();
    }
  }

  async function updateCategoryInflation(id: string, current: number) {
    const newRate = parseFloat(prompt('New Inflation Rate (e.g. 0.06 for 6%):', current.toString()) || '');
    if (!isNaN(newRate)) {
      await supabase.from('expense_categories').update({ inflation_rate: newRate }).eq('id', id);
      loadData();
    }
  }

  // --- CALCULATION CORE ---
  const totals = categories.reduce((acc, cat) => {
    const isAsset = cat.name === 'Assets';
    const isInflow = cat.name === 'Monthly Inflows';
    
    const catAnnual = cat.subcategories.reduce((sAcc, sub) => {
      const base = sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount;
      return sAcc + base;
    }, 0);

    const catFuture = calculateFutureCost(catAnnual, cat.inflation_rate, yearsToRetirement);

    if (isAsset) acc.amortization += catAnnual;
    else if (isInflow) acc.inflows += catAnnual;
    else acc.lifestyle += catAnnual;

    acc.futureTotal += catFuture;
    return acc;
  }, { lifestyle: 0, amortization: 0, inflows: 0, futureTotal: 0 });

  const netAnnualCommitment = totals.lifestyle + totals.amortization + totals.inflows;

  if (loading) return <div className="h-screen bg-navy-950 flex items-center justify-center text-slate-400 font-mono">Architecting Future...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen text-white">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Expense Architect</h1>
          <p className="text-slate-400">Projecting costs for retirement in {yearsToRetirement} years.</p>
        </div>
        <button onClick={addCategory} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Base Lifestyle</p>
          <p className="text-3xl font-mono font-bold text-blue-400">{formatCurrency(totals.lifestyle)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-amber-900/40 shadow-xl">
          <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">Amortization Provision</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(totals.amortization)}</p>
        </div>
        <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30 shadow-xl">
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Annual Commitment</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(netAnnualCommitment)}</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
          <div>Category</div>
          <div className="text-center">Current Annual</div>
          <div className="text-right">Inflation</div>
          <div className="text-right">Future ({yearsToRetirement}Y)</div>
        </div>

        <div className="divide-y divide-slate-800">
          {categories.map((cat) => {
            const isExpanded = expandedCategories.has(cat.id);
            const catAnnual = cat.subcategories.reduce((acc, sub) => acc + (sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount), 0);
            const catFuture = calculateFutureCost(catAnnual, cat.inflation_rate, yearsToRetirement);

            return (
              <div key={cat.id} className="group">
                <div className="px-6 py-4 hover:bg-slate-800/40 transition-colors grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      const n = new Set(expandedCategories);
                      isExpanded ? n.delete(cat.id) : n.add(cat.id);
                      setExpandedCategories(n);
                    }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <span className={`font-bold ${cat.name === 'Monthly Inflows' ? 'text-emerald-400' : 'text-slate-200'}`}>{cat.name}</span>
                  </div>
                  <div className="text-center font-mono text-sm">₹{Math.abs(catAnnual).toLocaleString('en-IN')}</div>
                  <div className="text-right flex items-center justify-end gap-2 text-blue-400 font-mono">
                    {formatPercentage(cat.inflation_rate)}
                    <Edit2 size={12} className="cursor-pointer text-slate-600" onClick={() => updateCategoryInflation(cat.id, cat.inflation_rate)} />
                  </div>
                  <div className="text-right font-bold font-mono">₹{Math.abs(Math.round(catFuture)).toLocaleString('en-IN')}</div>
                </div>

                {isExpanded && cat.subcategories.map(sub => (
                  <div key={sub.id} className="px-12 py-2 text-sm text-slate-400 border-l-2 border-slate-800 ml-6 flex justify-between bg-black/5">
                    <span>{sub.name}</span>
                    <span className="font-mono">₹{(sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-2xl flex justify-between items-center">
        <div>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1 text-white/70">Total Future Annual Need (Inflation Adjusted)</p>
          <h2 className="text-4xl font-black text-white font-mono">₹{Math.round(totals.futureTotal).toLocaleString('en-IN')}</h2>
        </div>
        <TrendingUp size={48} className="text-white/20" />
      </div>
    </div>
  );
}