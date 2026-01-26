import { formatCurrency } from '../lib/calculations';

interface DignityGaugeProps {
  ratio: number;
  annualIncome: number;
  annualExpenses: number;
}

export default function DignityGauge({ ratio, annualIncome, annualExpenses }: DignityGaugeProps) {
  const percentage = Math.min(ratio * 100, 200);
  const angle = (percentage / 200) * 180;
  const radians = ((angle - 90) * Math.PI) / 180;
  const needleLength = 85;
  const needleX = 100 + needleLength * Math.cos(radians);
  const needleY = 100 + needleLength * Math.sin(radians);

  const getColor = () => {
    if (ratio >= 1.0) return '#10b981';
    if (ratio >= 0.7) return '#f59e0b';
    return '#ef4444';
  };

  const getStatus = () => {
    if (ratio >= 1.0) return 'Dignified Retirement';
    if (ratio >= 0.7) return 'Moderate Risk';
    return 'High Deficit';
  };

  const color = getColor();
  const circumference = 2 * Math.PI * 70;
  const greenArc = circumference * 0.25;
  const amberArc = circumference * 0.15;
  const redArc = circumference * 0.1;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Dignity Gauge</h3>

      <div className="relative flex items-center justify-center">
        <svg width="200" height="120" viewBox="0 0 200 120">
          <defs>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="20"
            strokeLinecap="round"
          />

          <path
            d="M 30 100 A 70 70 0 0 1 80 35"
            fill="none"
            stroke="url(#redGradient)"
            strokeWidth="20"
            strokeLinecap="round"
          />

          <path
            d="M 80 35 A 70 70 0 0 1 120 35"
            fill="none"
            stroke="url(#amberGradient)"
            strokeWidth="20"
            strokeLinecap="round"
          />

          <path
            d="M 120 35 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="url(#greenGradient)"
            strokeWidth="20"
            strokeLinecap="round"
          />

          <line
            x1="100"
            y1="100"
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill={color} />

          <text x="30" y="115" fill="#94a3b8" fontSize="10" textAnchor="middle">0.0</text>
          <text x="100" y="25" fill="#94a3b8" fontSize="10" textAnchor="middle">1.0</text>
          <text x="170" y="115" fill="#94a3b8" fontSize="10" textAnchor="middle">2.0</text>
        </svg>
      </div>

      <div className="text-center mt-4">
        <div className="text-3xl font-bold mb-1" style={{ color }}>
          {ratio.toFixed(2)}x
        </div>
        <div className="text-sm text-slate-400 mb-4">{getStatus()}</div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <div className="text-slate-400 text-xs mb-1">Annual Income / yr</div>
            <div className="font-mono text-green-400 font-semibold">
              {formatCurrency(annualIncome)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs mb-1">Total Annual Need / yr</div>
            <div className="font-mono text-red-400 font-semibold">
              {formatCurrency(annualExpenses)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
        <p>
          {ratio >= 1.0
            ? 'Your asset income covers your lifestyle expenses.'
            : 'Your expenses exceed asset income. You may need to draw from corpus.'}
        </p>
      </div>
    </div>
  );
}
