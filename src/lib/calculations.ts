// --- CONSTANTS ---
export const INFLATION_MIN = 6;
export const INFLATION_MAX = 15;
export const INFLATION_DEFAULT = 9;
export const ASSET_INFLATION = 6;
export const PROJECTION_END = 85;
export const RETIREMENT_START = 60;
export const PROJECTION_YEARS_DEFAULT = 25;

// --- CORE CALCULATION ENGINE (NEW LOGIC) ---

export function calculateFutureCost(currentCost: number, inflationRate: number, years: number): number {
  return currentCost * Math.pow(1 + inflationRate / 100, years);
}

export function calculateLifecycleProvision(assets: any[], userCurrentAge: number) {
  const planningHorizon = PROJECTION_END - RETIREMENT_START;
  if (!assets || assets.length === 0) return { annualProvision: 0, totalLiability: 0 };

  let totalLiability = 0;
  assets.forEach(asset => {
    const cost = Number(asset.replacement_cost) || 0;
    const qty = Number(asset.quantity) || 1;
    const life = Number(asset.useful_life) || 1;
    const age = Number(asset.current_age) || 0;
    
    const remainingLife = life - age;
    let nextAge = userCurrentAge + remainingLife;

    while (nextAge <= PROJECTION_END) {
      if (nextAge >= RETIREMENT_START) {
        const yearsFromNow = nextAge - userCurrentAge;
        totalLiability += (cost * qty) * Math.pow(1 + ASSET_INFLATION / 100, yearsFromNow);
      }
      nextAge += life;
    }
  });

  return { 
    annualProvision: planningHorizon > 0 ? totalLiability / planningHorizon : 0, 
    totalLiability 
  };
}

// --- DASHBOARD & LEGACY UTILITIES (REQUIRED BY OTHER FILES) ---

export function calculateLifetimeReplacementProvision(
  currentPrice: number,
  quantity: number,
  usefulLife: number,
  inflationRate: number,
  currentAge: number,
  lifeExpectancy: number
): number {
  const totalYears = lifeExpectancy - currentAge;
  if (totalYears <= 0) return 0;

  let totalFutureCost = 0;
  let nextReplacementYear = usefulLife;

  while (nextReplacementYear <= totalYears) {
    const futureCost = calculateFutureCost(currentPrice * quantity, inflationRate, nextReplacementYear);
    totalFutureCost += futureCost;
    nextReplacementYear += usefulLife;
  }

  return totalFutureCost / totalYears;
}

export function calculateActualYield(
  assetValue: number,
  category: string,
  growthRate: number,
  rentalYieldPercent?: number | null
): number {
  if (!rentalYieldPercent || rentalYieldPercent <= 0) return 0;
  return (assetValue * rentalYieldPercent) / 100;
}

// --- FORMATTING UTILITIES ---

export function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatIndianNumber(value: number, compact: boolean = false): string {
  if (compact) {
    const absValue = Math.abs(value);
    if (absValue >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (absValue >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (absValue >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export const formatPercentage = (v: number) => `${v.toFixed(1)}%`;
export const formatRatio = (v: number) => `${v.toFixed(2)}x`;

// --- ASSET & INCOME UTILITIES ---

export const calculateGoldValue = (g: number, r: number) => g * r;
export const calculateRealEstateRentalIncome = (v: number, y: number) => (v * (y || 0)) / 100;
export const calculateMonthlyRent = (v: number, y: number) => (v * (y || 0) / 100) / 12;
export const calculateAnnualGrowthIncome = (v: number, g: number) => (v * (g || 0)) / 100;
export const calculateAnnualYieldIncome = (v: number, y: number) => (v * (y || 0) / 100);
export const calculateFutureAssetValue = (v: number, g: number, y: number) => v * Math.pow(1 + g / 100, y);

export function calculateAssetFutureReplacement(p: number, q: number, l: number, i: number = INFLATION_DEFAULT) {
  const cost = p * Math.pow(1 + i / 100, l) * q;
  return { futureCost: cost, monthlySavings: cost / (l * 12) };
}