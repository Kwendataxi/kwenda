import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Shield,
  Cog,
  Package,
  
} from 'lucide-react';

interface AdminVerticalNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
  devMode?: boolean;
}

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
  devMode?: boolean;
}> = [
  // Tableau de bord
  { id: 'overview', label: "Vue d'ensemble", icon: BarChart3, group: 'dashboard' },
  
  // Finances
  { id: 'credits', label: 'Crédits Chauffeurs', icon: CreditCard, group: 'finance' },
  { id: 'commissions', label: 'Commissions', icon: Percent, group: 'finance' },
  { id: 'financial', label: 'Dashboard Financier', icon: PieChart, group: 'finance' },
  
  // Transport
  { id: 'tarifs', label: 'Tarifs', icon: Tag, group: 'transport' },
  { id: 'zones', label: 'Zones', icon: MapPin, group: 'transport' },
  { id: 'dispatch', label: 'Dispatch NG', icon: Zap, group: 'transport' },
  { id: 'location', label: 'Location', icon: Car, group: 'transport' },
  { id: 'services', label: 'Services', icon: Cog, group: 'transport' },
  
  // Gestion des utilisateurs
  { id: 'drivers', label: 'Chauffeurs', icon: Car, group: 'users' },
  { id: 'partners', label: 'Partenaires', icon: Building, group: 'users' },
  { id: 'users', label: 'Utilisateurs', icon: Users, group: 'users' },
  { id: 'teams', label: 'Équipes', icon: Users, group: 'users' },
  { id: 'roles', label: 'Gestion Rôles', icon: Settings, group: 'users' },
  
  // Commerce
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'commerce' },
  { id: 'promocodes', label: 'Codes Promo', icon: Tag, group: 'commerce' },
  { id: 'lottery', label: 'Tombola', icon: Trophy, group: 'commerce' },
  { id: 'subscriptions', label: 'Abonnements', icon: Package, group: 'commerce' },
  
  // Communication
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'communication' },
  { id: 'ads', label: 'Publicités', icon: Megaphone, group: 'communication' },
  { id: 'support', label: 'Support', icon: Headphones, group: 'communication' },
  
  // Système
  { id: 'mission-control', label: 'Mission Control', icon: Shield, group: 'system' },
  { id: 'settings', label: 'Paramètres', icon: Settings, group: 'system' },
  { id: 'migration', label: 'Migration Google', icon: MapPin, group: 'system' },
  { id: 'test-data', label: 'Données de Test', icon: Database, group: 'system', devMode: true },
];

const GROUP_LABELS = {
  dashboard: 'Tableau de bord',
  finance: 'Finances',
  transport: 'Transport & Logistique',
  users: 'Gestion des utilisateurs',
  commerce: 'Commerce & Marketing',
  communication: 'Communication',
  system: 'Système & Configuration'
};

export const AdminVerticalNav: React.FC<AdminVerticalNavProps> = ({ 
  activeTab, 
  onTabChange, 
  className, 
  devMode = true 
}) => {
  const groupedItems = NAV_ITEMS.reduce((groups, item) => {
    if (item.devMode && !devMode) return groups;
    
    const group = item.group || 'other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, typeof NAV_ITEMS>);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <nav role="navigation" aria-label="Navigation admin" className="space-y-2 p-2">
        {Object.entries(groupedItems).map(([groupKey, items], groupIndex) => (
          <div key={groupKey}>
            {groupIndex > 0 && <Separator className="my-3" />}
            
            <div className="px-2 py-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {GROUP_LABELS[groupKey as keyof typeof GROUP_LABELS] || groupKey}
              </h3>
            </div>
            
            <div className="space-y-1">
              {items.map(({ id, label, icon: Icon, devMode: isDevMode }) => {
                const active = activeTab === id;
                return (
                  <Button
                    key={id}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-2 rounded-lg px-3 py-2 transition-colors h-9',
                      active ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'
                    )}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => onTabChange(id)}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="truncate flex-1 text-left">{label}</span>
                    {isDevMode && (
                      <Badge variant="secondary" className="h-4 text-xs px-1">
                        DEV
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
};

export default AdminVerticalNav;
