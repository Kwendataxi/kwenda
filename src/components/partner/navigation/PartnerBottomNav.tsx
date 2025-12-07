import { motion } from 'framer-motion';
import { 
  Home, 
  Car, 
  Users, 
  Wallet, 
  User
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
        "bottom-nav-standard lg:hidden",
        className
      )}
    >
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {/* Background highlight */}
              {isActive && (
                <motion.div
                  layoutId="partnerTabBackground"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
              
              <div className="relative z-10">
                <motion.div
                  animate={{
                    scale: isActive ? [1, 1.15, 1] : 1,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive && "drop-shadow-sm"
                    )} 
                  />
                </motion.div>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="partnerActiveIndicator"
                    className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
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
                  "relative z-10 text-[10px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
