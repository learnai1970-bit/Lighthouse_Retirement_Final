import { formatIndianNumber } from '../lib/calculations';

interface CorpusSegment {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface CorpusPieChartProps {
  segments: CorpusSegment[];
}

export default function CorpusPieChart({ segments }: CorpusPieChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  if (total === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Net Worth Distribution</h3>
        <div className="flex items-center justify-center h-64 text-slate-500">
          No assets added yet
        </div>
      </div>
    );
  }

  let currentAngle = -90;
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(start);
    const y1 = centerY + radius * Math.sin(start);
    const x2 = centerX + radius * Math.cos(end);
    const y2 = centerY + radius * Math.sin(end);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const segmentsWithAngles = segments.map((segment) => {
    const percentage = (segment.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...segment,
      percentage,
      startAngle,
      endAngle,
    };
  });

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Net Worth Distribution</h3>

      <div className="flex items-center justify-between gap-8">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {segmentsWithAngles.map((segment, index) => (
              <path
                key={index}
                d={createArc(segment.startAngle, segment.endAngle)}
                fill={segment.color}
                stroke="#0f172a"
                strokeWidth="2"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              />
            ))}
            <circle cx="100" cy="100" r="45" fill="#1e293b" />
            <text
              x="100"
              y="95"
              textAnchor="middle"
              fill="#fff"
              fontSize="12"
              fontWeight="bold"
            >
              Total
            </text>
            <text
              x="100"
              y="110"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="14"
              fontWeight="bold"
            >
              {formatIndianNumber(total, true)}
            </text>
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          {segmentsWithAngles.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <div>
                  <div className="text-white text-sm font-medium">{segment.name}</div>
                  <div className="text-slate-400 text-xs">
                    {segment.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-white text-sm font-semibold">
                  {formatIndianNumber(segment.value, true)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-400">
        <p>Diversification across asset classes helps manage risk and optimize returns.</p>
      </div>
    </div>
  );
}
