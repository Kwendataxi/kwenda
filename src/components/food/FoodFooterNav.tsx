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
 * 🍔 KWENDA FOOD - FOOTER NAVIGATION
 * Harmonisé avec le style client (ModernBottomNavigation)
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
    <nav className="bottom-nav-standard">
      {/* Ligne décorative supérieure */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="flex items-center justify-around h-[72px] px-4 max-w-2xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? location.pathname === item.path : false;
          const isCart = item.action === 'cart';

          return (
            <motion.button
              key={item.id}
              onClick={() => handleClick(item)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[56px]",
                "transition-colors duration-200",
                isActive
                  ? 'text-primary'
                  : isCart && cartItemsCount > 0
                    ? 'text-orange-500'
                    : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Background actif */}
              {isActive && (
                <motion.div
                  layoutId="foodActiveBg"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icône */}
              <div className="relative z-10">
                <Icon 
                  className={cn("w-5 h-5", isActive && "scale-110")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Badge panier */}
                {isCart && (
                  <motion.span
                    key={cartItemsCount}
                    initial={{ scale: 1.3 }}
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
              </div>

              {/* Label */}
              <span className={cn(
                "relative z-10 text-[10px] font-medium",
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>

              {/* Indicateur actif (barre en bas) */}
              {isActive && (
                <motion.div
                  layoutId="foodActiveIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
