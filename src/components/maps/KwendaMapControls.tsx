import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KwendaMapControlsProps {
  onLocate: () => void;
  isLocating?: boolean;
  className?: string;
}

const KwendaMapControls = React.memo(({
  onLocate,
  isLocating = false,
  className
}: KwendaMapControlsProps) => {
  return (
    <div className={cn("absolute bottom-28 right-4 z-10", className)}>
      {/* Location Button uniquement */}
      <motion.div whileTap={{ scale: 0.95 }}>
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
      </motion.div>
    </div>
  );
});

KwendaMapControls.displayName = 'KwendaMapControls';

export default KwendaMapControls;
