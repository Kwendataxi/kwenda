import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, MessageCircle } from 'lucide-react';
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
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white shadow-2xl"
    >
      {/* Ligne accent animée */}
      <motion.div 
        className="h-1 bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      
      <div className="px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Gauche: Retour + Titre */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-white hover:bg-white/20 flex-shrink-0 backdrop-blur-sm"
                aria-label="Retour"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {/* Badge messages non lus */}
              {marketplaceUnreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-white text-orange-600 shadow-lg"
                  >
                    {marketplaceUnreadCount}
                  </Badge>
                </motion.div>
              )}
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              {/* Logo emoji animé */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 3 
                }}
                className="text-3xl md:text-4xl drop-shadow-lg"
              >
                🛍️
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-extrabold truncate font-montserrat tracking-tight">
                  Kwenda Shop
                </h1>
                <p className="text-xs md:text-sm opacity-90 truncate font-medium">
                  ✨ Marketplace premium
                </p>
              </div>
            </motion.div>
          </div>

          {/* Droite: Badge panier avec glow */}
          <motion.div
            key={cartItemsCount}
            initial={{ scale: 0 }}
            animate={{ 
              scale: cartItemsCount > 0 ? 1.1 : 1,
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
              className={`relative h-12 w-12 rounded-full bg-white text-orange-600 hover:bg-orange-50 shadow-xl transition-all ${
                cartItemsCount > 0 ? 'ring-4 ring-yellow-300/50 shadow-orange-500/50' : ''
              }`}
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
                      ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white animate-pulse' 
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

      {/* Shine effect animé premium */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
      />
      
      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-lg opacity-30"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '100%',
              opacity: 0 
            }}
            animate={{ 
              y: '-20%',
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeOut"
            }}
          >
            {['✨', '🛒', '💎', '🎁', '⭐'][i]}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
