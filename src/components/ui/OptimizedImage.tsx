/**
 * 🖼️ OPTIMIZED IMAGE COMPONENT
 * Lazy loading natif + skeleton + transitions fluides
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // Pour les images above-the-fold
  objectFit?: 'cover' | 'contain' | 'fill';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  objectFit = 'cover'
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0" />
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Image non disponible</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            objectFit === 'cover' && "object-cover",
            objectFit === 'contain' && "object-contain",
            objectFit === 'fill' && "object-fill",
            loaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            willChange: loaded ? 'auto' : 'opacity',
            transform: 'translateZ(0)'
          }}
        />
      )}
    </div>
  );
};
