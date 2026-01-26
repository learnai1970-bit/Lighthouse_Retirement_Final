import { useState, useEffect } from 'react';
import { TrendingUp, IndianRupee, MinusCircle, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useProjections } from '../contexts/ProjectionContext';
import { formatCurrency, formatPercentage } from '../lib/calculations';

export default function FutureEarningsStatement() {
  const { projections, loading } = useProjections();
  const [selectedYearIndex, setSelectedYearIndex] = useState(5);
  const [showYieldBreakdown, setShowYieldBreakdown] = useState(false);
  const [retirementAge, setRetirementAge] = useState(60);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setRetirementAge(profile.target_retirement_age || 60);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (projections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-950">
        <div className="text-slate-400">No projection data available. Please configure your profile and assets.</div>
      </div>
    );
  }

  const selectedProjection = projections[selectedYearIndex] || projections[0];

  return (
    <div className="p-8 bg-navy-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Future Earnings Statement</h1>
        <p className="text-slate-400">
          Year-by-year projection of corpus growth, yield, and expenses
        </p>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Select Projection Year</h2>
          <span className="text-slate-400 text-sm">
            Viewing: Year {selectedProjection.year} (Age {selectedProjection.age})
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={projections.length - 1}
          value={selectedYearIndex}
          onChange={(e) => setSelectedYearIndex(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Year 0 (Age {projections[0].age})</span>
          <span>Year {projections.length - 1} (Age {projections[projections.length - 1].age})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
            <IndianRupee size={16} />
            <span>Opening Corpus</span>
          </div>
          <div className="text-3xl font-bold text-blue-400 font-mono">
            {formatCurrency(selectedProjection.openingCorpus)}
          </div>
          <div className="text-slate-500 text-xs mt-2">
            Total liquid asset value at start of Year {selectedYearIndex}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
            <PlusCircle size={16} />
            <button
              onClick={() => setShowYieldBreakdown(!showYieldBreakdown)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>Projected Yield</span>
              {showYieldBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <div className="text-3xl font-bold text-green-400 font-mono">
            {formatCurrency(selectedProjection.projectedYield)}
          </div>
          <div className="text-slate-500 text-xs mt-2">
            Expected annual returns from all liquid assets
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
            <MinusCircle size={16} />
            <span>Projected Annual Outgo</span>
          </div>
          <div className="text-3xl font-bold text-orange-400 font-mono">
            {formatCurrency(selectedProjection.projectedAnnualOutgo)}
          </div>
          <div className="text-slate-500 text-xs mt-2">
            Lifestyle expenses + sinking fund provision
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
            <TrendingUp size={16} />
            <span>Closing Corpus</span>
          </div>
          <div className="text-3xl font-bold text-cyan-400 font-mono">
            {formatCurrency(selectedProjection.closingCorpus)}
          </div>
          <div className="text-slate-500 text-xs mt-2">
            Opening + Yield - Outgo
          </div>
        </div>
      </div>

      {showYieldBreakdown && selectedProjection.assetBreakdown.length > 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden mb-8">
          <div className="px-6 py-4 bg-slate-800 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Asset Yield Breakdown</h3>
            <p className="text-slate-400 text-sm mt-1">
              Detailed breakdown of projected returns by asset
            </p>
          </div>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Asset Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Category</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Asset Value</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Growth Rate</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Annual Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {selectedProjection.assetBreakdown.map((asset, index) => (
                  <tr key={index} className="hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-3 text-white">{asset.assetName}</td>
                    <td className="px-6 py-3 text-slate-400 capitalize">{asset.category.replace('_', ' ')}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-300">
                      {formatCurrency(asset.assetValue)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-blue-400">
                      {formatPercentage(asset.yieldPercent)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-green-400 font-semibold">
                      {formatCurrency(asset.yieldAmount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-800 font-semibold">
                  <td className="px-6 py-3 text-white" colSpan={4}>Total Projected Yield</td>
                  <td className="px-6 py-3 text-right font-mono text-green-400 text-lg">
                    {formatCurrency(selectedProjection.projectedYield)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">30-Year Projection Timeline</h2>
          <p className="text-slate-400 text-sm mt-1">
            Master cash flow array (Year 0 to Year 30)
          </p>
        </div>
        <div className="overflow-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full">
            <thead className="bg-slate-800 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Year</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Age</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Phase</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Opening Corpus</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Yield</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">
                  <div>Total Outgo</div>
                  <div className="text-xs text-slate-500 font-normal">(Lifestyle + Sinking Fund)</div>
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Closing Corpus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {projections.map((projection, index) => {
                const isAccumulation = projection.age < retirementAge;
                return (
                  <tr
                    key={index}
                    className={`hover:bg-slate-800 transition-colors ${
                      index === selectedYearIndex ? 'bg-blue-900 bg-opacity-20' : ''
                    } ${isAccumulation ? 'bg-green-900 bg-opacity-5' : 'bg-orange-900 bg-opacity-5'}`}
                    onClick={() => setSelectedYearIndex(index)}
                  >
                    <td className="px-6 py-3 text-slate-300 font-mono">{projection.year}</td>
                    <td className="px-6 py-3 text-white font-mono font-semibold">{projection.age}</td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          isAccumulation
                            ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                            : 'bg-orange-900/30 text-orange-400 border border-orange-700/50'
                        }`}
                      >
                        {isAccumulation ? 'Accumulation' : 'Distribution'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-blue-400">
                      {formatCurrency(projection.openingCorpus)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-green-400">
                      {formatCurrency(projection.projectedYield)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-orange-400">
                      {projection.projectedAnnualOutgo === 0 ? (
                        <span className="text-slate-600">₹0</span>
                      ) : (
                        formatCurrency(projection.projectedAnnualOutgo)
                      )}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-cyan-400 font-semibold">
                      {formatCurrency(projection.closingCorpus)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
        <div className="text-blue-300 text-sm">
          <strong>Master Cash Flow Logic - Liquid-Only Projection:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>Opening Corpus</strong>: Sum of LIQUID assets only (excludes Self-Use assets like primary residence, gold bars for personal use)
            </li>
            <li>
              <strong>Projected Yield</strong>: Includes both corpus growth (appreciation) AND yield income (rental, interest) from liquid assets only
            </li>
            <li>
              <strong>Accumulation Phase</strong> (Age &lt; {retirementAge}): Outgo = ₹0. Corpus grows via Opening Corpus + Yield only
            </li>
            <li>
              <strong>Distribution Phase</strong> (Age ≥ {retirementAge}): Total Outgo includes:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Lifestyle expenses (inflated category-wise: Health and Non-Health)</li>
                <li>Sinking fund for asset replacement (inflated at base rate)</li>
                <li>Both components compounded from current age to projection year</li>
              </ul>
            </li>
            <li>
              <strong>Closing Corpus</strong>: Opening + Yield - Outgo (self-use asset appreciation NOT included)
            </li>
            <li>All components synchronized through this single Master Cash Flow Array</li>
            <li>Check browser console for detailed breakdown of liquid vs self-use assets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
