import { useEffect, useState } from 'react';
import { User, Calendar, TrendingUp, Percent, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase'; 

interface UserProfile {
  full_name: string;
  current_age: number;
  target_retirement_age: number;
  life_expectancy: number;
  base_inflation: number;
  health_inflation: number;
  child_1_age: number | null;
  child_2_age: number | null;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    current_age: 0,
    target_retirement_age: 65,
    life_expectancy: 85,
    base_inflation: 6,
    health_inflation: 10,
    child_1_age: null,
    child_2_age: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // 1. PRIMARY: Load from LocalStorage immediately for speed/stability
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }

      // 2. SYNC: Check if user is logged in and fetch cloud data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          // Update state and refresh LocalStorage with cloud data
          setProfile(data);
          localStorage.setItem('userProfile', JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // 1. SAFETY: Always save to LocalStorage first so formulas don't break
      localStorage.setItem('userProfile', JSON.stringify(profile));
      window.dispatchEvent(new Event('userProfileUpdated'));

      // 2. CLOUD BACKUP: Upsert data to Supabase profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: profile.full_name,
            current_age: profile.current_age,
            target_retirement_age: profile.target_retirement_age,
            life_expectancy: profile.life_expectancy,
            base_inflation: profile.base_inflation,
            health_inflation: profile.health_inflation,
            child_1_age: profile.child_1_age,
            child_2_age: profile.child_2_age,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      // We still show success if LocalStorage worked, but log the cloud error
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.clear(); 
      window.location.replace('/'); 
    } catch (error: any) {
      alert('Error during logout: ' + error.message);
    }
  };

  const yearsToRetirement = profile.target_retirement_age - profile.current_age;
  const yearsInRetirement = profile.life_expectancy - profile.target_retirement_age;
  const workingPercentage = profile.life_expectancy > 0
    ? ((profile.target_retirement_age - profile.current_age) / (profile.life_expectancy - profile.current_age)) * 100
    : 0;
  const retirementPercentage = profile.life_expectancy > 0
    ? ((profile.life_expectancy - profile.target_retirement_age) / (profile.life_expectancy - profile.current_age)) * 100
    : 0;

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Profile</h1>
        <p className="text-slate-400">Configure your personal information and retirement timeline</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Life Timeline */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Life Timeline
          </h2>
          <div className="space-y-4">
            <div className="relative h-16 bg-slate-900 rounded-lg overflow-hidden">
              <div className="absolute h-full bg-blue-500/30 border-r-2 border-blue-400" style={{ width: `${workingPercentage}%` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-200">Working Years</span>
                </div>
              </div>
              <div className="absolute h-full bg-green-500/30" style={{ left: `${workingPercentage}%`, width: `${retirementPercentage}%` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-green-200">Retirement</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-2 border border-blue-400">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div className="font-semibold text-white">{profile.current_age}</div>
                <div className="text-slate-400 text-xs">Current Age</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-2 border border-green-400">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="font-semibold text-white">{profile.target_retirement_age}</div>
                <div className="text-slate-400 text-xs">Retirement Age</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-slate-500/20 rounded-full flex items-center justify-center mb-2 border border-slate-400">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div className="font-semibold text-white">{profile.life_expectancy}</div>
                <div className="text-slate-400 text-xs">Life Expectancy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your full name" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Age</label>
                <input type="number" value={profile.current_age || ''} onChange={(e) => setProfile({ ...profile, current_age: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Target Retirement</label>
                <input type="number" value={profile.target_retirement_age || ''} onChange={(e) => setProfile({ ...profile, target_retirement_age: parseInt(e.target.value) || 65 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Life Expectancy</label>
                <input type="number" value={profile.life_expectancy || ''} onChange={(e) => setProfile({ ...profile, life_expectancy: parseInt(e.target.value) || 85 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="pt-4">
              <button onClick={saveProfile} disabled={saving} className={`w-full md:w-auto px-6 py-2 text-white rounded-lg font-medium transition-all ${showSuccess ? 'bg-green-600' : 'bg-blue-600'}`}>
                {showSuccess ? '✓ Saved Successfully!' : saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Family Information */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Family Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Child 1 Age</label>
              <input type="number" value={profile.child_1_age ?? ''} onChange={(e) => setProfile({ ...profile, child_1_age: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Child 2 Age</label>
              <input type="number" value={profile.child_2_age ?? ''} onChange={(e) => setProfile({ ...profile, child_2_age: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Inflation Assumptions */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Inflation Assumptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Base Inflation (%)</label>
              <input type="number" step="0.1" value={profile.base_inflation || ''} onChange={(e) => setProfile({ ...profile, base_inflation: parseFloat(e.target.value) || 6 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Health Inflation (%)</label>
              <input type="number" step="0.1" value={profile.health_inflation || ''} onChange={(e) => setProfile({ ...profile, health_inflation: parseFloat(e.target.value) || 10 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t border-slate-700/50">
          <div className="bg-red-500/5 rounded-lg p-6 border border-red-500/20">
            <h2 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Account Security
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Logging out will clear your session and require you to sign in again to access your data.
            </p>
            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-8 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout from Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}