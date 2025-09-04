import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  MoreVertical, 
  Star, 
  TrendingUp,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DriverProfile {
  display_name: string;
  rating_average: number;
  total_rides: number;
  profile_photo_url?: string;
}

interface ModernDriverHeaderProps {
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const ModernDriverHeader: React.FC<ModernDriverHeaderProps> = ({
  onProfileClick,
  onSettingsClick
}) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger le profil du chauffeur
  useEffect(() => {
    const loadDriverProfile = async () => {
      if (!user) return;

      try {
        // Essayer de récupérer depuis chauffeurs d'abord
        let { data: chauffeurData } = await supabase
          .from('chauffeurs')
          .select('display_name, rating_average, total_rides')
          .eq('user_id', user.id)
          .single();

        if (chauffeurData) {
          setProfile({
            display_name: chauffeurData.display_name || 'Chauffeur',
            rating_average: chauffeurData.rating_average || 0,
            total_rides: chauffeurData.total_rides || 0
          });
        } else {
          // Sinon récupérer depuis driver_profiles
          const { data: profileData } = await supabase
            .from('driver_profiles')
            .select('rating_average, total_rides, profile_photo_url')
            .eq('user_id', user.id)
            .single();

          setProfile({
            display_name: user.user_metadata?.display_name || 'Chauffeur',
            rating_average: profileData?.rating_average || 0,
            total_rides: profileData?.total_rides || 0,
            profile_photo_url: profileData?.profile_photo_url
          });
        }
      } catch (error) {
        console.error('Error loading driver profile:', error);
        // Utiliser les données de base de l'utilisateur
        setProfile({
          display_name: user.user_metadata?.display_name || 'Chauffeur',
          rating_average: 0,
          total_rides: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadDriverProfile();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading || !profile) {
    return (
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={profile.profile_photo_url} alt={profile.display_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {getGreeting()}, {profile.display_name}
              </h1>
              <Badge variant="secondary" className="text-xs">
                Kwenda Pro
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {profile.rating_average > 0 ? profile.rating_average.toFixed(1) : 'Nouveau'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{profile.total_rides} courses</span>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default ModernDriverHeader;