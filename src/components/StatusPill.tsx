export type StatusTone =
  | "on-track"
  | "risk"
  | "late"
  | "draft"
  | "paid"
  | "open";

type StatusPillProps = {
  label: string;
  tone: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
  "on-track": "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  risk: "border border-sky-400/30 bg-sky-500/15 text-sky-300",
  late: "border border-amber-400/30 bg-amber-500/15 text-amber-300",
  draft: "border border-gray-400/30 bg-gray-500/15 text-gray-200",
  paid: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  open: "border border-sky-400/30 bg-sky-500/15 text-sky-300",
};

export default function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
        toneClasses[tone]
      }`}
    >
      {label}
    </span>
  );
}
