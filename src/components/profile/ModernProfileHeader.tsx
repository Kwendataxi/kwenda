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
  const getUserTypeVariant = (userType: string) => {
    switch (userType) {
      case 'driver': return 'congo-electric';
      case 'partner': return 'congo-vibrant';
      case 'premium': return 'congo-glow';
      default: return 'secondary';
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'driver': return 'Conducteur';
      case 'partner': return 'Partenaire';
      case 'premium': return 'Premium';
      default: return 'Client';
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background with Congo gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-congo-red/10 via-congo-yellow/5 to-congo-blue/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-congo-yellow/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-1/2 -left-4 w-16 h-16 bg-congo-red/10 rounded-full blur-lg animate-pulse delay-1000" />
        <div className="absolute bottom-0 right-1/3 w-20 h-20 bg-congo-blue/10 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      <div className="relative p-6 pt-8">
        <div className="flex items-start gap-4">
          {/* Avatar with glow effect */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-congo-red via-congo-yellow to-congo-blue rounded-full p-0.5 animate-pulse">
              <div className="bg-background rounded-full p-1">
                <Avatar className="w-20 h-20 border-2 border-white/20">
                  <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-congo-red to-congo-yellow text-white">
                    {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-congo-green rounded-full border-2 border-background flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name with edit button */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
              </h1>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditName}
                className="p-1 h-auto text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Phone with edit button */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted-foreground">
                {profile.phone_number || "Ajouter un numéro"}
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditPhone}
                className="p-1 h-auto text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Badges and Stats */}
            <div className="flex flex-wrap gap-2">
              {/* User Type Badge */}
              <Badge 
                variant="secondary" 
                className={cn(
                  "glassmorphism border-0 text-white font-medium",
                  getUserTypeVariant(profile.user_type) === 'congo-electric' && "bg-congo-red",
                  getUserTypeVariant(profile.user_type) === 'congo-vibrant' && "bg-congo-yellow text-foreground",
                  getUserTypeVariant(profile.user_type) === 'congo-glow' && "bg-congo-blue",
                  getUserTypeVariant(profile.user_type) === 'secondary' && "bg-secondary text-secondary-foreground"
                )}
              >
                <Shield className="h-3 w-3 mr-1" />
                {getUserTypeLabel(profile.user_type)}
              </Badge>

              {/* Rating Badge */}
              {rating && rating.total_ratings > 0 && (
                <Badge variant="outline" className="glassmorphism border-congo-yellow/30 text-congo-yellow">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {rating.rating} ({rating.total_ratings})
                </Badge>
              )}

              {/* Activity Badge */}
              <Badge variant="outline" className="glassmorphism border-congo-green/30 text-congo-green">
                <Zap className="h-3 w-3 mr-1" />
                Actif
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress bar for profile completion */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Profil complété</span>
            <span className="text-sm font-medium text-congo-yellow">
              {profile.display_name && profile.phone_number ? '90%' : '60%'}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-gradient-to-r from-congo-red via-congo-yellow to-congo-green rounded-full transition-all duration-1000",
                profile.display_name && profile.phone_number ? "w-[90%]" : "w-[60%]"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};