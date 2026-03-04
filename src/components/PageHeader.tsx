import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink)]">{title}</h1>
        <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
