import { TrendingUp, Scale, AlertTriangle } from 'lucide-react';

export default function TruthLibrary() {
  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">The Truth Library</h1>
        <p className="text-slate-400">Core principles for sustainable retirement planning</p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <TrendingUp className="text-blue-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">The 9% Deterministic Philosophy</h2>
              <p className="text-blue-400 text-sm font-semibold">Foundation of Lighthouse Retirement</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              At the heart of Lighthouse Retirement lies a simple yet powerful principle: <span className="text-white font-semibold">planning for certainty, not probability</span>. While most financial projections rely on optimistic market averages of 10-12%, we anchor our calculations at 9% for equity growth.
            </p>

            <p>
              <span className="text-blue-400 font-semibold">Why 9%?</span> This conservative rate provides a margin of safety. Historical data shows that over long periods, equity markets have delivered returns around 10-11%. By planning for 9%, you build in a buffer against sequence risk, market volatility, and unexpected downturns.
            </p>

            <p>
              <span className="text-white font-semibold">Deterministic thinking means:</span>
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Planning as if 9% is guaranteed, not a probability distribution</li>
              <li>Any returns above 9% become your safety cushion and legacy wealth</li>
              <li>You make decisions based on worst-case sustainable scenarios</li>
              <li>Your Survival Ratio becomes a reliable measure of retirement readiness</li>
            </ul>

            <p className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
              <span className="text-blue-400 font-semibold">The Result:</span> If your plan works at 9% growth, you're genuinely prepared for retirement. Any excess becomes wealth you can confidently pass to the next generation.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-amber-500/10 p-3 rounded-lg">
              <Scale className="text-amber-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Why Grams Matter for Gold</h2>
              <p className="text-amber-400 text-sm font-semibold">Thinking Beyond Currency Fluctuations</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Gold is unique among assets because <span className="text-white font-semibold">its value is intrinsic to its weight, not its price</span>. While the dollar price of gold fluctuates with currency strength, inflation, and market sentiment, the underlying reality is simpler: you own a specific quantity of physical metal.
            </p>

            <p>
              <span className="text-amber-400 font-semibold">Weight-Based Thinking:</span>
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><span className="font-semibold">100 grams of gold is 100 grams</span> - regardless of whether it's worth ₹6,00,000 or ₹8,00,000 today</li>
              <li>Over decades, gold typically appreciates at 6-8% annually in dollar terms</li>
              <li>This appreciation reflects currency debasement more than true value increase</li>
              <li>By tracking grams, you think in terms of real wealth, not nominal currency</li>
            </ul>

            <p>
              <span className="text-white font-semibold">In Lighthouse Retirement:</span> When you enter gold holdings by weight and rate, we project future value by compounding the rate per gram. This gives you a realistic picture of gold's purchasing power at retirement, independent of short-term price swings.
            </p>

            <p className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mt-4">
              <span className="text-amber-400 font-semibold">Legacy Perspective:</span> At age 90, you still own those same grams. The Terminal Value calculation shows what that physical metal will likely be worth in future dollars - a true store of wealth across generations.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-red-500/10 p-3 rounded-lg">
              <AlertTriangle className="text-red-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">The Sequence of Returns Risk</h2>
              <p className="text-red-400 text-sm font-semibold">Why Timing Matters More Than Average Returns</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Here's a sobering truth: <span className="text-white font-semibold">two portfolios with identical average returns can have vastly different outcomes</span> if the timing of gains and losses differs. This is called sequence of returns risk, and it's the silent killer of retirement plans.
            </p>

            <p>
              <span className="text-red-400 font-semibold">The Problem:</span>
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>If you experience a market crash early in retirement, you're forced to sell assets at low prices</li>
              <li>This permanently reduces your corpus, even if markets recover later</li>
              <li>The same crash occurring 10 years into retirement has far less impact</li>
              <li>Average return calculations ignore this timing risk entirely</li>
            </ul>

            <p>
              <span className="text-white font-semibold">Real World Example:</span> Portfolio A experiences 20% returns for 5 years, then -10% for 2 years. Portfolio B experiences -10% for 2 years, then 20% for 5 years. If both withdraw the same amount annually, Portfolio A will significantly outperform Portfolio B, despite identical average returns.
            </p>

            <p>
              <span className="text-red-400 font-semibold">How Lighthouse Addresses This:</span>
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><span className="font-semibold">The Withdrawal Waterfall</span> lets you set liquidation priority, protecting high-growth assets</li>
              <li><span className="font-semibold">The Survival Ratio</span> ensures your yields cover expenses before touching corpus</li>
              <li><span className="font-semibold">Conservative 9% projections</span> build in buffer against early downturn scenarios</li>
              <li><span className="font-semibold">Sthiti Engine visualization</span> shows exactly when corpus depletion might occur</li>
            </ul>

            <p className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mt-4">
              <span className="text-red-400 font-semibold">The Takeaway:</span> Don't retire until your Survival Ratio exceeds 1.0. This means your asset yields alone can sustain you, insulating you from sequence risk. The corpus becomes your safety net, not your primary income source.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-700/50 p-6">
        <h3 className="text-white font-semibold mb-3 text-lg">Integrating These Principles</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          These three truths work together to create a robust retirement framework. The 9% deterministic philosophy sets your baseline expectations. Weight-based gold thinking preserves real wealth beyond currency fluctuations. And understanding sequence risk drives your liquidation strategy and timing decisions. Together, they transform retirement from hopeful speculation into engineered certainty.
        </p>
      </div>
    </div>
  );
}
