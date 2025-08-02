import React, { useMemo } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { LazyLoadWrapper } from './LazyLoadWrapper';

interface OptimizedGridProps {
  children: React.ReactNode[];
  className?: string;
  itemsPerPage?: number;
  enableVirtualization?: boolean;
}

export const OptimizedGrid: React.FC<OptimizedGridProps> = ({
  children,
  className = '',
  itemsPerPage = 20,
  enableVirtualization = false
}) => {
  const { isSlowConnection, isLowMemory } = usePerformanceMonitor();

  // Reduce items for slow connections or low memory
  const optimizedItemCount = useMemo(() => {
    if (isSlowConnection || isLowMemory) {
      return Math.min(itemsPerPage / 2, children.length);
    }
    return Math.min(itemsPerPage, children.length);
  }, [isSlowConnection, isLowMemory, itemsPerPage, children.length]);

  const itemsToShow = useMemo(() => {
    return children.slice(0, optimizedItemCount);
  }, [children, optimizedItemCount]);

  if (enableVirtualization && (isSlowConnection || isLowMemory)) {
    // Simple virtualization: only render visible items
    return (
      <div className={`grid gap-4 ${className}`}>
        {itemsToShow.map((child, index) => (
          <LazyLoadWrapper key={index} threshold={0.2}>
            {child}
          </LazyLoadWrapper>
        ))}
        {children.length > optimizedItemCount && (
          <div className="col-span-full text-center p-4">
            <p className="text-sm text-muted-foreground">
              {children.length - optimizedItemCount} éléments supplémentaires masqués pour optimiser les performances
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {itemsToShow}
      {children.length > optimizedItemCount && (
        <div className="col-span-full text-center p-4">
          <p className="text-sm text-muted-foreground">
            Chargement optimisé: {optimizedItemCount} sur {children.length} éléments
          </p>
        </div>
      )}
    </div>
  );
};

export default OptimizedGrid;