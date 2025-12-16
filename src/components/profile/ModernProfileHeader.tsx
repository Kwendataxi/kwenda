import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
          gradient: 'from-emerald-500 to-teal-500',
          bgGradient: 'from-emerald-500/20 to-teal-500/20'
        };
      case 'partner': 
        return { 
          label: 'Partenaire', 
          icon: Building,
          gradient: 'from-amber-500 to-orange-500',
          bgGradient: 'from-amber-500/20 to-orange-500/20'
        };
      case 'premium': 
        return { 
          label: 'Premium', 
          icon: Crown,
          gradient: 'from-amber-400 to-yellow-300',
          bgGradient: 'from-amber-400/20 to-yellow-300/20'
        };
      default: 
        return { 
          label: 'Client', 
          icon: User,
          gradient: 'from-violet-500 to-indigo-500',
          bgGradient: 'from-violet-500/20 to-indigo-500/20'
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
      {/* Background avec gradient animé et mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-purple-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-400/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent" />
      
      {/* Particules flottantes */}
      <div className="absolute top-4 right-8 w-2 h-2 bg-violet-400/30 rounded-full animate-pulse" />
      <div className="absolute top-12 right-16 w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Contenu principal - Layout centré */}
      <div className="relative px-4 py-8 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar Premium avec Ring Gradient Animé */}
          <div className="relative group mb-4">
            {/* Ring gradient animé */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 rounded-full animate-spin-slow opacity-75 blur-sm group-hover:opacity-100 transition-opacity" 
                 style={{ animation: 'spin 4s linear infinite' }} />
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 rounded-full opacity-50" />
            
            {/* Avatar principal */}
            <Avatar className="relative w-24 h-24 border-4 border-background shadow-xl transition-all duration-300 group-hover:scale-105">
              <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 text-violet-600 dark:text-violet-300">
                {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Overlay camera élégant */}
            <motion.div 
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              <Button 
                size="sm" 
                variant="ghost" 
                className="p-2 text-white hover:bg-white/20 rounded-full h-10 w-10"
                onClick={() => setShowUpload(!showUpload)}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </motion.div>
            
            {/* Badge statut en ligne amélioré */}
            <div className="absolute -bottom-1 -right-1">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-50" />
                <div className="relative w-5 h-5 bg-emerald-500 rounded-full border-3 border-background shadow-lg" />
              </div>
            </div>
          </div>

          {/* Nom avec édition */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 group/name mb-1"
          >
            <h1 className="text-2xl font-bold text-foreground">
              {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
            </h1>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEditName}
              className="p-1.5 h-7 w-7 opacity-0 group-hover/name:opacity-100 text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 transition-all duration-200 rounded-full"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>

          {/* Badge Type Utilisateur Premium avec Shine */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4"
          >
            <div className={cn(
              "relative overflow-hidden inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg",
              "bg-gradient-to-r",
              userTypeConfig.gradient
            )}>
              {/* Effet shine animé */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine" />
              <TypeIcon className="h-4 w-4" />
              <span>{userTypeConfig.label}</span>
            </div>
          </motion.div>

          {/* Informations de contact */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 w-full max-w-xs"
          >
            {/* Email */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-violet-500/10">
              <Mail className="h-4 w-4 text-violet-500" />
              <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
            </div>
            
            {/* Téléphone */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-violet-500/10 group/phone">
              <Phone className="h-4 w-4 text-indigo-500" />
              <span className="text-sm text-muted-foreground truncate flex-1 text-center">
                {profile.phone_number || "Ajouter un numéro"}
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onEditPhone}
                className="p-1 h-6 w-6 opacity-0 group-hover/phone:opacity-100 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 transition-all duration-200 rounded-full"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>

          {/* Rating Premium */}
          {rating && rating.total_ratings > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-300/30 dark:border-amber-700/30"
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={cn(
                      "h-4 w-4 transition-all",
                      star <= Math.round(rating.rating) 
                        ? "fill-amber-400 text-amber-400" 
                        : "fill-transparent text-amber-300/50"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {rating.rating.toFixed(1)}
              </span>
              <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                ({rating.total_ratings} avis)
              </span>
            </motion.div>
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

      {/* Styles pour les animations */}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};
