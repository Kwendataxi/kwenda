import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Gift, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressStep } from '@/hooks/useScratchProgress';

interface ProgressRoadProps {
  steps: ProgressStep[];
  actionsRemaining: number;
  percentage: number;
  className?: string;
}

export const ProgressRoad: React.FC<ProgressRoadProps> = ({
  steps,
  actionsRemaining,
  percentage,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers la position actuelle
  useEffect(() => {
    if (scrollRef.current) {
      const currentIndex = steps.findIndex(s => s.isCurrent);
      if (currentIndex > 2) {
        const stepWidth = 56; // 14 * 4
        scrollRef.current.scrollLeft = (currentIndex - 2) * stepWidth;
      }
    }
  }, [steps]);

  return (
    <div className={cn("py-4", className)}>
      {/* Scrollable progress road */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar pb-2"
      >
        <div className="flex items-center gap-1 px-4 min-w-max">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const hasReward = step.reward;
            
            return (
              <React.Fragment key={step.position}>
                {/* Step circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index > 0 && (
                    <div 
                      className={cn(
                        "absolute right-full top-1/2 -translate-y-1/2 w-3 h-1 -mr-0.5",
                        step.completed ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}

                  {/* Circle/Icon */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center rounded-full transition-all duration-300",
                      hasReward ? "w-12 h-12" : "w-10 h-10",
                      step.completed 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : step.isCurrent
                        ? "bg-primary/20 border-2 border-primary text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.completed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Check className="h-5 w-5" />
                      </motion.div>
                    ) : hasReward ? (
                      <motion.div
                        animate={step.isCurrent ? { 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {step.reward === 'card' ? (
                          <Ticket className={cn(
                            "h-5 w-5",
                            step.isCurrent ? "text-primary" : "text-muted-foreground"
                          )} />
                        ) : (
                          <Gift className={cn(
                            "h-5 w-5",
                            step.isCurrent ? "text-primary" : "text-muted-foreground"
                          )} />
                        )}
                      </motion.div>
                    ) : (
                      <span className="text-xs font-medium">
                        {(index + 1) * 10}
                      </span>
                    )}

                    {/* Current position indicator */}
                    {step.isCurrent && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </motion.div>
                    )}
                  </div>

                  {/* Reward label */}
                  {hasReward && (
                    <span className={cn(
                      "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap",
                      step.completed ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.reward === 'card' ? '🎫 Carte' : '🎁'}
                    </span>
                  )}
                </motion.div>

                {/* Actions remaining badge (on last step) */}
                {isLast && !step.completed && (
                  <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="ml-2 flex-shrink-0"
                  >
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                      <span className="text-lg font-bold">{actionsRemaining}</span>
                      <span className="text-xs">actions</span>
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Progress bar underneath */}
      <div className="mx-4 mt-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-primary to-yellow-500 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>0</span>
          <span className="text-primary font-medium">{Math.round(percentage)}%</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};
