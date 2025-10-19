/**
 * 📍 PHASE 3: Tracker de progression de course
 */

import React from 'react';
import { CheckCircle, Circle, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RideProgressTrackerProps {
  status: string;
}

export const RideProgressTracker: React.FC<RideProgressTrackerProps> = ({ status }) => {
  const steps = [
    { key: 'accepted', label: 'Acceptée', icon: CheckCircle },
    { key: 'picked_up', label: 'Client à bord', icon: CheckCircle },
    { key: 'in_progress', label: 'En route', icon: Navigation },
    { key: 'completed', label: 'Terminée', icon: CheckCircle }
  ];

  const getStepIndex = (status: string) => {
    const statusMap: { [key: string]: number } = {
      'pending': 0,
      'accepted': 0,
      'driver_assigned': 0,
      'picked_up': 1,
      'in_transit': 2,
      'in_progress': 2,
      'completed': 3,
      'delivered': 3
    };
    return statusMap[status] || 0;
  };

  const currentStep = getStepIndex(status);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Progression</p>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                isCompleted && "bg-green-500 border-green-500",
                isCurrent && "bg-orange-500 border-orange-500 animate-pulse",
                !isCompleted && !isCurrent && "bg-gray-200 border-gray-300"
              )}>
                <Icon className={cn(
                  "h-4 w-4",
                  (isCompleted || isCurrent) ? "text-white" : "text-gray-400"
                )} />
              </div>
              <span className={cn(
                "text-[10px] mt-1 text-center",
                (isCompleted || isCurrent) ? "font-medium" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
