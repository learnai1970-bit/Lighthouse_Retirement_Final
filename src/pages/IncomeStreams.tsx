import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/calculations';
import { Building2, Wallet, Plus, Trash2, ArrowRightCircle } from 'lucide-react';

export default function IncomeStreams() {
  const [realEstateAssets, setRealEstateAssets] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [pensions, setPensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showRentForm, setShowRentForm] = useState(false);
  const [showPensionForm, setShowPensionForm] = useState(false);
  const [rentFormData, setRentFormData] = useState({ asset_id: '', monthly_amount: '', annual_increase: '5' });
  const [pensionFormData, setPensionFormData] = useState({ name: '', amount: '', start_age: '60' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    // 1. Fetch Real Estate assets to link rentals to
    const { data: assets } = await supabase.from('asset_vault_items').select('*').eq('category', 'real_estate');
    // 2. Fetch existing rentals
    const { data: rentalData } = await supabase.from('rental_inflows').select('*, asset_vault_items(name)');
    // 3. Fetch existing pensions
    const { data: pensionData } = await supabase.from('pension_inflows').select('*');

    if (assets) setRealEstateAssets(assets);
    if (rentalData) setRentals(rentalData);
    if (pensionData) setPensions(pensionData);
    setLoading(false);
  }

  async function handleAddRent(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('rental_inflows').insert([{
      asset_id: rentFormData.asset_id,
      monthly_rent_amount: parseFloat(rentFormData.monthly_amount),
      annual_increase_percent: parseFloat(rentFormData.annual_increase)
    }]);
    if (!error) { loadData(); setShowRentForm(false); }
  }

  async function handleAddPension(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('pension_inflows').insert([{
      pension_name: pensionFormData.name,
      monthly_amount: parseFloat(pensionFormData.amount),
      start_age: parseInt(pensionFormData.start_age)
    }]);
    if (!error) { loadData(); setShowPensionForm(false); }
  }

  async function deleteItem(table: string, id: string) {
    if (confirm('Remove this income stream?')) {
      await supabase.from(table).delete().eq('id', id);
      loadData();
    }
  }

  if (loading) return <div className="p-8 text-white">Syncing Income Streams...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen text-slate-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Income Streams</h1>
        <p className="text-slate-400">Manage monthly cash inflows (Rentals & Pensions)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- RENTAL SECTION --- */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="text-blue-400" />
              <h2 className="text-xl font-bold text-white">Rental Income</h2>
            </div>
            <button onClick={() => setShowRentForm(!showRentForm)} className="text-blue-400 hover:text-white transition-colors">
              <Plus size={20} />
            </button>
          </div>

          {showRentForm && (
            <form onSubmit={handleAddRent} className="mb-6 space-y-4 bg-slate-800 p-4 rounded-lg">
              <select 
                className="w-full bg-slate-700 p-2 rounded text-white"
                onChange={(e) => setRentFormData({...rentFormData, asset_id: e.target.value})}
                required
              >
                <option value="">Select Property</option>
                {realEstateAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="number" placeholder="Monthly Rent (₹)" className="w-full bg-slate-700 p-2 rounded text-white" 
                onChange={(e) => setRentFormData({...rentFormData, monthly_amount: e.target.value})} required />
              <button type="submit" className="w-full bg-blue-600 py-2 rounded font-bold">Add Rent</button>
            </form>
          )}

          <div className="space-y-3">
            {rentals.map(r => (
              <div key={r.id} className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-white font-medium">{r.asset_vault_items?.name}</p>
                  <p className="text-xs text-slate-500">Increases {r.annual_increase_percent}% annually</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-green-400 font-mono">{formatCurrency(r.monthly_rent_amount)}/mo</span>
                  <button onClick={() => deleteItem('rental_inflows', r.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- PENSION SECTION --- */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Wallet className="text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Pensions & Annuities</h2>
            </div>
            <button onClick={() => setShowPensionForm(!showPensionForm)} className="text-emerald-400 hover:text-white transition-colors">
              <Plus size={20} />
            </button>
          </div>

          {showPensionForm && (
            <form onSubmit={handleAddPension} className="mb-6 space-y-4 bg-slate-800 p-4 rounded-lg">
              <input type="text" placeholder="Pension Name (e.g. NPS)" className="w-full bg-slate-700 p-2 rounded text-white" 
                onChange={(e) => setPensionFormData({...pensionFormData, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Monthly (₹)" className="bg-slate-700 p-2 rounded text-white" 
                  onChange={(e) => setPensionFormData({...pensionFormData, amount: e.target.value})} required />
                <input type="number" placeholder="Start Age" className="bg-slate-700 p-2 rounded text-white" 
                  onChange={(e) => setPensionFormData({...pensionFormData, start_age: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-emerald-600 py-2 rounded font-bold">Add Pension</button>
            </form>
          )}

          <div className="space-y-3">
            {pensions.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-white font-medium">{p.pension_name}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <ArrowRightCircle size={12} /> Starts at age {p.start_age}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-mono">{formatCurrency(p.monthly_amount)}/mo</span>
                  <button onClick={() => deleteItem('pension_inflows', p.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}