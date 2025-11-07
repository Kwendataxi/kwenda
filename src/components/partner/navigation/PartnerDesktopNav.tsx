import { motion } from 'framer-motion';
import { 
  Home, 
  Car, 
  Users, 
  Wallet, 
  User,
  BarChart3,
  Package,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PartnerNavTab } from './PartnerBottomNav';

interface PartnerDesktopNavProps {
  activeTab: PartnerNavTab;
  onTabChange: (tab: PartnerNavTab) => void;
  className?: string;
}

const tabs = [
  { 
    id: 'dashboard' as PartnerNavTab, 
    label: 'Vue d\'ensemble', 
    icon: Home,
    description: 'Statistiques et KPI'
  },
  { 
    id: 'fleet' as PartnerNavTab, 
    label: 'Flotte', 
    icon: Car,
    description: 'Gestion des véhicules'
  },
  { 
    id: 'drivers' as PartnerNavTab, 
    label: 'Chauffeurs', 
    icon: Users,
    description: 'Gestion des chauffeurs'
  },
  { 
    id: 'deliveries' as PartnerNavTab, 
    label: 'Livraisons', 
    icon: Package,
    description: 'Suivi des commandes'
  },
  { 
    id: 'wallet' as PartnerNavTab, 
    label: 'Finances', 
    icon: Wallet,
    description: 'Revenus et transactions'
  },
  { 
    id: 'analytics' as PartnerNavTab, 
    label: 'Analytics', 
    icon: BarChart3,
    description: 'Rapports et statistiques'
  },
  { 
    id: 'profile' as PartnerNavTab, 
    label: 'Profil', 
    icon: User,
    description: 'Paramètres du compte'
  }
];

export const PartnerDesktopNav = ({ 
  activeTab, 
  onTabChange,
  className 
}: PartnerDesktopNavProps) => {
  return (
    <nav className={cn(
      "hidden lg:flex items-center gap-2 px-4 py-3",
      "backdrop-blur-xl bg-white/50 dark:bg-gray-900/50",
      "border-b border-gray-200/50 dark:border-gray-700/50",
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              isActive && "bg-emerald-50 dark:bg-emerald-900/30"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon 
              className={cn(
                "w-5 h-5 transition-colors duration-200",
                isActive 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-gray-600 dark:text-gray-400"
              )} 
            />
            
            <div className="flex flex-col items-start">
              <span 
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isActive 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {tab.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {tab.description}
              </span>
            </div>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="desktopActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full"
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
    </nav>
  );
};
