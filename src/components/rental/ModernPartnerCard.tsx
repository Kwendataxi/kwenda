import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartnerTierBadge } from './PartnerTierBadge';
import { Car, Star, Heart, ChevronRight } from 'lucide-react';

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
  tier: 'free' | 'basic' | 'pro' | 'business' | 'enterprise' | 'gold' | 'platinum';
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/50"
        onClick={() => navigate(`/rental/partner/${partnerId}/shop`)}
      >
        {/* Header compact avec gradient subtil */}
        <div className="relative p-4 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start gap-3">
            {/* Avatar avec badge tier overlay */}
            <div className="relative flex-shrink-0">
              <img 
                src={partnerAvatar || '/placeholder.svg'}
                alt={partnerName}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1">
                <PartnerTierBadge tier={tier} size="sm" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {partnerName}
              </h3>
              
              {/* Stats inline compact */}
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" />
                  {vehicleCount}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  {followersCount}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>

        {/* Preview véhicules - Horizontal scroll */}
        <div className="p-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {topVehicles.slice(0, 3).map(vehicle => (
              <div key={vehicle.id} className="flex-shrink-0 w-28">
                <div className="aspect-square rounded-lg overflow-hidden mb-2">
                  <img 
                    src={vehicle.images?.[0] || '/placeholder.svg'}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-semibold line-clamp-1">{vehicle.name}</p>
                <p className="text-xs text-primary font-bold">
                  {vehicle.daily_rate.toLocaleString()} FC
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
