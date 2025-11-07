/**
 * 📦 Stats flottantes pour livreurs
 */

import { Package, DollarSign, Box } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeliveryFloatingStatsProps {
  deliveriesCount: number;
  earnings: number;
  packagesCount: number;
}

export const DeliveryFloatingStats = ({ deliveriesCount, earnings, packagesCount }: DeliveryFloatingStatsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3 mb-6"
    >
      {/* Livraisons aujourd'hui */}
      <div className="service-card rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
          <Package className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{deliveriesCount}</p>
        <p className="text-xs text-muted-foreground">Livraisons</p>
      </div>

      {/* Gains aujourd'hui */}
      <div className="service-card rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
          <DollarSign className="w-5 h-5 text-orange-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{earnings}</p>
        <p className="text-xs text-muted-foreground">CDF</p>
      </div>

      {/* Colis livrés */}
      <div className="service-card rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
          <Box className="w-5 h-5 text-purple-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">{packagesCount}</p>
        <p className="text-xs text-muted-foreground">Colis</p>
      </div>
    </motion.div>
  );
};
