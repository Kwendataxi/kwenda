import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KwendaMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onToggleMapType?: () => void;
  isLocating?: boolean;
  mapType?: 'roadmap' | 'satellite' | 'hybrid';
  className?: string;
}

const KwendaMapControls = React.memo(({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleMapType,
  isLocating = false,
  mapType = 'roadmap',
  className
}: KwendaMapControlsProps) => {
  const [driverCount] = React.useState(12); // Simulé pour l'instant

  return (
    <div className={cn("absolute top-4 right-4 flex flex-col gap-3 z-10", className)}>
      {/* Zoom Controls - Glassmorphism optimisé */}
      <div className="flex flex-col gap-2">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            variant="ghost"
            onClick={onZoomIn}
            className="h-14 w-14 bg-card/95 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 hover:bg-accent transition-all"
            aria-label="Zoom in"
          >
            <Plus className="h-6 w-6 text-foreground" />
          </Button>
        </motion.div>
        
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            variant="ghost"
            onClick={onZoomOut}
            className="h-14 w-14 bg-card/95 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 hover:bg-accent transition-all"
            aria-label="Zoom out"
          >
            <Minus className="h-6 w-6 text-foreground" />
          </Button>
        </motion.div>
      </div>

      {/* Location Button - Rouge Kwenda avec badge */}
      <motion.div whileTap={{ scale: 0.95 }} className="relative">
        <Button
          size="lg"
          variant="ghost"
          onClick={onLocate}
          disabled={isLocating}
          className={cn(
            "h-14 w-14 bg-primary/95 backdrop-blur-md rounded-2xl shadow-xl border border-primary/50 hover:bg-primary transition-all",
            isLocating && "animate-pulse"
          )}
          aria-label="Ma position"
        >
          <Navigation className={cn(
            "h-6 w-6 text-primary-foreground",
            isLocating && "animate-spin"
          )} />
        </Button>
        
        {driverCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Badge className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5 shadow-md animate-pulse">
              {driverCount}
            </Badge>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});

KwendaMapControls.displayName = 'KwendaMapControls';

export default KwendaMapControls;
