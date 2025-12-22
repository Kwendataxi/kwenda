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
        const stepWidth = 48;
        scrollRef.current.scrollLeft = (currentIndex - 2) * stepWidth;
      }
    }
  }, [steps]);

  return (
    <div className={cn("py-4 bg-card/50 rounded-2xl mx-4", className)}>
      {/* Scrollable progress road */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center px-6 min-w-max py-2">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const hasReward = step.reward;
            
            return (
              <React.Fragment key={step.position}>
                {/* Connector line BEFORE step (except first) */}
                {index > 0 && (
                  <div 
                    className={cn(
                      "w-6 h-0.5 flex-shrink-0 transition-colors duration-300",
                      step.completed ? "bg-primary/60" : "bg-muted"
                    )}
                  />
                )}

                {/* Step circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative flex-shrink-0"
                >
                  {/* Circle/Icon */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center rounded-full transition-all duration-300",
                      hasReward ? "w-11 h-11" : "w-9 h-9",
                      step.completed 
                        ? "bg-primary text-primary-foreground shadow-md"
                        : step.isCurrent
                        ? "bg-white border-2 border-primary text-primary shadow-lg"
                        : "bg-white border border-border text-muted-foreground"
                    )}
                  >
                    {step.completed ? (
                      <Check className="h-4 w-4" />
                    ) : hasReward ? (
                      <motion.div
                        animate={step.isCurrent ? { 
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {step.reward === 'card' ? (
                          <Ticket className="h-4 w-4" />
                        ) : (
                          <Gift className="h-4 w-4" />
                        )}
                      </motion.div>
                    ) : (
                      <span className="text-[10px] font-medium">
                        {(index + 1) * 10}
                      </span>
                    )}

                    {/* Current position glow */}
                    {step.isCurrent && (
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-primary/30"
                      />
                    )}
                  </div>

                  {/* Reward label */}
                  {hasReward && (
                    <span className={cn(
                      "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap",
                      step.completed ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.reward === 'card' ? 'Carte' : '🎁'}
                    </span>
                  )}
                </motion.div>

                {/* Actions remaining badge (on last step) */}
                {isLast && !step.completed && (
                  <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="ml-4 flex-shrink-0"
                  >
                    <div className="flex items-center gap-1 bg-white shadow-sm border border-border px-3 py-1.5 rounded-full">
                      <span className="text-base font-bold text-foreground">{actionsRemaining}</span>
                      <span className="text-[10px] text-muted-foreground">restantes</span>
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-6 mt-4">
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>0%</span>
          <span className="text-primary font-semibold text-xs">{Math.round(percentage)}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
