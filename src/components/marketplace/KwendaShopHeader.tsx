import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Package, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useMemo } from 'react';

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
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl"
    >
      <div className="px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Gauche: Retour + Titre */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:bg-white/20 flex-shrink-0"
                aria-label="Retour"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {/* Badge messages non lus */}
              {marketplaceUnreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold animate-pulse"
                >
                  {marketplaceUnreadCount}
                </Badge>
              )}
            </div>
            
            {/* Bouton de sortie d'urgence */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="text-white hover:bg-white/20 text-xs hidden sm:flex"
            >
              Accueil
            </Button>

            {/* Bouton de test promo (dev only) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('kwenda_shop_welcome_v1');
                  window.location.reload();
                }}
                className="text-white hover:bg-white/20 text-xs"
              >
                Reset Promo
              </Button>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Package className="h-7 w-7 md:h-8 md:w-8 drop-shadow-lg" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-xl font-bold truncate">
                  Kwenda Shop
                </h1>
                <p className="text-xs md:text-sm opacity-90 truncate">
                  Marketplace sécurisé
                </p>
              </div>
            </motion.div>
          </div>

          {/* Droite: Badge panier TOUJOURS VISIBLE */}
          <motion.div
            key={cartItemsCount}
            initial={{ scale: 0 }}
            animate={{ 
              scale: cartItemsCount > 0 ? 1.1 : 1,
              rotate: 0
            }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 10
            }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Button
              data-cart-button
              variant="default"
              size="icon"
              onClick={onCartClick}
              className="relative h-12 w-12 rounded-full bg-gradient-to-br from-white to-blue-50 text-primary hover:from-white hover:to-blue-100 shadow-lg hover:shadow-xl transition-all"
            >
              <ShoppingBag className="h-6 w-6" />
              <motion.div
                key={`badge-${cartItemsCount}`}
                initial={{ scale: cartItemsCount > 0 ? 2 : 1, opacity: cartItemsCount > 0 ? 0 : 1 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute -top-1 -right-1"
              >
                <Badge 
                  className={`min-w-[24px] h-6 flex items-center justify-center text-xs font-bold p-0 shadow-lg ${
                    cartItemsCount > 0 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </Badge>
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Shine effect animé */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
      />
    </motion.div>
  );
};
