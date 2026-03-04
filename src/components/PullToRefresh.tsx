'use client';

import { useState, useCallback, type ReactNode } from 'react';

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
};

/**
 * Pull-to-refresh wrapper for mobile lists
 */
export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    
    // Only trigger pull-to-refresh when at the top
    if (scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(threshold * 1.5, currentY - startY));
      setPullDistance(distance);
    }
  }, [startY, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(1, pullDistance / threshold);
  const rotation = progress * 360;

  return (
    <div 
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10"
          style={{ 
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
            opacity: progress 
          }}
        >
          <div 
            className={`text-2xl ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: isRefreshing ? '' : `rotate(${rotation}deg)` }}
          >
            🔄
          </div>
        </div>
      )}
      
      {/* Content */}
      <div style={{ paddingTop: pullDistance > 0 ? `${pullDistance}px` : '0' }}>
        {children}
      </div>
    </div>
  );
}
