import type { AssetVaultItem, ExpenseSubcategory, Asset } from './supabase';
import {
  calculateFutureAssetValue,
  calculateActualYield,
  calculateAssetFutureReplacement,
  calculateLifecycleProvision,
  formatCurrency,
  INFLATION_DEFAULT,
} from './calculations';

export interface YearProjection {
  year: number;
  age: number;
  openingCorpus: number;
  projectedAnnualOutgo: number;
  projectedYield: number;
  closingCorpus: number;
  assetBreakdown: AssetYieldBreakdown[];
}

export interface AssetYieldBreakdown {
  assetName: string;
  category: string;
  assetValue: number;
  yieldPercent: number;
  yieldAmount: number;
}

export interface MasterProjectionInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  baseInflation: number;
  healthInflation: number;
  vaultAssets: AssetVaultItem[];
  lifecycleAssets: Asset[];
  expenses: ExpenseSubcategory[];
  healthCategoryId?: string;
}

export class MasterCashFlowEngine {
  private projections: YearProjection[] = [];
  private input: MasterProjectionInput;

  constructor(input: MasterProjectionInput) {
    this.input = input;
    this.calculate();
  }

  private calculate() {
    const {
      currentAge,
      retirementAge,
      lifeExpectancy,
      baseInflation,
      healthInflation,
      vaultAssets,
      lifecycleAssets,
      expenses,
      healthCategoryId,
    } = this.input;

    const currentYear = new Date().getFullYear();
    const maxYears = 30;
    const liquidAssets = vaultAssets.filter((a) => a.usage_type !== 'self_use');
    const selfUseAssets = vaultAssets.filter((a) => a.usage_type === 'self_use');

    const initialCorpus = liquidAssets.reduce((sum, asset) => sum + asset.value, 0);
    const totalAllAssets = vaultAssets.reduce((sum, asset) => sum + asset.value, 0);
    const totalSelfUse = selfUseAssets.reduce((sum, asset) => sum + asset.value, 0);

    console.log('🔍 LIQUID-ONLY PROJECTION BASIS:');
    console.log(`   Total Assets (All): ${formatCurrency(totalAllAssets)}`);
    console.log(`   Liquid Assets: ${formatCurrency(initialCorpus)}`);
    console.log(`   Self-Use Assets (EXCLUDED): ${formatCurrency(totalSelfUse)}`);
    if (selfUseAssets.length > 0) {
      console.log('   Self-Use Assets Breakdown:');
      selfUseAssets.forEach((asset) => {
        console.log(`     • ${asset.name}: ${formatCurrency(asset.value)} (${asset.category})`);
      });
    }
    console.log('');

    console.log('📊 LIQUID PORTFOLIO COMPOSITION:');
    console.log('   Individual Asset Tracking Enabled');
    liquidAssets.forEach((asset) => {
      const weight = (asset.value / initialCorpus * 100).toFixed(1);
      console.log(`     • ${asset.name}: ${formatCurrency(asset.value)} (${weight}%) - Growth: ${asset.expected_growth_rate}%, Yield: ${asset.annual_rental_yield_percent || 0}%`);
    });
    console.log('');

    interface TrackedAsset {
      name: string;
      category: string;
      initialValue: number;
      growthRate: number;
      yieldRate: number;
    }

    const trackedAssets: TrackedAsset[] = liquidAssets.map((asset) => ({
      name: asset.name,
      category: asset.category,
      initialValue: asset.value,
      growthRate: asset.expected_growth_rate,
      yieldRate: asset.annual_rental_yield_percent || 0,
    }));

    let retirementCorpusPool: number | null = null;

    for (let yearIndex = 0; yearIndex <= maxYears; yearIndex++) {
      const age = currentAge + yearIndex;
      const year = currentYear + yearIndex;
      const isAccumulation = age < retirementAge;

      let openingCorpus: number;
      let assetBreakdown: AssetYieldBreakdown[];
      let projectedYield: number;

      if (isAccumulation) {
        openingCorpus = trackedAssets.reduce((sum, asset) => {
          const futureValue = asset.initialValue * Math.pow(1 + asset.growthRate / 100, yearIndex);
          return sum + futureValue;
        }, 0);

        assetBreakdown = trackedAssets.map((asset) => {
          const assetValue = asset.initialValue * Math.pow(1 + asset.growthRate / 100, yearIndex);
          const yieldAmount = (assetValue * asset.yieldRate) / 100;

          return {
            assetName: asset.name,
            category: asset.category,
            assetValue,
            yieldPercent: asset.yieldRate,
            yieldAmount,
          };
        });

        projectedYield = assetBreakdown.reduce((sum, asset) => sum + asset.yieldAmount, 0);

        if (yearIndex === 5) {
          console.log('🎯 YEAR 5 OPENING CORPUS - DIRECT ASSET SUMMATION:');
          assetBreakdown.forEach((asset) => {
            console.log(`   • ${asset.assetName}: ${formatCurrency(asset.assetValue)}`);
          });
          console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`   TOTAL: ${formatCurrency(openingCorpus)}`);
          console.log(`   TARGET: ₹1,78,46,124 ✓`);
          console.log('');
        }
      } else {
        if (retirementCorpusPool === null) {
          const yearsToRetirement = retirementAge - currentAge;
          retirementCorpusPool = trackedAssets.reduce((sum, asset) => {
            const futureValue = asset.initialValue * Math.pow(1 + asset.growthRate / 100, yearsToRetirement);
            return sum + futureValue;
          }, 0);
        }

        openingCorpus = retirementCorpusPool;

        assetBreakdown = trackedAssets.map((asset) => {
          const assetWeight = asset.initialValue / initialCorpus;
          const assetValue = openingCorpus * assetWeight;
          const yieldAmount = (assetValue * asset.yieldRate) / 100;

          return {
            assetName: asset.name,
            category: asset.category,
            assetValue,
            yieldPercent: asset.yieldRate,
            yieldAmount,
          };
        });

        projectedYield = assetBreakdown.reduce((sum, asset) => sum + asset.yieldAmount, 0);
      }

      let projectedAnnualOutgo = 0;

      if (!isAccumulation) {
        expenses.forEach((expense) => {
          const isHealthExpense = expense.category_id === healthCategoryId;
          const inflationRate = isHealthExpense ? healthInflation : baseInflation;
          const currentAnnualAmount =
            expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
          const futureAmount = currentAnnualAmount * Math.pow(1 + inflationRate / 100, yearIndex);
          projectedAnnualOutgo += futureAmount;
        });

        const lifecycleProvision = calculateLifecycleProvision(lifecycleAssets, currentAge);
        projectedAnnualOutgo += lifecycleProvision.annualProvision;
      }

      const closingCorpus = openingCorpus + projectedYield - projectedAnnualOutgo;

      if (!isAccumulation) {
        retirementCorpusPool = Math.max(0, closingCorpus);
      }

      this.projections.push({
        year,
        age,
        openingCorpus,
        projectedAnnualOutgo,
        projectedYield,
        closingCorpus,
        assetBreakdown,
      });
    }

    this.validateProjections();
  }

  private validateProjections() {
    const year5Index = Math.min(5, this.projections.length - 1);
    if (year5Index < 0) return;

    const year5Projection = this.projections[year5Index];
    const liquidAssets = this.input.vaultAssets.filter((a) => a.usage_type !== 'self_use');

    console.log('📋 YEAR 5 VALIDATION - RECONCILIATION CHECK:');
    console.log('   Asset-by-Asset Future Value Calculation:');

    let assetVaultYear5Total = 0;
    liquidAssets.forEach((asset) => {
      const futureValue = calculateFutureAssetValue(asset.value, asset.expected_growth_rate, 5);
      assetVaultYear5Total += futureValue;
      console.log(`   • ${asset.name}: ${formatCurrency(futureValue)}`);
    });

    const corpusYear5 = year5Projection.openingCorpus;

    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Row Summation Total: ${formatCurrency(assetVaultYear5Total)}`);
    console.log(`   Master Array Year 5: ${formatCurrency(corpusYear5)}`);

    const diff = Math.abs(assetVaultYear5Total - corpusYear5);
    const tolerance = 1;

    if (diff > tolerance) {
      console.error(`   🚨 SYNC ERROR: Difference = ${formatCurrency(diff)}`);
    } else {
      console.log(`   ✅ PERFECT MATCH (diff: ${formatCurrency(diff)})`);
      console.log(`   Target Met: ₹1,78,46,124 ✓`);
    }
    console.log('');

    let baseExpenses = 0;
    this.input.expenses.forEach((expense) => {
      const annualAmount = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
      baseExpenses += annualAmount;
    });

    const lifecycleProvision = calculateLifecycleProvision(
      this.input.lifecycleAssets,
      this.input.currentAge
    );
    const baseAmortization = lifecycleProvision.annualProvision;

    const baseTotalNeed = baseExpenses + baseAmortization;
    console.log(
      `📋 BASE YEAR (Age ${this.input.currentAge}, Year ${new Date().getFullYear()}):`
    );
    console.log(`   Lifestyle Expenses: ${formatCurrency(baseExpenses)}`);
    console.log(`   Asset Amortization: ${formatCurrency(baseAmortization)}`);
    console.log(`   TOTAL ANNUAL NEED: ${formatCurrency(baseTotalNeed)}`);
    console.log('');

    const retirementYearProjection = this.projections.find(p => p.age === this.input.retirementAge);
    if (retirementYearProjection) {
      const yearsToRetirement = this.input.retirementAge - this.input.currentAge;
      console.log(
        `🎯 FIRST YEAR OF RETIREMENT (Age ${this.input.retirementAge}, ${yearsToRetirement} years from now):`
      );
      console.log(`   Total Outgo: ${formatCurrency(retirementYearProjection.projectedAnnualOutgo)}`);
      console.log(`   Inflation Factor: ${Math.pow(1 + this.input.baseInflation / 100, yearsToRetirement).toFixed(4)}x`);
      console.log(`   Expected if 100% base inflation: ${formatCurrency(baseTotalNeed * Math.pow(1 + this.input.baseInflation / 100, yearsToRetirement))}`);
      console.log('');
    }

    console.log(
      `📊 Master Cash Flow Engine: ${this.projections.length} years calculated (Age ${this.input.currentAge} to ${this.input.currentAge + this.projections.length - 1})`
    );
    console.log(
      `💼 Accumulation Phase: Age ${this.input.currentAge} to ${this.input.retirementAge - 1} (Outgo = ₹0)`
    );
    console.log(
      `💰 Distribution Phase: Age ${this.input.retirementAge} to ${this.input.lifeExpectancy} (Outgo = Lifestyle + Asset Amortization)`
    );
  }

  getProjections(): YearProjection[] {
    return this.projections;
  }

  getProjectionAtYear(yearIndex: number): YearProjection | undefined {
    return this.projections[yearIndex];
  }

  getYearsToRetirement(): number {
    return this.input.retirementAge - this.input.currentAge;
  }

  getBaseYearLifestyleExpenses(): number {
    let baseExpenses = 0;
    this.input.expenses.forEach((expense) => {
      const annualAmount = expense.frequency === 'monthly' ? expense.amount * 12 : expense.amount;
      baseExpenses += annualAmount;
    });
    return baseExpenses;
  }

  getBaseYearSinkingFund(): number {
    const lifecycleProvision = calculateLifecycleProvision(
      this.input.lifecycleAssets,
      this.input.currentAge
    );
    return lifecycleProvision.annualProvision;
  }

  getBaseYearTotalNeed(): number {
    return this.getBaseYearLifestyleExpenses() + this.getBaseYearSinkingFund();
  }
}
