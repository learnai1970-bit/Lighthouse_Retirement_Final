import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Milestone, WealthBaseline } from '../lib/supabase';

interface FutureWealthContextType {
  milestones: Milestone[];
  wealthBaseline: WealthBaseline | null;
  totalFutureWishes: number;
  totalCurrentCorpus: number;
  preRetiralROI: number;
  postRetiralROI: number;
  loading: boolean;
  refresh: () => void;
}

const FutureWealthContext = createContext<FutureWealthContextType | undefined>(undefined);

export function FutureWealthProvider({ children }: { children: ReactNode }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [wealthBaseline, setWealthBaseline] = useState<WealthBaseline | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    try {
      let milestonesData: Milestone[] = [];
      let wealthData: WealthBaseline | null = null;

      if (supabase) {
        try {
          const { data: milestones } = await supabase
            .from('milestones')
            .select('*')
            .order('target_age');

          const { data: wealth } = await supabase
            .from('wealth_baseline')
            .select('*')
            .maybeSingle();

          milestonesData = milestones || [];
          wealthData = wealth;
        } catch (dbError) {
          console.warn('Database query failed, using localStorage fallback:', dbError);
        }
      }

      if (!supabase || milestonesData.length === 0) {
        const savedMilestones = localStorage.getItem('milestones');
        if (savedMilestones) {
          milestonesData = JSON.parse(savedMilestones);
        }
      }

      if (!supabase || !wealthData) {
        const savedWealth = localStorage.getItem('wealthBaseline');
        if (savedWealth) {
          wealthData = JSON.parse(savedWealth);
        }
      }

      setMilestones(milestonesData);
      setWealthBaseline(wealthData);
    } catch (error) {
      console.error('Error loading future wealth data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function calculateTotalFutureWishes(): number {
    const savedProfile = localStorage.getItem('userProfile');
    if (!savedProfile) return 0;

    const profile = JSON.parse(savedProfile);
    const currentAge = profile.current_age || 30;

    return milestones.reduce((sum, milestone) => {
      const yearsToTarget = milestone.target_age - currentAge;
      if (yearsToTarget < 0) return sum;

      const futureValue = milestone.current_cost * Math.pow(
        1 + milestone.inflation_rate / 100,
        yearsToTarget
      );
      return sum + futureValue;
    }, 0);
  }

  function calculateTotalCurrentCorpus(): number {
    if (!wealthBaseline) return 0;

    return (
      wealthBaseline.epf_ppf +
      wealthBaseline.mutual_funds_stocks +
      wealthBaseline.gold +
      wealthBaseline.cash
    );
  }

  const totalFutureWishes = calculateTotalFutureWishes();
  const totalCurrentCorpus = calculateTotalCurrentCorpus();
  const preRetiralROI = wealthBaseline?.pre_retiral_roi || 10.0;
  const postRetiralROI = wealthBaseline?.post_retiral_roi || 7.0;

  return (
    <FutureWealthContext.Provider
      value={{
        milestones,
        wealthBaseline,
        totalFutureWishes,
        totalCurrentCorpus,
        preRetiralROI,
        postRetiralROI,
        loading,
        refresh: loadData,
      }}
    >
      {children}
    </FutureWealthContext.Provider>
  );
}

export function useFutureWealth() {
  const context = useContext(FutureWealthContext);
  if (context === undefined) {
    throw new Error('useFutureWealth must be used within a FutureWealthProvider');
  }
  return context;
}
