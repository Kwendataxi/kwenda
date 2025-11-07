/**
 * 📊 Stats de performance réutilisables
 */

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface Stat {
  label: string;
  value: string | number;
  icon: string;
}

interface PerformanceStatsProps {
  stats: Stat[];
  serviceType: 'taxi' | 'delivery';
}

export const PerformanceStats = ({ stats, serviceType }: PerformanceStatsProps) => {
  const serviceColor = serviceType === 'taxi' ? 'blue' : 'green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Stats de performance</h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl bg-${serviceColor}-500/10 border border-${serviceColor}-500/20`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold text-${serviceColor}-500`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
