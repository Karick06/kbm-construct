import type { ReactNode } from 'react';

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * A responsive card component that adapts to mobile and desktop screens
 */
export default function ResponsiveCard({ children, className = '' }: ResponsiveCardProps) {
  return (
    <div className={`rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 shadow-[var(--shadow)] sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
