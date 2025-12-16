import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Users, User, Heart, Star, Gauge, Calendar } from 'lucide-react';
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
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const dailyRate = vehicle.driver_available && vehicle.without_driver_daily_rate > 0
    ? vehicle.without_driver_daily_rate
    : vehicle.daily_rate;

  const categoryTheme = categoryName ? getCategoryTheme(categoryName) : null;
  const vehicleImage = getVehicleImage(vehicle);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
    >
      <Card 
        className="group overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 cursor-pointer border-2 border-border/50 hover:border-emerald-500/50 bg-card/80 backdrop-blur-sm"
        onClick={() => navigate(`/rental/${vehicle.id}/details`)}
      >
        {/* Image Hero avec effets premium */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {/* Skeleton loader */}
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <img 
            src={vehicleImage}
            alt={vehicle.name}
            className={`w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {categoryName && categoryTheme && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 + 0.2 }}
              >
                <Badge className="bg-white/95 text-foreground border-0 shadow-lg backdrop-blur-sm px-3 py-1">
                  <span className="mr-1.5 text-base">{categoryTheme.icon}</span>
                  <span className="font-semibold">{categoryName}</span>
                </Badge>
              </motion.div>
            )}
            
            {vehicle.driver_available && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 + 0.3 }}
              >
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg px-3 py-1">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  <span className="font-semibold">Chauffeur</span>
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Price Card - Bottom left avec glassmorphism */}
          <motion.div 
            className="absolute bottom-3 left-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 + 0.4 }}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-2 shadow-xl border border-white/50">
              <div className="text-emerald-600 font-bold text-xl leading-none">
                {formatCurrency(dailyRate, 'CDF')}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">par jour</div>
            </div>
          </motion.div>

          {/* Favorite button - Bottom right */}
          <motion.div
            className="absolute bottom-3 right-3"
            whileTap={{ scale: 0.85 }}
          >
            <Button 
              size="icon" 
              variant="ghost" 
              className={`
                rounded-xl shadow-xl backdrop-blur-md transition-all duration-300
                ${isLiked 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white/95 hover:bg-white text-foreground'
                }
              `}
              onClick={handleLike}
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Info section avec glassmorphism */}
        <CardContent className="p-4 space-y-3 bg-gradient-to-b from-card to-card/80">
          {/* Title */}
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors duration-300">
            {vehicle.name}
          </h3>

          {/* Specs row avec icônes animées */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <motion.span 
              className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg"
              whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--emerald-500) / 0.1)' }}
            >
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">{vehicle.seats}</span>
            </motion.span>
            <motion.span 
              className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg"
              whileHover={{ scale: 1.05 }}
            >
              <Gauge className="h-4 w-4 text-teal-500" />
              <span className="font-medium">{vehicle.transmission === 'automatic' ? 'Auto' : 'Manuel'}</span>
            </motion.span>
            <motion.span 
              className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg"
              whileHover={{ scale: 1.05 }}
            >
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{vehicle.year}</span>
            </motion.span>
          </div>

          {/* Partner info avec avatar premium */}
          {partnerName && (
            <motion.div 
              className="flex items-center gap-3 pt-3 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.06 + 0.5 }}
            >
              <div className="relative">
                <img 
                  src={partnerAvatar || '/placeholder.svg'}
                  alt={partnerName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <span className="text-sm text-muted-foreground line-clamp-1 font-medium">{partnerName}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
