import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calculator, Package, BookOpen, Vault, ArrowUpDown, User, Calendar, TrendingUp, IndianRupee, Wrench, Sparkles, Link, Target, Wallet, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  full_name: string;
  current_age: number;
  target_retirement_age: number;
}

export default function Sidebar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const milestonePlanner = [
    { path: '/milestone-navigator', name: 'Life Roadmap', icon: Target, color: 'text-amber-400' },
    { path: '/wealth-vault', name: 'Your Current Savings', icon: Link, color: 'text-blue-400' },
    { path: '/corpus-bridge', name: 'Corpus Bridge', icon: BarChart3, color: 'text-green-400' },
  ];

  const advancedTools = [
    { path: '/expenses', name: 'Expense Tracker', icon: Calculator },
    { path: '/architect', name: 'Expense Architect', icon: Wrench },
    { path: '/future-spend', name: 'Future Spend Journey', icon: TrendingUp },
    { path: '/lifecycle', name: 'Asset Lifecycle', icon: Package },
    { path: '/vault', name: 'Asset Vault', icon: Vault },
    { path: '/earnings', name: 'Future Earnings Statement', icon: IndianRupee },
    { path: '/library', name: 'The Truth Library', icon: BookOpen },
    { path: '/strategy', name: 'Withdrawal Waterfall', icon: ArrowUpDown },
  ];

  useEffect(() => {
    loadProfile();

    if (!supabase) return;

    const channel = supabase
      .channel('profile_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_profile'
      }, () => {
        loadProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProfile = async () => {
    try {
      if (!supabase) {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const data = JSON.parse(savedProfile);
          setProfile({
            full_name: data.full_name || 'User',
            current_age: data.current_age || 30,
            target_retirement_age: data.target_retirement_age || 60,
          });
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profile')
        .select('full_name, current_age, target_retirement_age')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const yearsToRetirement = profile
    ? profile.target_retirement_age - profile.current_age
    : 0;

  return (
    <div className="w-64 bg-slate-900 min-h-screen border-r border-slate-700 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Lighthouse</h1>
        <p className="text-sm text-slate-400">Retirement Planning</p>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
              isActive
                ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
              isActive
                ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <User size={20} />
          <span className="font-medium">User Profile</span>
        </NavLink>

        <div className="mt-6 mb-2 px-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Advanced Tools
          </div>
        </div>

        {advancedTools.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}

        <div className="mt-6 mb-2 px-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Future Milestone Expenses Simulator
          </div>
        </div>

        {milestonePlanner.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={20} className={item.color} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {profile && (
        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">
                  {profile.full_name || 'User'}
                </div>
                <div className="text-slate-400 text-xs">Profile</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
              <Calendar className="w-4 h-4 text-green-400" />
              <div className="flex-1">
                <div className="text-xs text-slate-400">Years to Retirement</div>
                <div className="text-lg font-bold text-green-400">
                  {yearsToRetirement > 0 ? yearsToRetirement : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
