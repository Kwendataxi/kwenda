import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface StickyProgressStepsProps {
  status: string;
  statusConfig: {
    label: string;
    color: string;
    icon: React.ComponentType<any>;
    description: string;
    progress: number;
  };
  bookingId: string;
}

const StickyProgressSteps: React.FC<StickyProgressStepsProps> = ({ 
  status, 
  statusConfig, 
  bookingId 
}) => {
  const steps = [
    { key: 'pending', label: 'Recherche', statuses: ['pending', 'driver_assigned', 'driver_en_route', 'pickup', 'in_progress', 'completed'] },
    { key: 'driver_assigned', label: 'Assigné', statuses: ['driver_assigned', 'driver_en_route', 'pickup', 'in_progress', 'completed'] },
    { key: 'driver_en_route', label: 'En route', statuses: ['driver_en_route', 'pickup', 'in_progress', 'completed'] },
    { key: 'pickup', label: 'Prise en charge', statuses: ['pickup', 'in_progress', 'completed'] },
    { key: 'in_progress', label: 'En cours', statuses: ['in_progress', 'completed'] },
    { key: 'completed', label: 'Terminée', statuses: ['completed'] }
  ];

  const getStepStatus = (step: any) => {
    if (step.statuses.includes(status)) return 'completed';
    if (status === step.key) return 'active';
    return 'pending';
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border/20 p-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${statusConfig.color}`}>
              <statusConfig.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{statusConfig.label}</h3>
              <p className="text-xs text-muted-foreground">{statusConfig.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            #{bookingId.slice(-6)}
          </Badge>
        </div>

        {/* Barre de progression */}
        <div className="mb-3">
          <Progress value={statusConfig.progress} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className="font-medium">{statusConfig.progress}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Étapes horizontales */}
        <div className="flex items-center justify-between relative">
          {/* Ligne de connexion */}
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-border -z-10" />
          
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step);
            return (
              <motion.div
                key={step.key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${getStepColor(stepStatus)} 
                  ${stepStatus === 'completed' ? 'text-white' : stepStatus === 'active' ? 'text-white' : 'text-muted-foreground'}
                  ${stepStatus === 'active' ? 'ring-2 ring-primary/30 animate-pulse' : ''}
                  transition-all duration-300
                `}>
                  {stepStatus === 'completed' ? '✓' : index + 1}
                </div>
                <span className={`
                  text-xs mt-1 text-center min-w-0 max-w-16
                  ${stepStatus === 'active' ? 'text-primary font-medium' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Indicateur temps réel */}
        {['driver_en_route', 'pickup', 'in_progress'].includes(status) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-3 p-2 bg-primary/5 rounded-md"
          >
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Suivi temps réel</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StickyProgressSteps;