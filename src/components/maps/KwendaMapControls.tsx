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
    <div className={cn("absolute top-4 right-4 flex flex-col gap-2 z-10", className)}>
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 bg-background/80 backdrop-blur-md rounded-lg border border-border/50 shadow-lg overflow-hidden">
        <Button
          size="sm"
          variant="ghost"
          onClick={onZoomIn}
          className="h-10 w-10 rounded-none hover:bg-primary/10 transition-all"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <div className="h-px bg-border/50" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onZoomOut}
          className="h-10 w-10 rounded-none hover:bg-primary/10 transition-all"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </Button>
      </div>

      {/* Location Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onLocate}
        disabled={isLocating}
        className={cn(
          "h-10 w-10 bg-background/80 backdrop-blur-md border-border/50 shadow-lg transition-all",
          isLocating && "animate-pulse"
        )}
        aria-label="Locate me"
      >
        <Navigation className={cn("h-5 w-5", isLocating && "animate-spin")} />
      </Button>

      {/* Map Type Toggle */}
      {onToggleMapType && (
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleMapType}
          className="h-10 w-10 bg-background/80 backdrop-blur-md border-border/50 shadow-lg transition-all"
          aria-label="Toggle map type"
        >
          {mapType === 'satellite' ? (
            <Layers className="h-5 w-5" />
          ) : (
            <Satellite className="h-5 w-5" />
          )}
        </Button>
      )}
    </div>
  );
}
