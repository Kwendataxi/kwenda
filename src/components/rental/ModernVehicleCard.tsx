import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Users, User, Heart } from 'lucide-react';
import { getCategoryTheme } from '@/utils/categoryThemes';
import { getVehicleImage } from '@/utils/vehicleFallbackImages';
import { formatCurrency } from '@/utils/formatCurrency';

interface ModernVehicleCardProps {
  vehicle: {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    seats: number;
    transmission: string | null;
    daily_rate: number;
    without_driver_daily_rate: number;
    driver_available: boolean;
    images: string[];
    category_id: string;
  };
  categoryName?: string;
  partnerName?: string;
  partnerAvatar?: string;
  index: number;
}

export const ModernVehicleCard: React.FC<ModernVehicleCardProps> = ({
  vehicle,
  categoryName,
  partnerName,
  partnerAvatar,
  index,
}) => {
  const navigate = useNavigate();
  
  const dailyRate = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
    ? vehicle.without_driver_daily_rate
    : vehicle.daily_rate;

  const categoryTheme = categoryName ? getCategoryTheme(categoryName) : null;
  const vehicleImage = getVehicleImage(vehicle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
        onClick={() => navigate(`/rental/${vehicle.id}/details`)}
      >
        {/* Image avec overlay gradient bottom */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={vehicleImage}
            alt={vehicle.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Gradient overlay bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges top */}
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            {categoryName && categoryTheme && (
              <Badge className="bg-white/90 text-black border-0">
                {categoryTheme.icon} {categoryName}
              </Badge>
            )}
            {vehicle.driver_available && (
              <Badge className="bg-green-500 text-white">
                <User className="h-3 w-3 mr-1" /> Chauffeur
              </Badge>
            )}
          </div>

          {/* Price - Bottom left */}
          <div className="absolute bottom-2 left-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <div className="text-primary font-bold text-lg">
                {formatCurrency(dailyRate, 'CDF')}
              </div>
              <div className="text-xs text-muted-foreground">par jour</div>
            </div>
          </div>

          {/* Favorite button - Bottom right */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute bottom-2 right-2 bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement favorite logic
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Info section - Plus compact */}
        <CardContent className="p-3 space-y-2">
          <h3 className="font-bold line-clamp-1">{vehicle.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {vehicle.seats}
            </span>
            <span>•</span>
            <span>{vehicle.transmission === 'automatic' ? 'Auto' : 'Man'}</span>
            <span>•</span>
            <span>{vehicle.year}</span>
          </div>

          {/* Partner info inline */}
          {partnerName && (
            <div className="flex items-center gap-2 pt-1 border-t">
              <img 
                src={partnerAvatar || '/placeholder.svg'}
                alt={partnerName}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-xs text-muted-foreground line-clamp-1">{partnerName}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
