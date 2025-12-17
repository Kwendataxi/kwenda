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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, damping: 25, stiffness: 200 }
  }
};

// Composant Particules
const FloatingParticles = () => {
  const particles = useMemo(() => 
    [...Array(15)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-rose-500/20"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
            y: [0, -10, 0],
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
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      {/* Background gradient avec particules */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950/30 via-background to-rose-900/20" />
      <FloatingParticles />
      
      {/* Contenu principal */}
      <div className="relative px-4 py-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          {/* Card Glassmorphism */}
          <Card className="w-full max-w-sm backdrop-blur-xl bg-card/40 border border-white/10 rounded-3xl shadow-2xl p-6">
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              {/* Avatar avec Glow */}
              <div className="relative group mb-5">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/30 to-red-500/30 rounded-full blur-xl opacity-70" />
                
                {/* Ring gradient animé */}
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: '200% 100%' }}
                />
                
                {/* Avatar principal */}
                <Avatar className="relative w-28 h-28 border-4 border-background shadow-2xl">
                  <AvatarImage src={currentAvatarUrl || ''} className="object-cover" />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/50 dark:to-rose-800/50 text-rose-600 dark:text-rose-300">
                    {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Overlay camera */}
                <motion.div 
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowUpload(!showUpload)}
                >
                  <Camera className="h-6 w-6 text-white" />
                </motion.div>
                
                {/* Badge statut en ligne */}
                <motion.div 
                  className="absolute -bottom-1 -right-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-5 h-5 bg-emerald-500 rounded-full border-3 border-background shadow-lg" />
                </motion.div>
              </div>

              {/* Nom */}
              <motion.div variants={itemVariants} className="flex items-center gap-2 group/name mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
                </h1>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onEditName}
                  className="p-1.5 h-7 w-7 opacity-0 group-hover/name:opacity-100 text-rose-500 hover:bg-rose-500/10 transition-all rounded-full"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>

              {/* Badge Type Utilisateur */}
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg mb-5",
                  "bg-gradient-to-r",
                  userTypeConfig.gradient
                )}
              >
                <TypeIcon className="h-4 w-4" />
                <span>{userTypeConfig.label}</span>
              </motion.div>

              {/* Informations de contact - Glassmorphism cards */}
              <motion.div variants={itemVariants} className="space-y-3 w-full">
                {/* Email */}
                <motion.div 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all"
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/20">
                    <Mail className="h-4 w-4 text-rose-400" />
                  </div>
                  <span className="text-sm text-foreground/80 truncate flex-1">{user?.email}</span>
                </motion.div>
                
                {/* Téléphone */}
                <motion.div 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all group/phone"
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/20">
                    <Phone className="h-4 w-4 text-rose-400" />
                  </div>
                  <span className="text-sm text-foreground/80 truncate flex-1">
                    {profile.phone_number || "Ajouter un numéro"}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onEditPhone}
                    className="p-1.5 h-7 w-7 opacity-0 group-hover/phone:opacity-100 text-rose-400 hover:bg-rose-500/10 transition-all rounded-full"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Rating */}
              {rating && rating.total_ratings > 0 && (
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 backdrop-blur-sm border border-amber-500/20"
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= Math.round(rating.rating) 
                            ? "fill-amber-400 text-amber-400" 
                            : "fill-transparent text-amber-400/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-amber-500">
                    {rating.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-amber-500/70">
                    ({rating.total_ratings} avis)
                  </span>
                </motion.div>
              )}
            </motion.div>
          </Card>
        </motion.div>
      </div>

      {/* Upload component */}
      {showUpload && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-10"
        >
          <Card className="backdrop-blur-xl bg-card/80 border border-white/10 rounded-2xl shadow-2xl p-4">
            <ProfilePictureUpload onUploadComplete={handleAvatarUpload} />
          </Card>
        </motion.div>
      )}
    </div>
  );
};
