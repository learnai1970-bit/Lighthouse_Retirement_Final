import { useEffect, useState } from 'react';
import { Plus, Trash2, Target, User, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/calculations';

interface Milestone {
  id: string;
  name: string;
  current_cost: number;
  target_age: number;
  category: string;
  inflation_rate: number;
}

export default function MilestoneNavigator() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    current_cost: '',
    target_age: '',
    category: 'Education',
    inflation_rate: '6' // Defaulting to your preferred 6% [cite: 2026-01-11]
  });

  const refresh = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('target_age', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('milestones').insert([{
        name: formData.name,
        current_cost: parseFloat(formData.current_cost),
        target_age: parseInt(formData.target_age),
        category: formData.category,
        inflation_rate: parseFloat(formData.inflation_rate)
      }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ name: '', current_cost: '', target_age: '', category: 'Education', inflation_rate: '6' });
      refresh();
    } catch (err) {
      alert('Error saving milestone. Check console for details.');
      console.error(err);
    }
  };

  useEffect(() => { refresh(); }, []);

  if (loading) return <div className="p-8 text-white bg-navy-950 min-h-screen">Loading Roadmap...</div>;

  return (
    <div className="p-8 bg-navy-950 min-h-screen relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Life Roadmap</h1>
          <p className="text-slate-400">Navigate your future financial milestones</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Milestone
        </button>
      </div>

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">New Milestone</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Milestone Name</label>
                <input required className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Higher Education"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Current Cost (Today)</label>
                  <input required type="number" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white"
                    value={formData.current_cost} onChange={e => setFormData({...formData, current_cost: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Target Age</label>
                  <input required type="number" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white"
                    value={formData.target_age} onChange={e => setFormData({...formData, target_age: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Inflation Rate (%)</label>
                <input required type="number" step="0.1" className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-white"
                  value={formData.inflation_rate} onChange={e => setFormData({...formData, inflation_rate: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 mt-4">
                <Save size={18} /> Save Milestone
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List logic remains same as before... */}
      <div className="grid gap-4">
        {milestones.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-dashed border-slate-700">
            <Target className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No milestones set yet.</p>
          </div>
        ) : (
          milestones.map((m) => (
            <div key={m.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">{m.name}</h3>
                <div className="flex gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><User size={14} /> Age {m.target_age}</span>
                  <span className="text-green-400 font-mono">{formatCurrency(m.current_cost)}</span>
                  <span className="text-slate-500">Inflation: {m.inflation_rate}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}