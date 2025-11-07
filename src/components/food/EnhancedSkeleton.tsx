import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const EnhancedFoodSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="
            bg-card dark:bg-card/95
            border-2 border-border/50 dark:border-border/80
            rounded-2xl overflow-hidden
            shadow-md dark:shadow-xl
          "
        >
          {/* Shimmer effect */}
          <div className="relative overflow-hidden">
            <Skeleton className="h-44 w-full bg-muted dark:bg-muted/80" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4 bg-muted dark:bg-muted/80" />
            <Skeleton className="h-4 w-1/2 bg-muted dark:bg-muted/70" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-24 bg-muted dark:bg-muted/80" />
              <Skeleton className="h-8 w-20 bg-muted dark:bg-muted/80 rounded-full" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const EnhancedDishSkeleton = () => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex-shrink-0 w-[160px]"
        >
          <div className="
            bg-card dark:bg-card/95
            border-2 border-border/50 dark:border-border/80
            rounded-xl overflow-hidden
            shadow-md dark:shadow-xl
          ">
            <div className="relative">
              <Skeleton className="h-28 w-full bg-muted dark:bg-muted/80" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-full bg-muted dark:bg-muted/80" />
              <Skeleton className="h-3 w-2/3 bg-muted dark:bg-muted/70" />
              <div className="flex justify-between items-center pt-1">
                <Skeleton className="h-4 w-16 bg-muted dark:bg-muted/80" />
                <Skeleton className="h-6 w-6 rounded-full bg-muted dark:bg-muted/80" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
