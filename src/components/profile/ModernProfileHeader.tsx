import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

// Animation variants - Plus rapides
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { type: "spring" as const, damping: 20, stiffness: 300 }
  }
};

// Particules réduites
const FloatingParticles = () => {
  const particles = useMemo(() => 
    [...Array(8)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 2,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 2
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-rose-500/15"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

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
        return { label: 'Conducteur', icon: Car, gradient: 'from-emerald-500 to-teal-500' };
      case 'partner': 
        return { label: 'Partenaire', icon: Building, gradient: 'from-amber-500 to-orange-500' };
      case 'premium': 
        return { label: 'Premium', icon: Crown, gradient: 'from-amber-400 to-yellow-300' };
      default: 
        return { label: 'Client', icon: User, gradient: 'from-rose-500 to-red-500' };
    }
  };

  const userTypeConfig = getUserTypeConfig(profile.user_type);
  const TypeIcon = userTypeConfig.icon;

  const handleAvatarUpload = (newUrl: string) => {
    setCurrentAvatarUrl(newUrl);
    setShowUpload(false);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Background gradient avec particules */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950/20 via-background to-rose-900/10" />
      <FloatingParticles />
      
      {/* Contenu principal - Compact */}
      <div className="relative px-3 py-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Card Glassmorphism - Layout Horizontal */}
          <Card className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl shadow-xl p-4">
            <div className="flex items-center gap-4">
              {/* Avatar avec Glow - Plus petit */}
              <motion.div variants={itemVariants} className="relative group shrink-0">
                {/* Glow effect subtil */}
                <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 to-red-500/20 rounded-full blur-lg opacity-60" />
                
                {/* Ring gradient animé - Plus fin */}
                <motion.div 
                  className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 via-red-500 to-rose-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Avatar 80px */}
                <Avatar className="relative w-20 h-20 border-2 border-background shadow-xl">
                  <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/50 dark:to-rose-800/50 text-rose-600 dark:text-rose-300">
                    {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Overlay camera */}
                <motion.div 
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowUpload(!showUpload)}
                >
                  <Camera className="h-5 w-5 text-white" />
                </motion.div>
                
                {/* Badge statut */}
                <motion.div 
                  className="absolute -bottom-0.5 -right-0.5"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-background shadow" />
                </motion.div>
              </motion.div>

              {/* Infos à droite */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Ligne 1: Nom + Badge */}
                <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 group/name">
                    <h1 className="text-lg font-bold text-foreground truncate">
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
                  
                  {/* Badge compact */}
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white",
                    "bg-gradient-to-r",
                    userTypeConfig.gradient
                  )}>
                    <TypeIcon className="h-3 w-3" />
                    {userTypeConfig.label}
                  </span>

                  {/* Rating inline */}
                  {rating && rating.total_ratings > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {rating.rating.toFixed(1)}
                    </span>
                  )}
                </motion.div>

                {/* Ligne 2: Email */}
                <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </motion.div>

                {/* Ligne 3: Téléphone */}
                <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-muted-foreground group/phone">
                  <Phone className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">
                    {profile.phone_number || "Ajouter un numéro"}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onEditPhone}
                    className="p-1 h-5 w-5 opacity-0 group-hover/phone:opacity-100 text-rose-400 hover:bg-rose-500/10 transition-all rounded-full ml-auto"
                  >
                    <Edit2 className="h-2.5 w-2.5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Upload component */}
      {showUpload && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10"
        >
          <Card className="backdrop-blur-xl bg-card/80 border border-white/10 rounded-xl shadow-xl p-3">
            <ProfilePictureUpload onUploadComplete={handleAvatarUpload} />
          </Card>
        </motion.div>
      )}
    </div>
  );
};
