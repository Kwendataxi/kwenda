import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Navigation, Satellite, Layers, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KwendaMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onToggleMapType?: () => void;
  isLocating?: boolean;
  mapType?: 'roadmap' | 'satellite' | 'hybrid';
  className?: string;
}

export default function KwendaMapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleMapType,
  isLocating = false,
  mapType = 'roadmap',
  className
}: KwendaMapControlsProps) {
  return (
    <div className={cn("absolute top-4 right-4 flex flex-col gap-3 z-10", className)}>
      {/* Zoom Controls - Style Glassmorphism Yango */}
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onZoomIn}
          className="h-12 w-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onZoomOut}
          className="h-12 w-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
      </div>

      {/* Location Button - Rouge Kwenda */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onLocate}
        disabled={isLocating}
        className={cn(
          "h-12 w-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all",
          isLocating && "animate-pulse"
        )}
        aria-label="Locate me"
      >
        <Navigation className={cn(
          "h-5 w-5",
          isLocating ? "animate-spin text-primary" : "text-primary"
        )} />
      </Button>

      {/* Map Type Toggle */}
      {onToggleMapType && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleMapType}
          className="h-12 w-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-all"
          aria-label="Toggle map type"
        >
          {mapType === 'satellite' ? (
            <Layers className="h-5 w-5 text-secondary" />
          ) : (
            <Satellite className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          )}
        </Button>
      )}
    </div>
  );
}
