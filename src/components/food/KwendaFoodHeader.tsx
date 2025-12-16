import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Home, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodSearchBar } from './FoodSearchBar';
import BrandLogo from '@/components/brand/BrandLogo';
import { CityDropdown } from './CityDropdown';
import { cn } from '@/lib/utils';

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
      className="sticky top-0 z-50 bg-background/90 backdrop-blur-2xl border-b border-border/20 shadow-xl shadow-black/5"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-orange-500 to-red-500" />
      {/* Ligne principale - Design premium */}
      <motion.div 
        className="h-16 px-4 flex items-center justify-between gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Gauche : Navigation + Logo + Titre */}
        <motion.div 
          className="flex items-center gap-3 flex-shrink-0"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {step !== 'restaurants' ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onBack} 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </motion.div>
          ) : onBackToHome && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={onBackToHome} 
                variant="ghost" 
                size="icon"
                className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted"
                title="Retour à l'accueil"
              >
                <Home className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
          
          {/* Logo avec design premium */}
          <div className="flex items-center gap-3">
            {/* Icon container avec glow */}
            <motion.div 
              className="relative hidden sm:flex"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-xl" />
            </motion.div>
            
            {/* Desktop title */}
            <div className="hidden sm:flex items-baseline gap-1.5">
              <h1 className="text-xl font-black leading-none tracking-tight bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                Kwenda
              </h1>
              <span className="text-xl font-satisfy text-orange-500 leading-none">
                Food
              </span>
            </div>
            
            {/* Mobile title */}
            <div className="sm:hidden flex items-baseline gap-1">
              <h1 className="text-lg font-black bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                Kwenda
              </h1>
              <span className="text-lg font-satisfy text-orange-500">
                Food
              </span>
            </div>
          </div>
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

        {/* Droite : Panier avec animation améliorée */}
        <motion.div 
          className="flex items-center gap-2 flex-shrink-0"
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {/* Bouton panier toujours visible sauf en checkout */}
          {step !== 'checkout' && (
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="relative"
            >
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-11 w-11 relative rounded-xl transition-all",
                  cartItemsCount > 0
                    ? "bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground"
                )}
                onClick={onCartClick}
              >
                <ShoppingCart className="w-5 h-5" />
                
                {/* Badge animé - affiché même à 0 */}
                <motion.span
                  key={cartItemsCount}
                  initial={{ scale: 1.8, y: -5 }}
                  animate={{ scale: 1, y: 0 }}
                  className={cn(
                    "absolute -top-1.5 -right-1.5",
                    "rounded-full",
                    "min-w-[22px] h-[22px] text-xs font-bold",
                    "flex items-center justify-center",
                    "shadow-md",
                    cartItemsCount > 0
                      ? "bg-white text-primary border-2 border-orange-500"
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {cartItemsCount}
                </motion.span>
              </Button>
              
              {/* Pulse ring animation - seulement si panier non vide */}
              {cartItemsCount > 0 && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-orange-500/50 pointer-events-none"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Ligne secondaire : Contexte avec design premium */}
      <motion.div 
        className="h-11 px-4 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 flex items-center gap-3 text-sm border-t border-border/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <CityDropdown 
          selectedCity={selectedCity}
          onCityChange={onCityChange}
          className="flex-shrink-0"
        />
        <span className="text-muted-foreground/50 hidden sm:inline">•</span>
        <motion.span 
          key={breadcrumb}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-muted-foreground truncate hidden sm:inline font-medium"
        >
          {breadcrumb}
        </motion.span>
      </motion.div>
    </motion.header>
  );
};