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
import { cn } from '@/lib/utils';
import { 
  User, 
  Car, 
  Building2, 
  Store, 
  UtensilsCrossed, 
  Shield, 
  LogOut 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    id: 'vendor',
    name: 'Vendeur',
    description: 'Vendre sur la marketplace',
    route: '/vendeur',
    icon: Store,
    gradient: 'from-purple-500 to-pink-600',
    emoji: '🛍️',
    requiredRole: 'vendor'
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
  const availableApps = APP_CONFIGS.filter(app => 
    userRoles.some(role => role.role === app.requiredRole)
  );

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
        className="h-[85vh] rounded-t-3xl"
      >
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl">{displayName}</SheetTitle>
              <SheetDescription>
                Choisissez votre espace de travail
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-180px)] pr-4">
          <div className="grid grid-cols-2 gap-4 pb-6">
            {availableApps.map((app) => {
              const isActive = primaryRole === app.requiredRole;

              return (
                <button
                  key={app.id}
                  onClick={() => handleAppSwitch(app)}
                  disabled={isActive}
                  className={cn(
                    "relative group overflow-hidden rounded-2xl p-6 transition-all duration-300",
                    "bg-gradient-to-br shadow-lg hover:shadow-2xl hover:scale-105",
                    "border-2",
                    app.gradient,
                    isActive 
                      ? "ring-4 ring-white/50 scale-105 opacity-90" 
                      : "border-transparent"
                  )}
                >
                  {isActive && (
                    <Badge className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm">
                      ✓ Actif
                    </Badge>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                    <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
                      {app.emoji}
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {app.name}
                    </h3>

                    <p className="text-white/90 text-xs font-medium">
                      {app.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/auth');
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
