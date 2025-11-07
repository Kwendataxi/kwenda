/**
 * 🚗 Stats flottantes pour chauffeurs taxi
 */

import { Car, DollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaxiFloatingStatsProps {
  ridesCount: number;
  earnings: number;
  hoursOnline: number;
}

export const TaxiFloatingStats = ({ ridesCount, earnings, hoursOnline }: TaxiFloatingStatsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3 mb-6"
    >
      {/* Courses aujourd'hui */}
      <div className="service-card rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
          <Car className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{ridesCount}</p>
        <p className="text-xs text-muted-foreground">Courses</p>
      </div>

      {/* Gains aujourd'hui */}
      <div className="service-card rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
          <DollarSign className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{earnings}</p>
        <p className="text-xs text-muted-foreground">CDF</p>
      </div>

      {/* Heures en ligne */}
      <div className="service-card rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
          <Clock className="w-5 h-5 text-orange-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{hoursOnline}h</p>
        <p className="text-xs text-muted-foreground">En ligne</p>
      </div>
    </motion.div>
  );
};
