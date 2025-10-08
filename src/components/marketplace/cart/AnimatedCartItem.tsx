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
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(item.id, item.name);
    }, 300);
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
      <div className="flex gap-3 bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
        {/* Product image with loading skeleton */}
        <motion.div 
          className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
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
          />
        </motion.div>

        {/* Product info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="font-semibold text-sm line-clamp-2 leading-tight">
              {item.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
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
              className="font-bold text-primary text-sm"
            >
              {itemTotal.toLocaleString()} CDF
            </motion.div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                <Minus className="w-3 h-3" />
              </Button>
              
              <motion.span
                key={item.quantity}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
                className="text-sm font-bold w-7 text-center"
              >
                {item.quantity}
              </motion.span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Delete button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};
