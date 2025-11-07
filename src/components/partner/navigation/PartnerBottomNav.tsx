import { motion } from 'framer-motion';
import { 
  Home, 
  Car, 
  Users, 
  Wallet, 
  User,
  BarChart3,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PartnerNavTab = 
  | 'dashboard' 
  | 'fleet' 
  | 'drivers' 
  | 'deliveries'
  | 'wallet' 
  | 'analytics'
  | 'profile';

interface PartnerBottomNavProps {
  activeTab: PartnerNavTab;
  onTabChange: (tab: PartnerNavTab) => void;
  className?: string;
}

const tabs = [
  { 
    id: 'dashboard' as PartnerNavTab, 
    label: 'Accueil', 
    icon: Home 
  },
  { 
    id: 'fleet' as PartnerNavTab, 
    label: 'Flotte', 
    icon: Car 
  },
  { 
    id: 'drivers' as PartnerNavTab, 
    label: 'Chauffeurs', 
    icon: Users 
  },
  { 
    id: 'wallet' as PartnerNavTab, 
    label: 'Finances', 
    icon: Wallet 
  },
  { 
    id: 'profile' as PartnerNavTab, 
    label: 'Profil', 
    icon: User 
  }
];

export const PartnerBottomNav = ({ 
  activeTab, 
  onTabChange,
  className 
}: PartnerBottomNavProps) => {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "backdrop-blur-xl bg-white/90 dark:bg-gray-900/90",
        "border-t border-gray-200/50 dark:border-gray-700/50",
        "shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-gray-600 dark:text-gray-400"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                >
                  <Icon 
                    className={cn(
                      "w-6 h-6 transition-all duration-200",
                      isActive && "drop-shadow-lg"
                    )} 
                  />
                </motion.div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </div>

              <span 
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {tab.label}
              </span>

              {/* Background highlight */}
              {isActive && (
                <motion.div
                  layoutId="tabBackground"
                  className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl -z-10"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
