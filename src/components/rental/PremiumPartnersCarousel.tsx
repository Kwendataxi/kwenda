import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PartnerTierBadge } from './PartnerTierBadge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Crown, Star } from 'lucide-react';

interface PremiumPartner {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  tier: 'gold' | 'platinum';
  vehicleCount: number;
  avgRating: number;
  topVehicles: Array<{ id: string; images: string[] }>;
}

interface PremiumPartnersCarouselProps {
  premiumPartners: PremiumPartner[];
}

export const PremiumPartnersCarousel: React.FC<PremiumPartnersCarouselProps> = ({
  premiumPartners,
}) => {
  const navigate = useNavigate();

  if (premiumPartners.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Partenaires Premium
        </h2>
        <Button 
          variant="link" 
          size="sm"
          onClick={() => navigate('/rental')}
        >
          Voir tout
        </Button>
      </div>

      {/* Carousel moderne avec Embla */}
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {premiumPartners.map(partner => (
            <CarouselItem 
              key={partner.partnerId} 
              className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <Card 
                className="relative overflow-hidden h-40 cursor-pointer group"
                onClick={() => navigate(`/rental/partner/${partner.partnerId}/shop`)}
              >
                {/* Background image avec overlay */}
                <div className="absolute inset-0">
                  <img 
                    src={partner.topVehicles[0]?.images?.[0] || '/placeholder.svg'}
                    alt={partner.partnerName}
                    className="w-full h-full object-cover blur-sm group-hover:blur-none transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
                </div>

                {/* Content */}
                <CardContent className="relative z-10 p-4 h-full flex flex-col justify-end">
                  <PartnerTierBadge tier={partner.tier} className="mb-2 w-fit" />
                  <h3 className="text-white font-bold text-xl mb-1 line-clamp-1">
                    {partner.partnerName}
                  </h3>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span>{partner.vehicleCount} véhicules</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {partner.avgRating.toFixed(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};
