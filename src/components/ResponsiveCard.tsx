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
    <div className={`app-panel rounded-lg p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
