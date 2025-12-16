import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartnerTierBadge } from './PartnerTierBadge';
import { Car, Star, Heart, ChevronRight, MapPin } from 'lucide-react';

interface TopVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  daily_rate: number;
  images: string[];
}

interface ModernPartnerCardProps {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  tier: string;
  vehicleCount: number;
  avgRating: number;
  ratingCount: number;
  followersCount: number;
  topVehicles: TopVehicle[];
  index: number;
}

export const ModernPartnerCard: React.FC<ModernPartnerCardProps> = ({
  partnerId,
  partnerName,
  partnerAvatar,
  tier,
  vehicleCount,
  avgRating,
  ratingCount,
  followersCount,
  topVehicles,
  index,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
    >
      <Card 
        className="group cursor-pointer overflow-hidden border-2 border-border/50 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 bg-card/80 backdrop-blur-sm"
        onClick={() => navigate(`/rental/partner/${partnerId}/shop`)}
      >
        {/* Header avec gradient premium */}
        <div className="relative p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="relative flex items-start gap-4">
            {/* Avatar premium avec ring animé */}
            <div className="relative flex-shrink-0">
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500"
              />
              <div className="relative">
                <img 
                  src={partnerAvatar || '/placeholder.svg'}
                  alt={partnerName}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-background shadow-xl"
                />
                {/* Online indicator */}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-background flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              </div>
              {/* Tier badge floating */}
              <div className="absolute -top-2 -right-2">
                <PartnerTierBadge tier={tier} className="text-xs shadow-lg" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-bold text-xl line-clamp-1 group-hover:text-emerald-600 transition-colors duration-300">
                {partnerName}
              </h3>
              
              {/* Stats avec icônes animées */}
              <div className="flex items-center gap-4 mt-3">
                <motion.div 
                  className="flex items-center gap-1.5 text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <Car className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="font-semibold">{vehicleCount}</span>
                </motion.div>

                <motion.div 
                  className="flex items-center gap-1.5 text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  </div>
                  <span className="font-semibold">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                </motion.div>

                <motion.div 
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1.5 bg-pink-500/10 rounded-lg">
                    <Heart className="h-4 w-4 text-pink-500" />
                  </div>
                  <span className="font-medium">{followersCount}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview véhicules avec scroll horizontal */}
        <CardContent className="p-4 pt-0">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {topVehicles.slice(0, 3).map((vehicle, vIndex) => (
              <motion.div 
                key={vehicle.id} 
                className="flex-shrink-0 w-28"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 + vIndex * 0.1 + 0.2 }}
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-muted relative group/vehicle">
                  <img 
                    src={vehicle.images?.[0] || '/placeholder.svg'}
                    alt={vehicle.name}
                    className="w-full h-full object-cover group-hover/vehicle:scale-110 transition-transform duration-500"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/vehicle:opacity-100 transition-opacity duration-300" />
                </div>
                <p className="text-xs font-semibold line-clamp-1">{vehicle.name}</p>
                <p className="text-xs text-emerald-600 font-bold">
                  {vehicle.daily_rate.toLocaleString()} CDF
                </p>
              </motion.div>
            ))}

            {/* More vehicles indicator */}
            {vehicleCount > 3 && (
              <motion.div 
                className="flex-shrink-0 w-28 aspect-square rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.08 + 0.5 }}
              >
                <span className="text-2xl font-bold text-emerald-600">+{vehicleCount - 3}</span>
                <span className="text-xs text-muted-foreground">véhicules</span>
              </motion.div>
            )}
          </div>

          {/* CTA Button premium */}
          <motion.div 
            className="mt-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 group/btn"
            >
              <span>Voir l'agence</span>
              <motion.div
                className="ml-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.div>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
