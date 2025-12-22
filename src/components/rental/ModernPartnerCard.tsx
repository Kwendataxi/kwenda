import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  partnerLogo: string | null;
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
  partnerLogo,
  tier,
  vehicleCount,
  avgRating,
  followersCount,
  topVehicles,
}) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer overflow-hidden border hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card"
      onClick={() => navigate(`/rental/partner/${partnerId}/shop`)}
    >
      {/* Header simple */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img 
              src={partnerLogo || '/placeholder.svg'}
              alt={partnerName}
              className="w-16 h-16 rounded-xl object-cover border-2 border-background shadow-sm"
            />
            {/* Tier badge */}
            <div className="absolute -top-1.5 -right-1.5">
              <PartnerTierBadge tier={tier} className="text-[10px]" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-1">
              {partnerName}
            </h3>
            
            {/* Stats inline */}
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Car className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{vehicleCount}</span>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="font-medium text-foreground">
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-pink-500" />
                <span>{followersCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview véhicules */}
      <CardContent className="p-4 pt-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {topVehicles.slice(0, 3).map((vehicle) => (
            <div key={vehicle.id} className="flex-shrink-0 w-24">
              <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-muted">
                <img 
                  src={vehicle.images?.[0] || '/placeholder.svg'}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs font-medium line-clamp-1">{vehicle.name}</p>
              <p className="text-xs text-primary font-semibold">
                {vehicle.daily_rate.toLocaleString()} CDF
              </p>
            </div>
          ))}

          {/* More vehicles indicator */}
          {vehicleCount > 3 && (
            <div className="flex-shrink-0 w-24 aspect-square rounded-lg bg-muted/50 flex flex-col items-center justify-center border border-dashed border-muted-foreground/30">
              <span className="text-lg font-bold text-primary">+{vehicleCount - 3}</span>
              <span className="text-[10px] text-muted-foreground">véhicules</span>
            </div>
          )}
        </div>

        {/* CTA Button sobre */}
        <Button 
          className="w-full h-10 mt-3 rounded-lg"
        >
          Voir l'agence
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};
