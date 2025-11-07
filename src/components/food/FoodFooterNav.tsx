import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
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
  { id: 'profile', label: 'Profil', icon: User, path: '/app/client' },
];

export const FoodFooterNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-40 md:hidden safe-area-inset-bottom">
      <nav className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </footer>
  );
};
