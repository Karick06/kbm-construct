'use client';

import { type ReactNode, useEffect, useState } from 'react';

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Bottom sheet drawer for mobile forms and details
 */
export default function MobileDrawer({ isOpen, onClose, title, children, footer }: MobileDrawerProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 100) {
      onClose();
    }
    setCurrentY(0);
    setStartY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 lg:bg-black/40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[90vh] bg-[var(--sidebar-bg)] rounded-t-2xl shadow-2xl transform transition-transform lg:inset-0 lg:m-auto lg:max-w-2xl lg:max-h-[85vh] lg:rounded-2xl"
        style={{ 
          transform: `translateY(${currentY}px)`,
          WebkitTapHighlightColor: 'transparent'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar for swiping */}
        <div className="flex justify-center pt-3 pb-2 lg:hidden">
          <div className="w-12 h-1.5 rounded-full bg-[var(--line)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <h2 className="text-xl font-bold text-[var(--sidebar-text)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--sidebar-text)]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-[var(--line)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
