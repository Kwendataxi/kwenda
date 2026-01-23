import { ArrowLeft, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface KwendaShopHeaderProps {
  cartItemsCount: number;
  onBack: () => void;
  onCartClick: () => void;
}

export const KwendaShopHeader = ({
  cartItemsCount,
  onBack,
  onCartClick
}: KwendaShopHeaderProps) => {
  const { conversations } = useUniversalChat();
  
  const marketplaceUnreadCount = useMemo(() => {
    return conversations
      .filter(conv => conv.context_type === 'marketplace')
      .reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Gauche: Retour + Titre */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-foreground hover:bg-muted/50 flex-shrink-0"
                aria-label="Retour"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {/* Badge messages non lus */}
              {marketplaceUnreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground"
                >
                  {marketplaceUnreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Logo soft */}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  Kwenda Shop
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  Marketplace sécurisé
                </p>
              </div>
            </div>
          </div>

          {/* Droite: Badge panier soft */}
          <Button
            data-cart-button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className={cn(
              "relative h-11 w-11 rounded-full hover:bg-muted/50 transition-colors",
              cartItemsCount > 0 && "bg-muted/30"
            )}
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center px-1">
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
