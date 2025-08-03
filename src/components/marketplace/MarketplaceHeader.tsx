import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingCart, Plus, MessageSquare, Package, Shield } from 'lucide-react';

interface User {
  id: string;
  email?: string;
}

interface Profile {
  display_name?: string;
  avatar_url?: string;
  user_type?: string;
}

interface MarketplaceHeaderProps {
  user: User;
  profile?: Profile;
  cartItemsCount: number;
  onCartClick: () => void;
  onSellClick: () => void;
  onChatClick: () => void;
  onOrdersClick: () => void;
  onAdminClick: () => void;
  currentView: string;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  user,
  profile,
  cartItemsCount,
  onCartClick,
  onSellClick,
  onChatClick,
  onOrdersClick,
  onAdminClick,
  currentView
}) => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Marketplace</h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'browse' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => window.location.reload()}
            >
              Explorer
            </Button>

            <Button
              variant={currentView === 'sell' ? 'default' : 'ghost'}
              size="sm"
              onClick={onSellClick}
            >
              <Plus className="h-4 w-4 mr-2" />
              Vendre
            </Button>

            <Button
              variant={currentView === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={onChatClick}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            <Button
              variant={currentView === 'orders' ? 'default' : 'ghost'}
              size="sm"
              onClick={onOrdersClick}
            >
              <Package className="h-4 w-4" />
            </Button>

            {profile?.user_type === 'admin' && (
              <Button
                variant={currentView === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={onAdminClick}
              >
                <Shield className="h-4 w-4" />
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItemsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};