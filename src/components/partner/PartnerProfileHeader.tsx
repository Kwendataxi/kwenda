import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Shield, Calendar, Camera, Edit2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const PartnerProfileHeader: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Récupérer le profil pour l'avatar
  const { data: profile } = useQuery({
    queryKey: ['partner-profile-avatar', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `partner-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['partner-profile-avatar'] });
      toast.success('Logo mis à jour avec succès');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20" />
        <div className="relative p-6 animate-pulse">
          <div className="flex gap-6">
            <div className="h-28 w-28 rounded-full bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-64 bg-muted rounded" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerificationBadge = () => {
    const config = {
      verified: {
        icon: CheckCircle,
        label: 'Vérifié',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      },
      pending: {
        icon: Clock,
        label: 'En attente',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      },
      rejected: {
        icon: XCircle,
        label: 'Rejeté',
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      }
    };

    const status = partner?.verification_status as keyof typeof config || 'pending';
    const { icon: Icon, label, className } = config[status] || config.pending;

    return (
      <Badge variant="outline" className={cn('gap-1.5 font-medium', className)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-xl">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/20" />
        
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-teal-400/10 blur-2xl" />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Avatar avec bouton upload */}
            <div className="flex flex-col items-center gap-3">
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Avatar className="h-28 w-28 ring-4 ring-white/50 dark:ring-gray-800/50 shadow-2xl">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold">
                    {partner?.company_name ? getInitials(partner.company_name) : 'P'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Overlay upload */}
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full",
                    "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
                    uploading && "opacity-100"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </motion.button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </motion.div>
              
              <p className="text-xs text-muted-foreground">
                Cliquez pour modifier
              </p>
            </div>

            {/* Informations principales */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <motion.h2 
                    className="text-2xl md:text-3xl font-bold text-foreground"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {partner?.company_name || 'Entreprise'}
                  </motion.h2>
                  
                  <motion.div 
                    className="flex flex-wrap items-center gap-2 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {getVerificationBadge()}
                    {partner?.is_active ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        Inactif
                      </Badge>
                    )}
                  </motion.div>
                </div>

                <Button variant="outline" size="sm" className="gap-2 self-start backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
                  <Edit2 className="h-4 w-4" />
                  Modifier
                </Button>
              </div>

              {/* Coordonnées en grille */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { icon: Mail, value: partner?.email || 'Non renseigné', label: 'Email' },
                  { icon: Phone, value: partner?.phone_number || 'Non renseigné', label: 'Téléphone' },
                  { icon: Building2, value: partner?.business_type || 'Non renseigné', label: 'Type' },
                  { icon: MapPin, value: partner?.service_areas?.join(', ') || 'Non renseigné', label: 'Zones' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Informations supplémentaires */}
              <motion.div 
                className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-muted-foreground">
                    ID: <span className="font-mono text-foreground">{partner?.id?.slice(0, 8)}...</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-muted-foreground">
                    Membre depuis{' '}
                    <span className="font-medium text-foreground">
                      {partner?.created_at ? format(new Date(partner.created_at), 'MMMM yyyy', { locale: fr }) : 'N/A'}
                    </span>
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};