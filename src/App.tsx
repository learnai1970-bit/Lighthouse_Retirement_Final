import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Pages - matching Sidebar.tsx paths to your actual files
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile'; // Path: /profile
import ExpenseTracker from './pages/ExpenseTracker'; // Path: /expenses
import ExpenseArchitect from './pages/ExpenseArchitect'; // Path: /architect
import FutureSpendJourney from './pages/FutureSpendJourney'; // Path: /future-spend
import AssetLifecycle from './pages/AssetLifecycle'; // Path: /lifecycle
import AssetVault from './pages/AssetVault'; // Path: /vault
import FutureEarningsStatement from './pages/FutureEarningsStatement'; // Path: /earnings
import TruthLibrary from './pages/TruthLibrary'; // Path: /library
import Strategy from './pages/Strategy'; // Path: /strategy
import MilestoneNavigator from './pages/MilestoneNavigator'; // Path: /milestone-navigator
import WealthVaultLinker from './pages/WealthVaultLinker_FIXED'; // Path: /wealth-vault
import CorpusBridge from './pages/CorpusBridge'; // Path: /corpus-bridge

// Components & Contexts
import TrialGuard from './components/TrialGuard';
import Layout from './components/Layout';
import { ProjectionProvider } from './contexts/ProjectionContext';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="bg-[#020617] h-screen flex items-center justify-center text-white">Initializing...</div>;

  return (
    <BrowserRouter>
      <SettingsProvider>
        <ProjectionProvider>
          <Routes>
            {!session ? (
              <Route path="*" element={<Login />} />
            ) : (
              <Route element={<TrialGuard><Layout /></TrialGuard>}>
                {/* Core Navigation */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<UserProfile />} />

                {/* Advanced Tools Group */}
                <Route path="/expenses" element={<ExpenseTracker />} />
                <Route path="/architect" element={<ExpenseArchitect />} />
                <Route path="/future-spend" element={<FutureSpendJourney />} />
                <Route path="/lifecycle" element={<AssetLifecycle />} />
                <Route path="/vault" element={<AssetVault />} />
                <Route path="/earnings" element={<FutureEarningsStatement />} />
                <Route path="/library" element={<TruthLibrary />} />
                <Route path="/strategy" element={<Strategy />} />

                {/* Milestone Simulator Group */}
                <Route path="/milestone-navigator" element={<MilestoneNavigator />} />
                <Route path="/wealth-vault" element={<WealthVaultLinker />} />
                <Route path="/corpus-bridge" element={<CorpusBridge />} />
                
                {/* Safety Net: Redirect any unknown URL to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </Routes>
        </ProjectionProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;