'use client';

import { type ReactNode } from 'react';

type FloatingActionButtonProps = {
  onClick: () => void;
  icon?: ReactNode;
  label?: string;
  className?: string;
};

/**
 * Floating Action Button (FAB) for mobile - typically for primary actions
 */
export default function FloatingActionButton({ 
  onClick, 
  icon, 
  label = '+', 
  className = '' 
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-40
        flex items-center gap-2
        rounded-full 
        bg-[var(--accent)] 
        px-6 py-4
        text-white font-semibold text-lg
        shadow-2xl
        hover:bg-[var(--accent)]/90
        active:scale-95
        transition-all
        lg:hidden
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-label={typeof label === 'string' ? label : 'Action button'}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {label && <span className="text-base">{label}</span>}
    </button>
  );
}
