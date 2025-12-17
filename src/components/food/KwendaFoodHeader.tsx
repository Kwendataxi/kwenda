import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodSearchBar } from './FoodSearchBar';
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
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/5">
      {/* Ligne principale - Design soft et épuré */}
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* Gauche : Navigation + Logo + Titre */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {step !== 'restaurants' ? (
            <Button
              onClick={onBack} 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : onBackToHome && (
            <Button 
              onClick={onBackToHome} 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground hover:bg-transparent"
              title="Retour à l'accueil"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          {/* Logo soft */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <UtensilsCrossed className="h-[18px] w-[18px] text-foreground/60" />
            </div>
            
            {/* Title */}
            <div className="flex flex-col">
              <h1 className="text-base font-medium text-foreground tracking-tight">
                Kwenda <span className="text-foreground/50">Food</span>
              </h1>
              <p className="text-[11px] text-muted-foreground/60 hidden sm:block">
                {breadcrumb}
              </p>
            </div>
          </div>
        </div>

        {/* Centre : Recherche (desktop uniquement) */}
        {step === 'restaurants' && (
          <div className="hidden md:block flex-1 max-w-xl">
            <FoodSearchBar city={selectedCity} />
          </div>
        )}

        {/* Droite : Panier simplifié */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {step !== 'checkout' && (
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "h-10 w-10 relative rounded-xl transition-colors",
                cartItemsCount > 0
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              
              {/* Badge simple */}
              <span
                className={cn(
                  "absolute -top-1 -right-1",
                  "rounded-full",
                  "min-w-[18px] h-[18px] text-[10px] font-semibold",
                  "flex items-center justify-center",
                  cartItemsCount > 0
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {cartItemsCount}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Ligne secondaire : Contexte simplifié */}
      <div className="h-10 px-4 flex items-center gap-3 text-sm">
        <CityDropdown 
          selectedCity={selectedCity}
          onCityChange={onCityChange}
          className="flex-shrink-0"
        />
        <span className="text-muted-foreground/30 hidden sm:inline">•</span>
        <span className="text-muted-foreground/60 truncate hidden sm:inline text-[13px]">
          {breadcrumb}
        </span>
      </div>
    </header>
  );
};
