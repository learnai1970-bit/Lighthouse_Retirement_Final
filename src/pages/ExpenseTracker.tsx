import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calculator, RefreshCw, ArrowDownCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MASTER_LIST = [
  { category: "Monthly Inflows", subcategories: ["Pension", "Rental Income"], customInflation: 0.03, isInflow: true },
  { category: "Assets", subcategories: ["Asset Amortization Provision"] },
  { category: "House Hold expenses", subcategories: ["Grocery", "Milk", "Vegetable fruits", "Other Eatbles"] },
  { category: "Utilities", subcategories: ["Electricity Charges", "Broad Band Charges", "Mobile plan bill", "Cooking Gas Charges", "Land line bill", "Other- Utilities", "Muncipal tax for home", "Society Maintenance"] },
  { category: "Domestic Help", subcategories: ["Domestic Help-1", "Domestic Help-2", "Domestic Help-3"] },
  { category: "Insurance Premiums", subcategories: ["Term Life Insurance", "Car Insurance", "Other- Insurance"], defaultFrequency: 'annual' },
  { category: "Health Expenses", subcategories: ["Health Insurance", "Doctor Visit OPD", "Lab Tests", "Alternative Medicine Dr fee", "Medicines bill", "Preventive Check Ups"], customInflation: 0.10 },
  { category: "Entairtenment", subcategories: ["Health Other", "OTT Subscriptions", "Movie", "TV cable charges"] },
  { category: "Leisure", subcategories: ["Other", "Dine Out", "A day trip", "Other-Leisure"] },
  { category: "Social Event", subcategories: ["Birthday parties", "Gifts to others"] },
  { category: "Vacations", subcategories: ["Small Vaction", "Big Vacation"], defaultFrequency: 'annual' },
  { category: "Lifestyle", subcategories: ["Cloths", "Footwear", "Accessories"] },
  { category: "Annual Maintenance Contract", subcategories: ["Elctronics", "Pest Control"], defaultFrequency: 'annual' },
  { category: "House Repairs- Minor", subcategories: ["Plumbing", "Electric", "Other"] },
  { category: "Car and Local Travel", subcategories: ["Petrol Expenses", "Car Servicing"] }
];

export default function ExpenseTracker() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: catData } = await supabase.from('expense_categories')
      .select('*')
      .eq('user_id', user?.id)
      .order('sort_order');
      
    const { data: subData } = await supabase.from('expense_subcategories')
      .select('*')
      .eq('user_id', user?.id)
      .order('sort_order');

    if (catData) {
      const combined = catData.map(cat => ({
        ...cat,
        subcategories: subData ? subData.filter(sub => sub.category_id === cat.id) : []
      }));
      setCategories(combined);
    }
    setLoading(false);
  }

  async function syncMasterList() {
    if (!confirm("This will clear current data and restore the Assets link. Proceed?")) return;
    setSyncing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please sign in to save data.");
      setSyncing(false);
      return;
    }

    await supabase.from('expense_subcategories').delete().eq('user_id', user.id);
    await supabase.from('expense_categories').delete().eq('user_id', user.id);

    for (let i = 0; i < MASTER_LIST.length; i++) {
      const item = MASTER_LIST[i];
      const { data: cat } = await supabase.from('expense_categories').insert([{
        name: item.category,
        inflation_rate: item.customInflation || 0.06,
        sort_order: i,
        user_id: user.id
      }]).select().single();

      if (cat) {
        const subs = item.subcategories.map((name, index) => ({
          category_id: cat.id,
          name: name,
          amount: 0,
          frequency: item.defaultFrequency || 'monthly',
          sort_order: index,
          user_id: user.id
        }));
        await supabase.from('expense_subcategories').insert(subs);
      }
    }
    await loadData();
    setSyncing(false);
  }

  async function updateSubName(id, name) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('expense_subcategories').update({ name }).eq('id', id).eq('user_id', user?.id);
  }

  async function updateAmount(id, amount) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('expense_subcategories').update({ amount }).eq('id', id).eq('user_id', user?.id);
    setCategories(prev => prev.map(cat => ({
      ...cat,
      subcategories: cat.subcategories.map(s => s.id === id ? { ...s, amount } : s)
    })));
  }

  async function toggleFrequency(id, current) {
    const { data: { user } } = await supabase.auth.getUser();
    const frequency = current === 'monthly' ? 'annual' : 'monthly';
    await supabase.from('expense_subcategories').update({ frequency }).eq('id', id).eq('user_id', user?.id);
    loadData();
  }

  async function deleteSub(id) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('expense_subcategories').delete().eq('id', id).eq('user_id', user?.id);
    loadData();
  }

  const rawTotalAnnual = categories.reduce((acc, cat) => 
    acc + cat.subcategories.reduce((sAcc, sub) => sAcc + (sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount), 0), 0);
  
  const displayTotal = rawTotalAnnual < 0 ? 0 : rawTotalAnnual;

  if (loading) return <div className="p-8 text-white">Loading Tracker...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Expense Tracker</h1>
          <p className="text-slate-400 mt-1">Master Lifestyle & Inflow Manager</p>
        </div>
        <button onClick={syncMasterList} disabled={syncing} className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Reset to Master List"}
        </button>
      </div>

      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat.id} className={`rounded-xl border overflow-hidden shadow-xl ${cat.name === 'Monthly Inflows' ? 'bg-emerald-950/20 border-emerald-800' : cat.name === 'Assets' ? 'bg-amber-950/10 border-amber-900/50' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`px-6 py-4 flex justify-between items-center ${cat.name === 'Monthly Inflows' ? 'bg-emerald-900/40' : cat.name === 'Assets' ? 'bg-amber-900/20' : 'bg-slate-800/40'}`}>
              <span className={`font-bold text-lg uppercase tracking-wider flex items-center gap-2 ${cat.name === 'Monthly Inflows' ? 'text-emerald-400' : cat.name === 'Assets' ? 'text-amber-500' : cat.name === 'Health Expenses' ? 'text-red-400' : 'text-white'}`}>
                {cat.name === 'Monthly Inflows' && <ArrowDownCircle size={18} />}
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Growth/Inflation: {(cat.inflation_rate * 100).toFixed(0)}%</span>
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-800">
                {cat.subcategories.map(sub => {
                  const isAmortization = sub.name === 'Asset Amortization Provision';
                  const isNegative = sub.amount < 0;
                  return (
                    <tr key={sub.id} className="group hover:bg-slate-800/20">
                      <td className="px-6 py-4">
                        {isAmortization ? <span className="text-amber-500 font-bold italic">{sub.name}</span> : 
                        <input className="bg-transparent border-b border-transparent focus:border-slate-700 outline-none text-slate-300 focus:text-white w-full" defaultValue={sub.name} onBlur={(e) => updateSubName(sub.id, e.target.value)} />}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button disabled={isAmortization} onClick={() => toggleFrequency(sub.id, sub.frequency)} className={`mr-3 text-[10px] font-black px-2 py-1 rounded border ${sub.frequency === 'monthly' ? 'bg-blue-900/40 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                          {sub.frequency === 'monthly' ? 'M' : 'A'}
                        </button>
                        <input type="number" disabled={isAmortization} className={`bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none text-right w-32 font-mono ${isNegative ? 'text-emerald-400 font-bold' : 'text-white'} ${isAmortization ? 'opacity-50' : ''}`} value={sub.amount} onChange={(e) => updateAmount(sub.id, parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-6 py-4 text-right w-16">
                        {!isAmortization && <button onClick={() => deleteSub(sub.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-2xl flex justify-between items-center">
        <div>
          <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Net Annual Lifestyle Gap</p>
          <h2 className="text-4xl font-black text-white font-mono">₹{displayTotal.toLocaleString('en-IN')}</h2>
          {rawTotalAnnual < 0 && <p className="text-emerald-300 text-xs mt-2 font-bold italic">Note: Your monthly inflows exceed your expenses.</p>}
        </div>
        <Calculator size={48} className="text-blue-200/30" />
      </div>
    </div>
  );
}