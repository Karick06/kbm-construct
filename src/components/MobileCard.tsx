'use client';

import { type ReactNode } from 'react';

type MobileCardProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

/**
 * Mobile-optimized card with touch-friendly sizing and spacing
 */
export default function MobileCard({ children, onClick, className = '' }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border border-[var(--line)] bg-[var(--surface)] 
        p-4 
        ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}
        transition-transform
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </div>
  );
}
