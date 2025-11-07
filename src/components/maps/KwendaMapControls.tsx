import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KwendaMapControlsProps {
  onLocate: () => void;
  isLocating?: boolean;
  bottomSheetHeight?: number;
  className?: string;
}

const KwendaMapControls = React.memo(({
  onLocate,
  isLocating = false,
  bottomSheetHeight = 450,
  className
}: KwendaMapControlsProps) => {
  // Position dynamique : hauteur du sheet + 24px de marge
  const buttonBottom = bottomSheetHeight + 24;

  return (
    <div 
      className={cn("absolute right-4 z-[100]", className)}
      style={{ bottom: `${buttonBottom}px` }}
    >
      {/* Location Button - Style moderne translucide */}
      <motion.div 
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          size="lg"
          variant="ghost"
          onClick={onLocate}
          disabled={isLocating}
          className={cn(
            "h-12 w-12 md:h-12 md:w-12",
            "bg-white/95 dark:bg-gray-800/95",
            "hover:bg-white dark:hover:bg-gray-700",
            "backdrop-blur-sm rounded-full shadow-lg",
            "border border-gray-200 dark:border-gray-700",
            "transition-all duration-300"
          )}
          aria-label="Recentrer sur ma position"
        >
          <Navigation className={cn(
            "h-5 w-5 text-gray-700 dark:text-gray-200",
            isLocating && "animate-spin"
          )} />
        </Button>
      </motion.div>
    </div>
  );
});

KwendaMapControls.displayName = 'KwendaMapControls';

export default KwendaMapControls;
