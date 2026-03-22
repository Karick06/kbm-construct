type StatTone = "sunset" | "sage" | "ocean" | "sand";

type StatCardProps = {
  label: string;
  value: string;
  change: string;
  tone?: StatTone;
};

const toneClasses: Record<StatTone, { border: string; icon: string }> = {
  sunset: { border: "border-l-[var(--accent)]", icon: "🏗️" },
  sage: { border: "border-l-[var(--accent-2)]", icon: "📋" },
  ocean: { border: "border-l-[var(--accent-3)]", icon: "⚠️" },
  sand: { border: "border-l-[var(--accent)]", icon: "🚜" },
};

export default function StatCard({
  label,
  value,
  change,
  tone = "sand",
}: StatCardProps) {
  const style = toneClasses[tone];
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border border-gray-600/65 border-l-4 ${style.border} bg-[#1f232a] px-4 py-3 shadow-[var(--shadow)] sm:gap-3 sm:px-5 sm:py-4`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          {label}
        </p>
        <span className="text-lg sm:text-xl">{style.icon}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">
        {value}
      </p>
      <p className="text-xs text-gray-200">{change}</p>
    </div>
  );
}
