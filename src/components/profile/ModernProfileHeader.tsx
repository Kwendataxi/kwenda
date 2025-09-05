import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Shield, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernProfileHeaderProps {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    phone_number: string | null;
    user_type: string;
  };
  user: {
    email?: string;
  };
  rating?: {
    rating: number;
    total_ratings: number;
  };
  onEditName?: () => void;
  onEditPhone?: () => void;
  className?: string;
}

export const ModernProfileHeader = ({
  profile,
  user,
  rating,
  onEditName,
  onEditPhone,
  className
}: ModernProfileHeaderProps) => {
  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'driver': return 'Conducteur';
      case 'partner': return 'Partenaire';
      case 'premium': return 'Premium';
      default: return 'Client';
    }
  };

  return (
    <div className={cn("relative p-6 bg-gradient-to-br from-background to-accent/5 border-b border-border/50", className)}>
      <div className="flex items-center gap-4">
        {/* Avatar simple et élégant */}
        <div className="relative">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Indicateur de statut simple */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Nom avec bouton d'édition discret */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold text-foreground truncate">
              {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
            </h1>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEditName}
              className="p-1 h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Informations secondaires */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-muted-foreground">
              {profile.phone_number || "Ajouter un numéro"}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEditPhone}
              className="p-1 h-5 w-5 text-muted-foreground hover:text-primary opacity-60 hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-2.5 w-2.5" />
            </Button>
          </div>

          {/* Badges simplifiés */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {getUserTypeLabel(profile.user_type)}
            </Badge>

            {/* Rating proéminent */}
            {rating && rating.total_ratings > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {rating.rating}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  ({rating.total_ratings})
                </span>
              </div>
            )}

            <Badge variant="outline" className="text-xs border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
              Actif
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};