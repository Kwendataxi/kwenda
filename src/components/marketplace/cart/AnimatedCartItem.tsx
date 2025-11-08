import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
}

interface AnimatedCartItemProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string, name: string) => void;
}

export const AnimatedCartItem: React.FC<AnimatedCartItemProps> = ({
  item,
  index,
  onUpdateQuantity,
  onRemove
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    console.log('[AnimatedCartItem] Removing item:', item.id, item.name);
    setIsRemoving(true);
    // Appel immédiat de la suppression (l'animation continue visuellement)
    onRemove(item.id, item.name);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ 
        opacity: isRemoving ? 0 : 1, 
        x: isRemoving ? 100 : 0,
        scale: isRemoving ? 0.8 : 1
      }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: index * 0.05
      }}
      className="relative group"
    >
      <div className="flex gap-2 sm:gap-3 bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
        {/* Product image - optimized mobile sizes */}
        <motion.div 
          className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {!imageLoaded && (
            <Skeleton className="absolute inset-0" />
          )}
          <img
            src={item.image}
            alt={item.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        </motion.div>

        {/* Product info */}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
          <div>
            <h4 className="font-semibold text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 leading-tight break-words">
              {item.name}
            </h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              {item.seller}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Price with animation */}
            <motion.div
              key={itemTotal}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="font-bold text-primary text-xs sm:text-sm whitespace-nowrap"
            >
              {itemTotal.toLocaleString()} CDF
            </motion.div>

            {/* Quantity controls - touch-optimized (44px min) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30 touch-manipulation active:scale-95 transition-transform"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              
              <motion.span
                key={item.quantity}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
                className="text-xs sm:text-sm font-bold w-6 sm:w-7 text-center tabular-nums"
              >
                {item.quantity}
              </motion.span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30 touch-manipulation active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Delete button - touch-optimized with improved visibility */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-2 rounded-lg 
                     bg-destructive/20 text-destructive 
                     hover:bg-destructive hover:text-white
                     transition-colors
                     min-h-[44px] min-w-[44px] 
                     flex items-center justify-center touch-manipulation
                     opacity-100 sm:opacity-0 group-hover:opacity-100
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Supprimer ${item.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};
