import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  CreditCard,
  Percent,
  PieChart,
  Tag,
  MapPin,
  Car,
  Users,
  ShoppingBag,
  Headphones,
  Settings,
  Bell,
  Zap,
  Database,
  Megaphone,
  Trophy,
  Building,
} from 'lucide-react';

interface AdminVerticalNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
  { id: 'credits', label: 'Crédits Chauffeurs', icon: CreditCard },
  { id: 'commissions', label: 'Commissions', icon: Percent },
  { id: 'financial', label: 'Dashboard Financier', icon: PieChart },
  { id: 'tarifs', label: 'Tarifs', icon: Tag },
  { id: 'zones', label: 'Zones', icon: MapPin },
  { id: 'dispatch', label: 'Dispatch NG', icon: Zap },
  { id: 'location', label: 'Location', icon: Car },
  { id: 'drivers', label: 'Chauffeurs', icon: Car },
  { id: 'partners', label: 'Partenaires', icon: Building },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'teams', label: 'Équipes', icon: Users },
  { id: 'roles', label: 'Gestion Rôles', icon: Settings },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'promocodes', label: 'Codes Promo', icon: Tag },
  { id: 'lottery', label: 'Tombola', icon: Trophy },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ads', label: 'Publicités', icon: Megaphone },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'test-data', label: 'Données de Test', icon: Database },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export const AdminVerticalNav: React.FC<AdminVerticalNavProps> = ({ activeTab, onTabChange, className }) => {
  return (
    <ScrollArea className={cn('h-full', className)}>
      <nav role="navigation" aria-label="Navigation admin" className="space-y-1 p-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <Button
              key={id}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2 rounded-lg px-3 py-2 transition-colors',
                active ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'
              )}
              aria-current={active ? 'page' : undefined}
              onClick={() => onTabChange(id)}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
              <span className="truncate">{label}</span>
            </Button>
          );
        })}
      </nav>
    </ScrollArea>
  );
};

export default AdminVerticalNav;
