import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit2, Camera, Star, User, Car, Building, Crown, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { motion } from 'framer-motion';

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

  const getUserTypeConfig = (userType: string) => {
    switch (userType) {
      case 'driver': 
        return { 
          label: 'Conducteur', 
          icon: Car,
          gradient: 'from-emerald-500 to-teal-500'
        };
      case 'partner': 
        return { 
          label: 'Partenaire', 
          icon: Building,
          gradient: 'from-amber-500 to-orange-500'
        };
      case 'premium': 
        return { 
          label: 'Premium', 
          icon: Crown,
          gradient: 'from-amber-400 to-yellow-300'
        };
      default: 
        return { 
          label: 'Client', 
          icon: User,
          gradient: 'from-rose-500 to-red-500'
        };
    }
  };

  const userTypeConfig = getUserTypeConfig(profile.user_type);
  const TypeIcon = userTypeConfig.icon;

  const handleAvatarUpload = (newUrl: string) => {
    setCurrentAvatarUrl(newUrl);
    setShowUpload(false);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background subtil */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent" />
      
      {/* Contenu principal */}
      <div className="relative px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar avec Ring */}
          <div className="relative group mb-4">
            {/* Ring gradient */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-red-500 rounded-full opacity-70" />
            
            {/* Avatar principal */}
            <Avatar className="relative w-24 h-24 border-3 border-background shadow-lg">
              <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300">
                {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Overlay camera */}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 text-white hover:bg-white/20 rounded-full h-9 w-9"
                onClick={() => setShowUpload(!showUpload)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Badge statut en ligne */}
            <div className="absolute -bottom-0.5 -right-0.5">
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
          </div>

          {/* Nom */}
          <div className="flex items-center gap-2 group/name mb-1">
            <h1 className="text-xl font-bold text-foreground">
              {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
            </h1>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEditName}
              className="p-1 h-6 w-6 opacity-0 group-hover/name:opacity-100 text-rose-500 hover:bg-rose-500/10 transition-all rounded-full"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Badge Type Utilisateur */}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm mb-4",
            "bg-gradient-to-r",
            userTypeConfig.gradient
          )}>
            <TypeIcon className="h-3.5 w-3.5" />
            <span>{userTypeConfig.label}</span>
          </div>

          {/* Informations de contact */}
          <div className="space-y-2 w-full max-w-xs">
            {/* Email */}
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
              <Mail className="h-4 w-4 text-rose-500" />
              <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
            </div>
            
            {/* Téléphone */}
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-muted/50 group/phone">
              <Phone className="h-4 w-4 text-rose-500" />
              <span className="text-sm text-muted-foreground truncate flex-1 text-center">
                {profile.phone_number || "Ajouter un numéro"}
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditPhone}
                className="p-1 h-5 w-5 opacity-0 group-hover/phone:opacity-100 text-rose-500 hover:bg-rose-500/10 transition-all rounded-full"
              >
                <Edit2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>

          {/* Rating */}
          {rating && rating.total_ratings > 0 && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      star <= Math.round(rating.rating) 
                        ? "fill-amber-400 text-amber-400" 
                        : "fill-transparent text-amber-300/50"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {rating.rating.toFixed(1)}
              </span>
              <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                ({rating.total_ratings})
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Upload component */}
      {showUpload && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10"
        >
          <ProfilePictureUpload onUploadComplete={handleAvatarUpload} />
        </motion.div>
      )}
    </div>
  );
};
