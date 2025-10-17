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
  XCircle,
  UtensilsCrossed,
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
  badge?: string;
}> = [
  // Tableau de bord
  { id: 'overview', label: "Vue d'ensemble", icon: BarChart3, group: 'dashboard' },
  
  // Finances & Abonnements
  { id: 'financial-stats', label: 'Statistiques Revenus', icon: PieChart, group: 'finance' },
  { id: 'subscriptions', label: 'Abonnements', icon: Package, group: 'finance' },
  { id: 'subscription-config', label: 'Configuration Plans', icon: Settings, group: 'finance', badge: 'CONFIG' },
  
  // Transport
  { id: 'tarifs', label: 'Tarifs', icon: Tag, group: 'transport' },
  { id: 'zones', label: 'Zones', icon: MapPin, group: 'transport' },
  { id: 'dispatch', label: 'Dispatch NG', icon: Zap, group: 'transport' },
  { id: 'location', label: 'Location', icon: Car, group: 'transport' },
  { id: 'vehicle-types', label: 'Types de véhicules', icon: Car, group: 'transport' },
  { id: 'services', label: 'Services', icon: Cog, group: 'transport' },
  
  // Gestion des utilisateurs
  { id: 'drivers', label: 'Chauffeurs', icon: Car, group: 'users' },
  { id: 'partners', label: 'Partenaires', icon: Building, group: 'users' },
  { id: 'users', label: 'Utilisateurs', icon: Users, group: 'users' },
  { id: 'teams', label: 'Équipes', icon: Users, group: 'users' },
  { id: 'roles', label: 'Gestion Rôles', icon: Settings, group: 'users' },
  
  // Commerce
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'commerce' },
  { id: 'marketplace-products', label: 'Modération Produits', icon: Package, group: 'commerce', badge: 'NEW' },
  { id: 'food', label: 'Kwenda Food', icon: UtensilsCrossed, group: 'commerce', badge: 'NEW' },
  { id: 'promocodes', label: 'Codes Promo', icon: Tag, group: 'commerce' },
  { id: 'lottery', label: 'Tombola', icon: Trophy, group: 'commerce' },
  
  // Communication
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'communication' },
  { id: 'push-notifications', label: 'Notifications Push', icon: Megaphone, group: 'communication' },
  { id: 'support', label: 'Support', icon: Headphones, group: 'communication' },
  
  // Analytics & Rapports
  { id: 'cancellations', label: 'Annulations', icon: XCircle, group: 'analytics' },
  
  // Système
  { id: 'mission-control', label: 'Mission Control', icon: Shield, group: 'system' },
  { id: 'settings', label: 'Paramètres', icon: Settings, group: 'system' },
  { id: 'migration', label: 'Migration Google', icon: MapPin, group: 'system' },
  { id: 'test-data', label: 'Données de Test', icon: Database, group: 'system', devMode: true },
];

const GROUP_LABELS = {
  dashboard: 'Tableau de bord',
  finance: 'Finances & Abonnements',
  transport: 'Transport & Logistique',
  users: 'Gestion des utilisateurs',
  commerce: 'Commerce & Marketing',
  communication: 'Communication',
  analytics: 'Analytics & Rapports',
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
    const defaults = saved ? JSON.parse(saved) : {};
    // Forcer l'ouverture du groupe finance pour visibilité des plans d'abonnement
    defaults.finance = false;
    return defaults;
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
    <div className={cn('flex flex-col h-full w-full', className)}>
      {/* Barre de recherche mobile - fixe */}
      {isMobile && (
        <div className="shrink-0 p-3 border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background/50"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 w-full admin-scrollbar">
        <nav role="navigation" aria-label="Navigation admin" className="p-3 pb-20 space-y-2 smooth-scroll">
          {Object.entries(filteredGroups).map(([groupKey, items], groupIndex) => {
            const isExpanded = isGroupExpanded(groupKey);
            const groupLabel = GROUP_LABELS[groupKey as keyof typeof GROUP_LABELS] || groupKey;
            
            return (
              <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                {groupIndex > 0 && <Separator className="my-3" />}
                
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-between px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/40 rounded-md',
                      isMobile && 'h-11 text-sm'
                    )}
                  >
                    <span>{groupLabel}</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 mt-1 pl-2">
                  {items.map(({ id, label, icon: Icon, devMode: isDevMode, badge }) => {
                    const active = activeTab === id;
                    return (
                      <Button
                        key={id}
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          'w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium rounded-md transition-all',
                          active 
                            ? 'bg-secondary text-secondary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                          isMobile && 'py-2.5 text-base'
                        )}
                        onClick={() => onTabChange(id)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded">
                            {badge}
                          </span>
                        )}
                        {isDevMode && (
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded">
                            DEV
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
        
        {/* Gradient fade indicator at bottom - plus visible */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
      </ScrollArea>
    </div>
  );
};

export default AdminVerticalNav;
