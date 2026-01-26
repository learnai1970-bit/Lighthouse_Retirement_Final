import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  inflationRate: number;
  setInflationRate: (rate: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [inflationRate, setInflationRate] = useState(6);

  useEffect(() => {
    const savedRate = localStorage.getItem('globalInflationRate');
    if (savedRate) {
      setInflationRate(parseFloat(savedRate));
    }
  }, []);

  const updateInflationRate = (rate: number) => {
    setInflationRate(rate);
    localStorage.setItem('globalInflationRate', rate.toString());
  };

  return (
    <SettingsContext.Provider value={{ inflationRate, setInflationRate: updateInflationRate }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
