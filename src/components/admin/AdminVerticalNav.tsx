import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface AdminVerticalNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
  devMode?: boolean;
  isMobile?: boolean;
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
  { id: 'vehicle-types', label: 'Types de véhicules', icon: Car, group: 'transport' },
  { id: 'services', label: 'Services', icon: Cog, group: 'transport' },
  
  // Gestion des utilisateurs
  { id: 'drivers', label: 'Chauffeurs', icon: Car, group: 'users' },
  { id: 'subscriptions', label: 'Abonnements 🎫', icon: Package, group: 'users' },
  { id: 'subscription-config', label: 'Configuration Plans', icon: Cog, group: 'users' },
  { id: 'partners', label: 'Partenaires', icon: Building, group: 'users' },
  { id: 'users', label: 'Utilisateurs', icon: Users, group: 'users' },
  { id: 'teams', label: 'Équipes', icon: Users, group: 'users' },
  { id: 'roles', label: 'Gestion Rôles', icon: Settings, group: 'users' },
  
  // Commerce
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'commerce' },
  { id: 'promocodes', label: 'Codes Promo', icon: Tag, group: 'commerce' },
  { id: 'lottery', label: 'Tombola', icon: Trophy, group: 'commerce' },
  
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
  devMode = true,
  isMobile = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('admin-nav-collapsed');
    return saved ? JSON.parse(saved) : {};
  });

  const groupedItems = NAV_ITEMS.reduce((groups, item) => {
    if (item.devMode && !devMode) return groups;
    
    const group = item.group || 'other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, typeof NAV_ITEMS>);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedItems;
    
    const filtered: Record<string, typeof NAV_ITEMS> = {};
    Object.entries(groupedItems).forEach(([groupKey, items]) => {
      const matchingItems = items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (GROUP_LABELS[groupKey as keyof typeof GROUP_LABELS] || groupKey)
          .toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingItems.length > 0) {
        filtered[groupKey] = matchingItems;
      }
    });
    return filtered;
  }, [groupedItems, searchQuery]);

  const toggleGroup = (groupKey: string) => {
    const newCollapsed = { 
      ...collapsedGroups, 
      [groupKey]: !collapsedGroups[groupKey] 
    };
    setCollapsedGroups(newCollapsed);
    localStorage.setItem('admin-nav-collapsed', JSON.stringify(newCollapsed));
  };

  const isGroupExpanded = (groupKey: string) => {
    // Si on recherche, toujours expanded
    if (searchQuery.trim()) return true;
    // Si le groupe contient l'onglet actif, toujours expanded
    const hasActiveItem = groupedItems[groupKey]?.some(item => item.id === activeTab);
    if (hasActiveItem) return true;
    // Sinon utiliser l'état sauvegardé (par défaut expanded)
    return !collapsedGroups[groupKey];
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Barre de recherche */}
      {isMobile && (
        <div className="p-3 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background/50"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <nav role="navigation" aria-label="Navigation admin" className="space-y-1 p-2">
          {Object.entries(filteredGroups).map(([groupKey, items], groupIndex) => {
            const isExpanded = isGroupExpanded(groupKey);
            const groupLabel = GROUP_LABELS[groupKey as keyof typeof GROUP_LABELS] || groupKey;
            
            return (
              <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                {groupIndex > 0 && <Separator className="my-2" />}
                
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-between p-2 h-8 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:bg-muted/30',
                      isMobile && 'h-10 text-sm'
                    )}
                  >
                    <span>{groupLabel}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 pl-1">
                  {items.map(({ id, label, icon: Icon, devMode: isDevMode }) => {
                    const active = activeTab === id;
                    return (
                      <Button
                        key={id}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-2 rounded-lg px-3 py-2 transition-all duration-200',
                          isMobile ? 'h-11 text-sm' : 'h-9 text-sm',
                          active 
                            ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20' 
                            : 'hover:bg-muted/50 hover:scale-[1.02]'
                        )}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => onTabChange(id)}
                      >
                        <Icon className={cn(
                          isMobile ? 'h-5 w-5' : 'h-4 w-4', 
                          active ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <span className="truncate flex-1 text-left">{label}</span>
                        {isDevMode && (
                          <Badge variant="secondary" className={cn(
                            'text-xs px-1',
                            isMobile ? 'h-5' : 'h-4'
                          )}>
                            DEV
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
};

export default AdminVerticalNav;
