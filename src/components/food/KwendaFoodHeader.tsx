import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, ShoppingCart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodSearchBar } from './FoodSearchBar';
import BrandLogo from '@/components/brand/BrandLogo';

interface KwendaFoodHeaderProps {
  step: 'restaurants' | 'menu' | 'checkout' | 'all-dishes' | 'all-restaurants';
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedRestaurant?: { restaurant_name: string } | null;
  cartItemsCount: number;
  onBack: () => void;
  onBackToHome?: () => void;
}

export const KwendaFoodHeader = ({
  step,
  selectedCity,
  onCityChange,
  selectedRestaurant,
  cartItemsCount,
  onBack,
  onBackToHome
}: KwendaFoodHeaderProps) => {
  const getBreadcrumb = () => {
    switch (step) {
      case 'menu':
        return selectedRestaurant?.restaurant_name || 'Menu';
      case 'checkout':
        return 'Finaliser la commande';
      case 'all-dishes':
        return 'Tous les plats';
      case 'all-restaurants':
        return 'Tous les restaurants';
      default:
        return 'Vos restaurants préférés';
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      {/* Ligne principale */}
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* Gauche : Navigation + Logo + Titre */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {step !== 'restaurants' ? (
            <Button 
              onClick={onBack} 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : onBackToHome && (
            <Button 
              onClick={onBackToHome} 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              title="Retour à l'accueil"
            >
              <Home className="w-5 h-5" />
            </Button>
          )}
          
          <BrandLogo size={32} className="hidden sm:block" />
          
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-none">KWENDA</h1>
            <p className="text-xs text-muted-foreground leading-none">Food</p>
          </div>
          <h1 className="text-lg font-bold sm:hidden">KWENDA Food</h1>
        </div>

        {/* Centre : Recherche (desktop uniquement) */}
        {step === 'restaurants' && (
          <div className="hidden md:block flex-1 max-w-xl">
            <FoodSearchBar city={selectedCity} />
          </div>
        )}

        {/* Droite : Panier */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {cartItemsCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 relative"
              >
                <ShoppingCart className="w-5 h-5" />
                <motion.span
                  key={cartItemsCount}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center shadow-sm"
                >
                  {cartItemsCount}
                </motion.span>
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Ligne secondaire : Contexte */}
      <div className="h-10 px-4 bg-muted/30 flex items-center gap-3 text-sm border-t">
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium">{selectedCity}</span>
        <span className="text-muted-foreground hidden sm:inline">·</span>
        <span className="text-muted-foreground truncate hidden sm:inline">{breadcrumb}</span>
      </div>
    </header>
  );
};