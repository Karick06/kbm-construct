type OverviewTrendPoint = {
  month: string;
  value: number;
  label: string;
};

type OverviewTrendChartProps = {
  eyebrow: string;
  title: string;
  summaryValue: string;
  summaryChange: string;
  summaryToneClassName?: string;
  points: OverviewTrendPoint[];
};

export default function OverviewTrendChart({
  eyebrow,
  title,
  summaryValue,
  summaryChange,
  summaryToneClassName = "text-green-400",
  points,
}: OverviewTrendChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-bold text-white">{title}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{summaryValue}</p>
            <p className={`text-xs ${summaryToneClassName}`}>{summaryChange}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex h-48 items-end justify-between gap-3">
        {points.map((point) => (
          <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-orange-400 transition-all hover:from-orange-400 hover:to-orange-300"
                style={{ height: `${(point.value / maxValue) * 180}px` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white">{point.label}</p>
              <p className="text-xs text-gray-500">{point.month}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { OverviewTrendPoint };
