import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodSearchBar } from './FoodSearchBar';
import BrandLogo from '@/components/brand/BrandLogo';
import { CityDropdown } from './CityDropdown';

interface KwendaFoodHeaderProps {
  step: 'restaurants' | 'menu' | 'checkout' | 'all-dishes' | 'all-restaurants';
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedRestaurant?: { restaurant_name: string } | null;
  cartItemsCount: number;
  onBack: () => void;
  onBackToHome?: () => void;
  onCartClick?: () => void;
}

export const KwendaFoodHeader = ({
  step,
  selectedCity,
  onCityChange,
  selectedRestaurant,
  cartItemsCount,
  onBack,
  onBackToHome,
  onCartClick
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
    <motion.header 
      className="sticky top-0 z-50 bg-background border-b shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Ligne principale */}
      <motion.div 
        className="h-14 px-4 flex items-center justify-between gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Gauche : Navigation + Logo + Titre */}
        <motion.div 
          className="flex items-center gap-2 flex-shrink-0"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
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
        </motion.div>

        {/* Centre : Recherche (desktop uniquement) */}
        {step === 'restaurants' && (
          <motion.div 
            className="hidden md:block flex-1 max-w-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <FoodSearchBar city={selectedCity} />
          </motion.div>
        )}

          {/* Droite : Panier */}
          <motion.div 
            className="flex items-center gap-2 flex-shrink-0"
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
          {cartItemsCount > 0 && (step === 'menu' || step === 'all-dishes' || step === 'restaurants') && (
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
                onClick={onCartClick}
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
        </motion.div>
      </motion.div>

      {/* Ligne secondaire : Contexte avec sélecteur de ville */}
      <motion.div 
        className="h-10 px-4 bg-muted/30 flex items-center gap-3 text-sm border-t"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <CityDropdown 
          selectedCity={selectedCity}
          onCityChange={onCityChange}
          className="flex-shrink-0"
        />
        <span className="text-muted-foreground hidden sm:inline">·</span>
        <span className="text-muted-foreground truncate hidden sm:inline">{breadcrumb}</span>
      </motion.div>
    </motion.header>
  );
};