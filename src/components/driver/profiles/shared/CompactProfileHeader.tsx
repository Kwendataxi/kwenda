/**
 * 🎨 Header Compact Profil Chauffeur - Design Modern & Épuré
 */

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Settings, MessageCircle, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PhotoUploadModal } from './PhotoUploadModal';

interface CompactProfileHeaderProps {
  name: string;
  photo?: string | null;
  rating: number;
  city?: string;
  badge: string;
  badgeIcon: string;
  serviceType: 'taxi' | 'delivery';
  isOnline?: boolean;
  onSupportClick?: () => void;
  onSettingsClick?: () => void;
}

export const CompactProfileHeader = ({
  name,
  photo,
  rating,
  city = 'Kinshasa',
  badge,
  badgeIcon,
  serviceType,
  isOnline = true,
  onSupportClick,
  onSettingsClick
}: CompactProfileHeaderProps) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(photo);

  const themeColor = serviceType === 'taxi' ? 'text-primary' : 'text-green-500';
  const themeBg = serviceType === 'taxi' ? 'bg-primary/10' : 'bg-green-500/10';
  const themeBorder = serviceType === 'taxi' ? 'border-primary/20' : 'border-green-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl p-4 bg-card/80 backdrop-blur-sm border ${themeBorder}`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar compact */}
        <div className="relative">
          <Avatar 
            className="h-14 w-14 ring-2 ring-offset-2 ring-offset-background ring-primary/20 cursor-pointer"
            onClick={() => setShowPhotoModal(true)}
          >
            <AvatarImage src={currentPhoto || undefined} alt={name} />
            <AvatarFallback className={`${themeBg} ${themeColor} font-semibold`}>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Status indicator */}
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        {/* Info principale */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{rating > 0 ? rating.toFixed(1) : '4.5'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{city}</span>
            <span className="text-muted-foreground">•</span>
            <Badge variant="secondary" className={`${themeBg} ${themeColor} border-0 text-xs py-0 h-5`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Vérifié
            </Badge>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onSupportClick}
          >
            <MessageCircle className="w-4.5 h-4.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onSettingsClick}
          >
            <Settings className="w-4.5 h-4.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Badge service discret en bas */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span>{badgeIcon}</span>
            <span>{badge}</span>
          </span>
          {isOnline && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              En ligne
            </span>
          )}
        </div>
      </div>

      <PhotoUploadModal 
        open={showPhotoModal}
        onOpenChange={setShowPhotoModal}
        onUploadSuccess={(newUrl) => setCurrentPhoto(newUrl)}
      />
    </motion.div>
  );
};
