import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface KwendaFoodHeaderProps {
  step: 'restaurants' | 'menu' | 'checkout';
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedRestaurant?: { restaurant_name: string } | null;
  cartItemsCount: number;
  onBack: () => void;
}

export const KwendaFoodHeader = ({
  step,
  selectedCity,
  onCityChange,
  selectedRestaurant,
  cartItemsCount,
  onBack
}: KwendaFoodHeaderProps) => {
  const getHeaderContent = () => {
    switch (step) {
      case 'menu':
        return {
          title: 'Kwenda Food',
          subtitle: selectedRestaurant?.restaurant_name || '',
          showCitySelector: false
        };
      case 'checkout':
        return {
          title: 'Kwenda Food',
          subtitle: 'Finaliser la commande',
          showCitySelector: false
        };
      default:
        return {
          title: 'Kwenda Food',
          subtitle: 'Commandez vos plats préférés',
          showCitySelector: true
        };
    }
  };

  const { title, subtitle, showCitySelector } = getHeaderContent();

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shadow-xl"
    >
      <div className="px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Gauche: Bouton retour + Logo + Titre */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 flex-shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-base md:text-xl font-bold truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs md:text-sm opacity-90 truncate">
                  {subtitle}
                </p>
              )}
            </motion.div>
          </div>

          {/* Droite: Badge panier */}
          {cartItemsCount > 0 && step !== 'checkout' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={cartItemsCount}
              className="flex-shrink-0"
            >
              <Badge 
                variant="secondary"
                className="bg-white/90 dark:bg-gray-900/90 text-primary hover:bg-white px-3 py-1.5 shadow-lg"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                <span className="font-semibold">{cartItemsCount}</span>
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Sélecteur de ville */}
        {showCitySelector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 flex items-center gap-2"
          >
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger 
                className="h-8 md:h-9 w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Sélectionner une ville"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                <SelectItem value="Kolwezi">Kolwezi</SelectItem>
                <SelectItem value="Abidjan">Abidjan</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
