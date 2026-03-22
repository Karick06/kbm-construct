type OverviewStatItem = {
  label: string;
  value: string;
  change: string;
  icon: string;
  subtitle?: string;
};

type OverviewStatGridProps = {
  items: OverviewStatItem[];
};

export default function OverviewStatGrid({ items }: OverviewStatGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{stat.label}</p>
            <span className="text-xl">{stat.icon}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stat.value}</p>
          <p className="text-xs text-gray-400">{stat.change}</p>
          {stat.subtitle && <p className="text-xs text-gray-500">{stat.subtitle}</p>}
        </div>
      ))}
    </section>
  );
}

export type { OverviewStatItem };
