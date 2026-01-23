import { ArrowLeft, ShoppingCart, MapPin } from 'lucide-react';
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
  const getTitle = () => {
    switch (step) {
      case 'menu':
        return selectedRestaurant?.restaurant_name || 'Menu';
      case 'checkout':
        return 'Commande';
      case 'all-dishes':
        return 'Tous les plats';
      case 'all-restaurants':
        return 'Restaurants';
      default:
        return null;
    }
  };

  const title = getTitle();
  const showBackButton = step !== 'restaurants' || onBackToHome;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/10">
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* Left: Back + Title/Logo */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBackButton && (
            <Button
              onClick={step !== 'restaurants' ? onBack : onBackToHome}
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {step === 'restaurants' ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                Kwenda<span className="text-muted-foreground font-normal ml-0.5">Food</span>
              </span>
              <span className="text-muted-foreground/40">·</span>
              <CityDropdown
                selectedCity={selectedCity}
                onCityChange={onCityChange}
                className="text-sm"
              />
            </div>
          ) : (
            <h1 className="text-base font-medium text-foreground truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Center: Search (desktop) */}
        {step === 'restaurants' && (
          <div className="hidden md:block flex-1 max-w-md">
            <FoodSearchBar city={selectedCity} />
          </div>
        )}

        {/* Right: Cart */}
        {step !== 'checkout' && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 relative rounded-xl transition-colors",
              cartItemsCount > 0
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={onCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Button>
        )}
      </div>
    </header>
  );
};
