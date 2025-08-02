import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Bell, ShoppingBag, User, Wallet } from 'lucide-react';

interface ModernMarketplaceHeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  userBalance?: number;
}

export const ModernMarketplaceHeader: React.FC<ModernMarketplaceHeaderProps> = ({
  cartItemsCount,
  onCartClick,
  userBalance = 125000
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border/40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Welcome */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Marketplace</h2>
              <div className="flex items-center gap-2">
                <Wallet className="w-3 h-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {userBalance.toLocaleString()} FC
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-10 w-10 p-0 rounded-full relative"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
            </Button>

            {/* Shopping Cart */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-10 w-10 p-0 rounded-full relative"
              onClick={onCartClick}
            >
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              {cartItemsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-5 bg-primary text-white border-2 border-white"
                >
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};