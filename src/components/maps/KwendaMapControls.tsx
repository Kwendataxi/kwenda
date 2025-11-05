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
    <div className={cn("absolute bottom-36 right-4 z-[100]", className)}>
      {/* Location Button - Toujours visible */}
      <motion.div 
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <Button
          size="lg"
          variant="ghost"
          onClick={onLocate}
          disabled={isLocating}
          className={cn(
            "h-16 w-16 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
            "backdrop-blur-md rounded-full shadow-2xl",
            "border-2 border-white dark:border-gray-900",
            "transition-all duration-300",
            isLocating && "animate-pulse"
          )}
          aria-label="Ma position"
        >
          <Navigation className={cn(
            "h-7 w-7 text-white",
            isLocating && "animate-spin"
          )} />
        </Button>
      </motion.div>
    </div>
  );
});

KwendaMapControls.displayName = 'KwendaMapControls';

export default KwendaMapControls;
