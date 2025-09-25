import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Camera, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfilePictureUpload } from './ProfilePictureUpload';

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
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile.avatar_url);
  const [showUpload, setShowUpload] = useState(false);

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'driver': return 'Conducteur';
      case 'partner': return 'Partenaire';
      case 'premium': return 'Premium';
      default: return 'Client';
    }
  };

  const handleAvatarUpload = (newUrl: string) => {
    setCurrentAvatarUrl(newUrl);
    setShowUpload(false);
  };

  return (
    <div className={cn("relative p-6 bg-gradient-to-br from-background to-accent/5 border-b border-border/50", className)}>
      <div className="flex items-start gap-6">
        {/* Avatar avec bouton de changement de photo */}
        <div className="relative group">
          <Avatar className="w-20 h-20 border-3 border-primary/20 shadow-lg transition-all duration-300 group-hover:border-primary/40">
            <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
              {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Bouton pour changer la photo */}
          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-2 text-white hover:bg-white/20 rounded-full"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Upload component conditionnel */}
          {showUpload && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <ProfilePictureUpload onUploadComplete={handleAvatarUpload} />
            </div>
          )}
          
          {/* Indicateur de statut en ligne */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-background shadow-sm">
            <div className="w-full h-full rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>

        {/* Informations utilisateur */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Nom complet sans troncature */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground leading-tight break-words">
                  {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.email}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditName}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Numéro de téléphone */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex-1">
              📞 {profile.phone_number || "Ajouter un numéro"}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEditPhone}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Badges et statuts */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
              {getUserTypeLabel(profile.user_type)}
            </Badge>

            {/* Rating mis en évidence */}
            {rating && rating.total_ratings > 0 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {rating.rating}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  ({rating.total_ratings} avis)
                </span>
              </div>
            )}

            <Badge variant="outline" className="px-3 py-1 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30">
              🟢 Actif
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};