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
    <div className={cn("relative px-4 py-6 bg-gradient-to-br from-background to-primary/[0.02] border-b border-border/30", className)}>
      {/* Header principal avec layout optimisé */}
      <div className="flex items-center gap-4">
        {/* Avatar compact avec overlay discret */}
        <div className="relative group">
          <Avatar className="w-16 h-16 border-2 border-primary/10 shadow-sm transition-all duration-200 group-hover:border-primary/20">
            <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/5 to-primary/10 text-primary">
              {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Overlay subtil pour changement de photo */}
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1.5 text-white hover:bg-white/20 rounded-full h-8 w-8"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Statut en ligne minimaliste */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
        </div>

        {/* Informations principales */}
        <div className="flex-1 min-w-0">
          {/* Nom avec bouton d'édition discret */}
          <div className="flex items-center gap-2 group/name">
            <h1 className="text-xl font-bold text-foreground truncate">
              {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
            </h1>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEditName}
              className="p-1 h-6 w-6 opacity-0 group-hover/name:opacity-100 text-muted-foreground hover:text-primary transition-all duration-200"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Email secondaire */}
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {user?.email}
          </p>
          
          {/* Téléphone avec édition */}
          <div className="flex items-center gap-2 mt-1 group/phone">
            <span className="text-sm text-muted-foreground truncate flex-1">
              {profile.phone_number || "Ajouter un numéro"}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEditPhone}
              className="p-1 h-5 w-5 opacity-0 group-hover/phone:opacity-100 text-muted-foreground hover:text-primary transition-all duration-200"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Badges et métriques */}
      <div className="flex items-center justify-between mt-4">
        {/* Type d'utilisateur discret */}
        <Badge variant="secondary" className="px-2.5 py-1 text-xs font-medium bg-primary/5 text-primary border-primary/10">
          {getUserTypeLabel(profile.user_type)}
        </Badge>

        {/* Rating compact si disponible */}
        {rating && rating.total_ratings > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/50">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {rating.rating}
            </span>
            <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
              ({rating.total_ratings})
            </span>
          </div>
        )}
      </div>

      {/* Upload component positionné discrètement */}
      {showUpload && (
        <div className="absolute top-full left-4 mt-2 z-10">
          <ProfilePictureUpload onUploadComplete={handleAvatarUpload} />
        </div>
      )}
    </div>
  );
};