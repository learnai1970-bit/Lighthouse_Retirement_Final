import { AlertTriangle } from 'lucide-react';
import { formatIndianNumber } from '../lib/calculations';

interface CashflowDataPoint {
  age: number;
  corpus: number;
  expenses: number;
}

interface LifetimeCashflowChartProps {
  data: CashflowDataPoint[];
  currentAge: number;
  lifeExpectancy: number;
  zeroDignityAge: number | null;
}

export default function LifetimeCashflowChart({
  data,
  currentAge,
  lifeExpectancy,
  zeroDignityAge,
}: LifetimeCashflowChartProps) {
  const filteredData = data.filter((d) => d.age >= currentAge);

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Add assets to see lifetime cashflow projection
      </div>
    );
  }

  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 120, bottom: 60, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minAge = currentAge;
  const maxAge = lifeExpectancy;
  const maxValue = Math.max(
    ...filteredData.map((d) => Math.max(d.corpus, d.expenses)),
    0
  );

  const xScale = (age: number) => ((age - minAge) / (maxAge - minAge)) * chartWidth;
  const yScale = (value: number) => chartHeight - (value / maxValue) * chartHeight;

  const corpusPath = filteredData
    .map((d, i) => {
      const x = xScale(d.age);
      const y = yScale(d.corpus);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const expensesPath = filteredData
    .map((d, i) => {
      const x = xScale(d.age);
      const y = yScale(d.expenses);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const xTicks = [];
  if (maxAge >= minAge) {
    for (let age = minAge; age <= maxAge; age += 10) {
      xTicks.push(age);
      if (xTicks.length > 100) break;
    }
  }

  const yTicks = [];
  const yStep = Math.max(Math.ceil(maxValue / 5 / 100000) * 100000, 1);
  if (maxValue > 0) {
    for (let value = 0; value <= maxValue; value += yStep) {
      yTicks.push(value);
      if (yTicks.length > 100) break;
    }
  } else {
    yTicks.push(0);
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Lifetime Cashflow Projection</h2>
        <p className="text-slate-400 text-sm">
          Corpus vs Compounded Expenses from Age {currentAge} to {lifeExpectancy}
        </p>
        {zeroDignityAge && (
          <div className="mt-3 flex items-center gap-2 bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-2">
            <AlertTriangle size={18} className="text-red-400" />
            <span className="text-red-400 font-semibold">
              Zero-Dignity Year: Age {zeroDignityAge}
            </span>
            <span className="text-slate-400 text-sm">
              - Corpus depleted at this age
            </span>
          </div>
        )}
        {!zeroDignityAge && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/50 rounded-lg px-4 py-2">
            <span className="text-emerald-400 font-semibold">
              Sustainable: Corpus lasts until age {lifeExpectancy}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          <g transform={`translate(${padding.left},${padding.top})`}>
            <rect
              x={0}
              y={0}
              width={chartWidth}
              height={chartHeight}
              fill="rgb(15, 23, 42)"
              stroke="rgb(51, 65, 85)"
              strokeWidth={1}
            />

            {yTicks.map((value) => (
              <g key={value}>
                <line
                  x1={0}
                  y1={yScale(value)}
                  x2={chartWidth}
                  y2={yScale(value)}
                  stroke="rgb(51, 65, 85)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={-10}
                  y={yScale(value)}
                  fill="rgb(148, 163, 184)"
                  fontSize={12}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatIndianNumber(value, true)}
                </text>
              </g>
            ))}

            {xTicks.map((age) => (
              <g key={age}>
                <line
                  x1={xScale(age)}
                  y1={0}
                  x2={xScale(age)}
                  y2={chartHeight}
                  stroke="rgb(51, 65, 85)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={xScale(age)}
                  y={chartHeight + 20}
                  fill="rgb(148, 163, 184)"
                  fontSize={12}
                  textAnchor="middle"
                >
                  {age}
                </text>
              </g>
            ))}

            {zeroDignityAge && (
              <line
                x1={xScale(zeroDignityAge)}
                y1={0}
                x2={xScale(zeroDignityAge)}
                y2={chartHeight}
                stroke="rgb(239, 68, 68)"
                strokeWidth={2}
                strokeDasharray="6 3"
              />
            )}

            <path d={corpusPath} fill="none" stroke="rgb(52, 211, 153)" strokeWidth={3} />

            <path d={expensesPath} fill="none" stroke="rgb(96, 165, 250)" strokeWidth={3} />

            <g transform={`translate(${chartWidth + 20}, 60)`}>
              <g>
                <line x1={0} y1={0} x2={30} y2={0} stroke="rgb(52, 211, 153)" strokeWidth={3} />
                <text x={40} y={5} fill="rgb(148, 163, 184)" fontSize={14}>
                  Corpus
                </text>
              </g>
              <g transform="translate(0, 30)">
                <line x1={0} y1={0} x2={30} y2={0} stroke="rgb(96, 165, 250)" strokeWidth={3} />
                <text x={40} y={5} fill="rgb(148, 163, 184)" fontSize={14}>
                  Expenses
                </text>
              </g>
              {zeroDignityAge && (
                <g transform="translate(0, 60)">
                  <line
                    x1={0}
                    y1={0}
                    x2={30}
                    y2={0}
                    stroke="rgb(239, 68, 68)"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                  />
                  <text x={40} y={5} fill="rgb(248, 113, 113)" fontSize={14}>
                    Depletion
                  </text>
                </g>
              )}
            </g>

            <text
              x={chartWidth / 2}
              y={chartHeight + 50}
              fill="rgb(148, 163, 184)"
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
            >
              Age (Years)
            </text>

            <text
              x={-chartHeight / 2}
              y={-60}
              fill="rgb(148, 163, 184)"
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
              transform={`rotate(-90, -${chartHeight / 2}, -60)`}
            >
              Value (₹)
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
