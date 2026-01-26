import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AssetVaultItem, ExpenseSubcategory, Asset, ExpenseCategory } from '../lib/supabase';
import { MasterCashFlowEngine, YearProjection } from '../lib/masterProjection';

interface ProjectionContextType {
  projections: YearProjection[];
  engine: MasterCashFlowEngine | null;
  loading: boolean;
  refresh: () => void;
  baseYearLifestyleExpenses: number;
  baseYearSinkingFund: number;
  baseYearTotalNeed: number;
}

const ProjectionContext = createContext<ProjectionContextType | undefined>(undefined);

export function ProjectionProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<MasterCashFlowEngine | null>(null);
  const [projections, setProjections] = useState<YearProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseYearLifestyleExpenses, setBaseYearLifestyleExpenses] = useState(0);
  const [baseYearSinkingFund, setBaseYearSinkingFund] = useState(0);
  const [baseYearTotalNeed, setBaseYearTotalNeed] = useState(0);

  async function loadProjections() {
    setLoading(true);

    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (!savedProfile) {
        setLoading(false);
        return;
      }

      const profile = JSON.parse(savedProfile);

      let vaultAssets: AssetVaultItem[] = [];
      let lifecycleAssets: Asset[] = [];
      let categoriesData: ExpenseCategory[] = [];
      let subcategoriesData: ExpenseSubcategory[] = [];

      if (supabase) {
        try {
          const { data: vaultData } = await supabase
            .from('asset_vault_items')
            .select('*')
            .order('created_at');

          const { data: lifecycleData } = await supabase.from('assets').select('*');

          const { data: categories } = await supabase
            .from('expense_categories')
            .select('*')
            .order('sort_order');

          const { data: subcategories } = await supabase
            .from('expense_subcategories')
            .select('*')
            .order('sort_order');

          vaultAssets = vaultData || [];
          lifecycleAssets = lifecycleData || [];
          categoriesData = categories || [];
          subcategoriesData = subcategories || [];
        } catch (dbError) {
          console.warn('Database query failed, using localStorage fallback:', dbError);
        }
      }

      if (!supabase || vaultAssets.length === 0) {
        const savedVaultAssets = localStorage.getItem('vaultAssets');
        if (savedVaultAssets) {
          vaultAssets = JSON.parse(savedVaultAssets);
        }
      }

      if (!supabase || lifecycleAssets.length === 0) {
        const savedLifecycleAssets = localStorage.getItem('lifecycleAssets');
        if (savedLifecycleAssets) {
          lifecycleAssets = JSON.parse(savedLifecycleAssets);
        }
      }

      if (!supabase || categoriesData.length === 0) {
        const savedCategories = localStorage.getItem('expenseCategories');
        if (savedCategories) {
          categoriesData = JSON.parse(savedCategories);
        }
      }

      if (!supabase || subcategoriesData.length === 0) {
        const savedSubcategories = localStorage.getItem('expenseSubcategories');
        if (savedSubcategories) {
          subcategoriesData = JSON.parse(savedSubcategories);
        }
      }

      const healthCategoryId = categoriesData?.find(
        (cat: ExpenseCategory) => cat.name === 'Health'
      )?.id;

      const newEngine = new MasterCashFlowEngine({
        currentAge: profile.current_age || 30,
        retirementAge: profile.target_retirement_age || 60,
        lifeExpectancy: profile.life_expectancy || 95,
        baseInflation: profile.base_inflation || 6,
        healthInflation: profile.health_inflation || 10,
        vaultAssets: vaultAssets,
        lifecycleAssets: lifecycleAssets,
        expenses: subcategoriesData,
        healthCategoryId,
      });

      setEngine(newEngine);
      setProjections(newEngine.getProjections());
      setBaseYearLifestyleExpenses(newEngine.getBaseYearLifestyleExpenses());
      setBaseYearSinkingFund(newEngine.getBaseYearSinkingFund());
      setBaseYearTotalNeed(newEngine.getBaseYearTotalNeed());
    } catch (error) {
      console.error('Error loading projections:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjections();

    const handleProfileUpdate = () => {
      loadProjections();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  return (
    <ProjectionContext.Provider
      value={{
        projections,
        engine,
        loading,
        refresh: loadProjections,
        baseYearLifestyleExpenses,
        baseYearSinkingFund,
        baseYearTotalNeed,
      }}
    >
      {children}
    </ProjectionContext.Provider>
  );
}

export function useProjections() {
  const context = useContext(ProjectionContext);
  if (context === undefined) {
    throw new Error('useProjections must be used within a ProjectionProvider');
  }
  return context;
}
