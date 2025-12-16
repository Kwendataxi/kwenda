import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  action?: string;
}

interface FoodFooterNavProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/food' },
  { id: 'explore', label: 'Explorer', icon: Search, path: '/food/explore' },
  { id: 'cart', label: 'Panier', icon: ShoppingCart, action: 'cart' },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, path: '/food/orders' },
  { id: 'favorites', label: 'Favoris', icon: Heart, path: '/food/favorites' },
];

/**
 * 🍔 KWENDA FOOD - FOOTER NAVIGATION MODERNE
 * Design professionnel avec backdrop-blur, gradients et animations fluides
 */
export const FoodFooterNav: React.FC<FoodFooterNavProps> = ({ 
  cartItemsCount = 0, 
  onCartClick 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (item: NavItem) => {
    if (item.action === 'cart' && onCartClick) {
      onCartClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <footer
      data-food-footer
      className="bottom-nav-standard z-[110] isolate"
    >
      {/* Ligne décorative supérieure avec gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Container principal avec glassmorphism */}
      <div className="relative bg-background/80 backdrop-blur-2xl border-t border-border/50 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_48px_rgba(0,0,0,0.5)]">
        {/* Effet de glow subtil */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <nav className="relative flex justify-around items-center h-16 px-2 max-w-2xl mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.path ? location.pathname === item.path : false;
            const isCart = item.action === 'cart';

            return (
              <motion.button
                key={item.id}
                onClick={() => handleClick(item)}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-2xl",
                  "transition-all duration-300 ease-out",
                  isActive
                    ? 'text-primary'
                    : isCart && cartItemsCount > 0
                      ? 'text-orange-500'
                      : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {/* Background actif avec glassmorphism */}
                {isActive && (
                  <motion.div
                    layoutId="activeBg"
                    className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-2xl border border-primary/20"
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30 
                    }}
                  />
                )}

                {/* Icône avec animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="relative z-10"
                >
                  <Icon 
                    className="w-5 h-5" 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  {/* Badge panier */}
                  {isCart && (
                    <motion.span
                      key={cartItemsCount}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute -top-2 -right-2 min-w-[18px] h-[18px]",
                        "text-[10px] font-bold rounded-full",
                        "flex items-center justify-center",
                        cartItemsCount > 0
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </motion.div>

                {/* Label */}
                <span 
                  className={cn(
                    "relative z-10 text-[10px] font-semibold tracking-wide",
                    isActive ? 'font-bold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>

                {/* Indicateur de tab actif (ligne en haut) */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-10 h-[3px] bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full shadow-lg shadow-primary/50"
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 35 
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>
    </footer>
  );
};
