import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, ShoppingCart, Search, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

interface ModernMarketplaceHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cartItemsCount: number;
  onCartClick: () => void;
  onWishlistClick?: () => void;
}

export const ModernMarketplaceHeader = ({
  searchQuery,
  onSearchChange,
  cartItemsCount,
  onCartClick,
  onWishlistClick
}: ModernMarketplaceHeaderProps) => {
  const navigate = useNavigate();
  const { userRole } = useUserRole();
  const isVendor = userRole === 'vendor';

  return (
    <header className="sticky top-[60px] z-[140] bg-background/80 backdrop-blur-xl border-b">
      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Logo + Titre avec gradient */}
          <div className="flex items-center gap-3">
            <motion.div 
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-[hsl(0,80%,50%)] to-[hsl(45,100%,50%)] flex items-center justify-center text-2xl shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              🛍️
            </motion.div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-[hsl(0,80%,50%)] bg-clip-text text-transparent">
                Kwenda Market
              </h1>
              <p className="text-xs text-muted-foreground">Achetez en toute confiance</p>
            </div>
          </div>

          {/* Barre de recherche centrale */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher un produit..."
                className="pl-10 bg-muted/50 border-border/50 focus:bg-background"
              />
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex items-center gap-2">
            {onWishlistClick && (
              <Button variant="ghost" size="icon" onClick={onWishlistClick}>
                <Heart className="h-5 w-5" />
              </Button>
            )}
            
            <Button variant="ghost" size="icon" onClick={onCartClick} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {isVendor && (
              <Button 
                variant="outline"
                onClick={() => navigate('/vendeur')}
                className="hidden md:flex items-center gap-2"
                size="sm"
              >
                <Store className="h-4 w-4" />
                Mon espace vendeur
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
