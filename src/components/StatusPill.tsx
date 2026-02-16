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
  "on-track": "bg-[var(--accent-2-soft)] text-[var(--accent-2)]",
  risk: "bg-[var(--accent-3-soft)] text-[var(--accent-3)]",
  late: "bg-[var(--accent-soft)] text-[var(--accent)]",
  draft: "bg-[var(--surface-2)] text-[var(--muted)]",
  paid: "bg-[var(--accent-2-soft)] text-[var(--accent-2)]",
  open: "bg-[var(--accent-3-soft)] text-[var(--accent-3)]",
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
