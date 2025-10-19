import { useNavigate } from 'react-router-dom';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSelectedRole } from '@/hooks/useSelectedRole';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { UserRole } from '@/types/roles';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  User, 
  Car, 
  Building2, 
  Store, 
  UtensilsCrossed, 
  Shield, 
  LogOut,
  Users,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AccountSwitcher } from './AccountSwitcher';
import { motion } from 'framer-motion';

interface AppConfig {
  id: UserRole;
  name: string;
  description: string;
  route: string;
  icon: React.ComponentType<any>;
  gradient: string;
  emoji: string;
  requiredRole: UserRole;
}

const APP_CONFIGS: AppConfig[] = [
  {
    id: 'client',
    name: 'Client',
    description: 'Réserver courses et services',
    route: '/client',
    icon: User,
    gradient: 'from-red-500 to-pink-600',
    emoji: '👤',
    requiredRole: 'client'
  },
  {
    id: 'driver',
    name: 'Chauffeur',
    description: 'Gagner en conduisant',
    route: '/chauffeur',
    icon: Car,
    gradient: 'from-orange-500 to-yellow-600',
    emoji: '🚗',
    requiredRole: 'driver'
  },
  {
    id: 'partner',
    name: 'Partenaire',
    description: 'Gérer ma flotte',
    route: '/partenaire',
    icon: Building2,
    gradient: 'from-blue-500 to-cyan-600',
    emoji: '🏢',
    requiredRole: 'partner'
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Gérer mon restaurant',
    route: '/restaurant',
    icon: UtensilsCrossed,
    gradient: 'from-green-500 to-emerald-600',
    emoji: '🍽️',
    requiredRole: 'restaurant'
  },
  {
    id: 'admin',
    name: 'Administration',
    description: 'Gérer la plateforme',
    route: '/admin',
    icon: Shield,
    gradient: 'from-gray-700 to-gray-900',
    emoji: '⚙️',
    requiredRole: 'admin'
  }
];

interface AppSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppSwitcherSheet = ({ 
  open, 
  onOpenChange 
}: AppSwitcherSheetProps) => {
  const navigate = useNavigate();
  const { userRoles, primaryRole } = useUserRoles();
  const { setSelectedRole } = useSelectedRole();
  const { displayName } = useProfile();

  // Filtrer les apps disponibles selon les rôles de l'utilisateur
  // Masquer l'option Admin pour les utilisateurs non-admins
  const availableApps = APP_CONFIGS.filter(app => {
    const hasRole = userRoles.some(role => role.role === app.requiredRole);
    return hasRole;
  });

  const handleAppSwitch = async (app: AppConfig) => {
    try {
      // 1. Mettre à jour le rôle sélectionné
      setSelectedRole(app.requiredRole);
      
      // 2. Transition visuelle
      onOpenChange(false);
      
      // 3. Navigation
      setTimeout(() => {
        navigate(app.route);
      }, 200);
      
      toast({
        title: `Bienvenue dans ${app.name}`,
        description: app.description,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de basculer vers cette application",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl bg-background/95 backdrop-blur-xl"
      >
        {/* Header glassmorphism moderne */}
        <SheetHeader className="pb-8 text-center border-b border-border/50">
          <div className="flex flex-col items-center gap-6">
            {/* Avatar avec anneau animé */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-congo-red to-congo-yellow rounded-full blur-md opacity-60 animate-pulse" />
              <Avatar className="h-20 w-20 relative z-10 border-4 border-background shadow-2xl">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-bold">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Nom avec gradient */}
            <div className="space-y-2">
              <SheetTitle className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {displayName}
              </SheetTitle>
              <SheetDescription className="text-base text-muted-foreground">
                Choisissez votre espace de travail
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs pour Applications et Comptes */}
        <Tabs defaultValue="apps" className="flex-1 mt-6">
          <TabsList className="w-full grid grid-cols-2 mb-6 bg-muted/50">
            <TabsTrigger value="apps" className="text-base">
              Applications
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-base">
              <Users className="h-4 w-4 mr-2" />
              Comptes
            </TabsTrigger>
          </TabsList>

          {/* Onglet Applications */}
          <TabsContent value="apps" className="h-[calc(90vh-340px)] mt-0">
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-2 gap-4 pb-6">
                {availableApps.map((app) => {
                  const isActive = primaryRole === app.requiredRole;

                  return (
                    <motion.button
                      key={app.id}
                      onClick={() => handleAppSwitch(app)}
                      disabled={isActive}
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={cn(
                        "relative group overflow-hidden rounded-3xl p-8 transition-all duration-500",
                        "bg-gradient-to-br shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]",
                        "border border-white/10 backdrop-blur-sm",
                        app.gradient,
                        isActive 
                          ? "ring-4 ring-primary/50 shadow-[0_0_40px_rgba(var(--primary),0.4)]" 
                          : ""
                      )}
                    >
                      {/* Badge "Actif" avec glow */}
                      {isActive && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs font-bold text-gray-800">Actif</span>
                        </div>
                      )}

                      {/* Effet de brillance au survol */}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Contenu */}
                      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                        {/* Emoji avec animation */}
                        <motion.div 
                          className="text-6xl"
                          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {app.emoji}
                        </motion.div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-white drop-shadow-lg">
                            {app.name}
                          </h3>
                          <p className="text-white/90 text-sm font-medium">
                            {app.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Onglet Comptes */}
          <TabsContent value="accounts" className="h-[calc(90vh-340px)] mt-0">
            <ScrollArea className="h-full">
              <AccountSwitcher />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer modernisé */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background/80 backdrop-blur-xl space-y-3">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/auth');
            }}
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
