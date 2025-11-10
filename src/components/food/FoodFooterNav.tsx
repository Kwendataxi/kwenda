import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/food' },
  { id: 'explore', label: 'Explorer', icon: Search, path: '/food/explore' },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, path: '/food/orders' },
  { id: 'favorites', label: 'Favoris', icon: Heart, path: '/food/favorites' },
];

/**
 * 🍔 KWENDA FOOD - FOOTER NAVIGATION MODERNE
 * Design professionnel avec backdrop-blur, gradients et animations fluides
 */
export const FoodFooterNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
            const isActive = location.pathname === item.path;

            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                className={`
                  relative flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-2xl 
                  transition-all duration-300 ease-out
                  ${isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
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
                </motion.div>

                {/* Label */}
                <span 
                  className={`
                    relative z-10 text-[10px] font-semibold tracking-wide
                    ${isActive ? 'font-bold' : 'font-medium'}
                  `}
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
