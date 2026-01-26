import { useEffect, useState } from 'react';
import { Star, Wallet } from 'lucide-react';
import MilestoneNavigator from './MilestoneNavigator';
import WealthBaseline from './WealthBaseline';

export default function FutureAndWealth() {
  const [activeTab, setActiveTab] = useState<'milestones' | 'wealth'>('milestones');
  const [currentAge, setCurrentAge] = useState(30);

  useEffect(() => {
    loadUserProfile();
  }, []);

  function loadUserProfile() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        const age = profile.current_age || 30;
        setCurrentAge(age);

        if (age < 46) {
          setActiveTab('milestones');
        } else {
          setActiveTab('wealth');
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  return (
    <div className="bg-navy-950 min-h-screen">
      <div className="bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
        <div className="flex items-center justify-center gap-2 p-4">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-semibold ${
              activeTab === 'milestones'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Star size={20} />
            Milestone Navigator
            {currentAge < 46 && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Recommended
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('wealth')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-semibold ${
              activeTab === 'wealth'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Wallet size={20} />
            Wealth Baseline
            {currentAge >= 46 && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Recommended
              </span>
            )}
          </button>
        </div>
      </div>

      <div>{activeTab === 'milestones' ? <MilestoneNavigator /> : <WealthBaseline />}</div>
    </div>
  );
}
