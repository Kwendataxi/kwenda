import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, ShoppingBag, Store } from 'lucide-react';

interface ModernMarketplaceHeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
}

export const ModernMarketplaceHeader: React.FC<ModernMarketplaceHeaderProps> = ({
  cartItemsCount,
  onCartClick
}) => {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Clean title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl font-medium text-foreground">Marketplace</h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 p-0 rounded-lg relative hover:bg-muted/50"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></div>
            </Button>

            {/* Shopping Cart */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 p-0 rounded-lg relative hover:bg-muted/50"
              onClick={onCartClick}
            >
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              {cartItemsCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4 bg-primary text-primary-foreground border border-background"
                >
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};