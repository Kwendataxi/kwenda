import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerRentalFollow } from '@/hooks/usePartnerRentalFollow';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerTierBadge } from './PartnerTierBadge';
import { PartnerRentalRatingDialog } from './PartnerRentalRatingDialog';
import { PartnerRentalShareSheet } from './PartnerRentalShareSheet';
import { PartnerRentalReviewsSection } from './PartnerRentalReviewsSection';
import { 
  Heart, Share2, MessageCircle, Star, Users, Car, 
  Award, MapPin, Search, Filter, Phone, Mail, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { getCategoryTheme } from '@/utils/categoryThemes';
import { getVehicleImage, getVehicleGradient } from '@/utils/vehicleFallbackImages';

export const PartnerRentalStoreView = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFollowing, followersCount, loading: followLoading, toggleFollow } = usePartnerRentalFollow(partnerId || '');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Fetch partner data with stats
  const { data: partnerData, isLoading: partnerLoading } = useQuery({
    queryKey: ['partner-rental-store', partnerId],
    queryFn: async () => {
      const { data: partner, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle();

      if (error) throw error;
      if (!partner) throw new Error('Partenaire introuvable');

      // Fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', partner.user_id)
        .maybeSingle();

      // Fetch stats from materialized view
      const { data: stats } = await supabase
        .from('partner_rental_stats')
        .select('*')
        .eq('partner_id', partnerId)
        .maybeSingle();

      return {
        id: partner.id,
        user_id: partner.user_id,
        company_name: partner.company_name,
        banner_image: partner.banner_image,
        slogan: partner.slogan,
        shop_description: partner.shop_description,
        phone: partner.phone,
        email: partner.email,
        website: partner.website,
        avatar_url: profile?.avatar_url,
        display_name: profile?.display_name,
        stats: stats || {
          total_vehicles: 0,
          available_vehicles: 0,
          total_bookings: 0,
          completed_bookings: 0,
          rating_average: 0,
          rating_count: 0,
          total_revenue: 0
        }
      };
    },
    enabled: !!partnerId
  });

  // Fetch partner subscription tier
  const { data: subscription } = useQuery({
    queryKey: ['partner-subscription', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select(`
          *,
          plan:rental_subscription_plans(*)
        `)
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!partnerId
  });

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['partner-vehicles', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicles')
        .select(`
          *,
          category:rental_vehicle_categories(id, name, icon)
        `)
        .eq('partner_id', partnerId)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId
  });

  // Fetch categories for filters
  const { data: categories = [] } = useQuery({
    queryKey: ['rental-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicle_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = !searchTerm || 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || v.category_id === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [vehicles, searchTerm, selectedCategory]);

  // Count vehicles per category
  const vehicleCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach(v => {
      counts[v.category_id] = (counts[v.category_id] || 0) + 1;
    });
    return counts;
  }, [vehicles]);


  const handleFollow = async () => {
    await toggleFollow();
    if (!isFollowing) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleContact = () => {
    if (partnerData?.phone) {
      window.open(`tel:${partnerData.phone}`, '_self');
    }
  };

  const tier = subscription?.plan?.tier || 'basic';
  const bannerImage = partnerData?.banner_image;
  
  // Gradients dynamiques par tier si pas d'image
  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-slate-700 via-slate-500 to-slate-800';
      case 'gold':
        return 'from-yellow-600 via-amber-500 to-orange-600';
      case 'diamond':
        return 'from-purple-600 via-fuchsia-500 to-pink-600';
      default:
        return 'from-red-600 via-red-500 to-rose-600';
    }
  };

  if (partnerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-72 w-full" />
        <div className="max-w-7xl mx-auto px-4 -mt-16">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto mt-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!partnerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Partenaire introuvable</h2>
          <Button onClick={() => navigate('/rental')}>Retour</Button>
        </div>
      </div>
    );
  }

  // Génère un logo fallback avec initiales si pas d'avatar
  const generateLogoFallback = (name: string) => {
    const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-primary/60">
        <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
          {initials}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Facebook-Style Banner with Floating Particles - Hauteur réduite pour mobile */}
      <motion.div 
        className="relative h-40 sm:h-56 md:h-72 lg:h-80 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {bannerImage ? (
          <>
            <motion.img 
              src={bannerImage}
              alt={partnerData.company_name}
              className="w-full h-full object-cover"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {/* Gradient Overlay */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
          </>
        ) : (
          <>
            {/* Animated Gradient Background */}
            <motion.div
              className={`w-full h-full bg-gradient-to-br ${getTierGradient(tier)}`}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ backgroundSize: '400% 400%' }}
            />
            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + i * 10}%`,
                  }}
                  animate={{
                    y: [-20, 20, -20],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Facebook-Style Logo Container (Overlap) - Marges réduites pour mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 -mt-12 sm:-mt-16 md:-mt-20 relative z-20">
          {/* Avatar with Hover Effect & Fallback */}
          <motion.div 
            className="relative shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-4 sm:border-[6px] border-background shadow-2xl overflow-hidden bg-white">
              {partnerData.avatar_url ? (
                <img 
                  src={partnerData.avatar_url}
                  alt={partnerData.company_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                generateLogoFallback(partnerData.company_name)
              )}
            </div>
            {/* Badge Tier with Rotation Hover */}
            <motion.div 
              className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2"
              whileHover={{ rotate: 12, scale: 1.1 }}
            >
              <PartnerTierBadge tier={tier} className="shadow-xl" />
            </motion.div>
          </motion.div>
          
          {/* Company Info */}
          <div className="flex-1 text-center sm:text-left pb-3 sm:pb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 break-words">
              {partnerData.company_name}
            </h1>
            {partnerData.slogan ? (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                {partnerData.slogan}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                {partnerData.stats.available_vehicles} véhicule{partnerData.stats.available_vehicles > 1 ? 's' : ''} disponible{partnerData.stats.available_vehicles > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex gap-2 pb-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={isFollowing ? "secondary" : "default"}
                size="lg"
                onClick={handleFollow}
                disabled={followLoading}
                className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
              >
                <motion.div
                  animate={isFollowing ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={isFollowing ? "fill-current" : ""} />
                </motion.div>
                {isFollowing ? 'Suivi' : 'Suivre'}
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowShareDialog(true)}
                className="gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Share2 className="h-5 w-5" />
                Partager
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="lg" onClick={() => setShowRatingDialog(true)} className="gap-2 shadow-lg">
                <Star className="h-5 w-5" />
                Noter
              </Button>
            </motion.div>
            
            {partnerData.phone && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" onClick={handleContact} className="gap-2 shadow-lg">
                  <Phone className="h-5 w-5" />
                  Appeler
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Mobile Action Buttons - Full Width */}
        <div className="flex sm:hidden flex-col gap-2 w-full mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" variant={isFollowing ? "secondary" : "default"} onClick={handleFollow} disabled={followLoading} className="w-full">
              <Heart className={cn("mr-2", isFollowing && "fill-current")} />
              {isFollowing ? 'Suivi' : 'Suivre'}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="mr-2 h-5 w-5" />
              Partager
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" variant="outline" onClick={() => setShowRatingDialog(true)} className="w-full">
              <Star className="mr-2 h-5 w-5" />
              Noter
            </Button>
            {partnerData.phone && (
              <Button size="lg" variant="outline" onClick={handleContact} className="w-full">
                <Phone className="mr-2 h-5 w-5" />
                Appeler
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards with 3D Effect & Shine */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              y: -8,
              rotateX: 5,
              transition: { duration: 0.2 }
            }}
            transition={{ delay: 0.1 }}
          >
            <Card className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-background to-background/80 border-2 border-border/30 shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 cursor-pointer">
              {/* Shine Effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
              <CardContent className="relative p-3 sm:p-4 text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Car className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary drop-shadow-lg" />
                </motion.div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {partnerData.stats.available_vehicles}
                </div>
                <div className="text-xs text-muted-foreground">Véhicules dispos</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              y: -8,
              rotateX: 5,
              transition: { duration: 0.2 }
            }}
            transition={{ delay: 0.2 }}
          >
            <Card className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-background to-background/80 border-2 border-border/30 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 cursor-pointer">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
              <CardContent className="relative p-3 sm:p-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-yellow-500 drop-shadow-lg" />
                </motion.div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  {partnerData.stats.completed_bookings}
                </div>
                <div className="text-xs text-muted-foreground">Locations</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              y: -8,
              rotateX: 5,
              transition: { duration: 0.2 }
            }}
            transition={{ delay: 0.3 }}
          >
            <Card 
              className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-background to-background/80 border-2 border-border/30 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/30 cursor-pointer transition-all duration-300"
              onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
              <CardContent className="relative p-3 sm:p-4 text-center">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                </motion.div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  {partnerData.stats.rating_average ? partnerData.stats.rating_average.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {partnerData.stats.rating_count} avis
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              y: -8,
              rotateX: 5,
              transition: { duration: 0.2 }
            }}
            transition={{ delay: 0.4 }}
          >
            <Card className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-background to-background/80 border-2 border-border/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
              <CardContent className="relative p-3 sm:p-4 text-center">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-500 drop-shadow-lg" />
                </motion.div>
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {followersCount}
                </div>
                <div className="text-xs text-muted-foreground">Abonnés</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              y: -8,
              rotateX: 5,
              transition: { duration: 0.2 }
            }}
            transition={{ delay: 0.5 }}
          >
            <Card className="group relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-background to-background/80 border-2 border-border/30 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
              <CardContent className="relative p-3 sm:p-4 text-center">
                <PartnerTierBadge tier={tier} />
                <div className="text-xs text-muted-foreground mt-2">Abonnement</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced About Section */}
        {partnerData.shop_description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glassmorphism mb-8 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">À propos de {partnerData.company_name}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {partnerData.shop_description}
                </p>
                
                {/* Enhanced Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {partnerData.email && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{partnerData.email}</span>
                    </div>
                  )}
                  {partnerData.phone && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{partnerData.phone}</span>
                    </div>
                  )}
                  {partnerData.website && (
                    <a href={partnerData.website} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>Site web</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters & Search */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Badge
              variant={!selectedCategory ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(null)}
            >
              Tous ({vehicles.length})
            </Badge>
            {categories.map(cat => {
              const count = vehicleCountsByCategory[cat.id] || 0;
              if (count === 0) return null;
              const theme = getCategoryTheme(cat.name);
              
              return (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id && theme 
                      ? `bg-gradient-to-r ${theme.gradient} text-white border-none`
                      : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {theme?.icon} {cat.name} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Vehicles Grid */}
        {vehiclesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <Card className="glassmorphism">
            <CardContent className="py-16 text-center">
              <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Aucun véhicule trouvé</h3>
              <p className="text-muted-foreground">
                {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun véhicule disponible'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
            {filteredVehicles.map((vehicle, index) => {
              const vehicleImage = getVehicleImage(vehicle);
              const hasRealImage = vehicle.images?.[0] && vehicle.images[0] !== '/placeholder.svg';
              const categoryTheme = vehicle.category ? getCategoryTheme(vehicle.category.name) : null;

              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="rental-card-premium overflow-hidden cursor-pointer group"
                    onClick={() => navigate(`/rental/${vehicle.id}/details`)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {hasRealImage ? (
                        <img 
                          src={vehicleImage} 
                          alt={vehicle.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`flex items-center justify-center h-full bg-gradient-to-br ${getVehicleGradient(vehicle)}`}>
                          <Car className="h-20 w-20 text-white/50" />
                        </div>
                      )}

                      {categoryTheme && vehicle.category && (
                        <div className="absolute top-2 left-2">
                          <Badge className={`bg-gradient-to-r ${categoryTheme.gradient} text-white shadow-lg`}>
                            {categoryTheme.icon} {vehicle.category.name}
                          </Badge>
                        </div>
                      )}

                      {vehicle.driver_available && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500 text-white shadow-lg animate-pulse">
                            Avec chauffeur
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg line-clamp-1">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model} · {vehicle.year}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">À partir de</span>
                        <span className="text-xl font-bold text-primary">
                          {vehicle.daily_rate.toLocaleString()} CDF/j
                        </span>
                      </div>

                      <Button className="w-full" size="sm">
                        Voir les détails
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Reviews Section */}
        <div id="reviews-section">
          <PartnerRentalReviewsSection 
            partnerId={partnerId || ''} 
          />
        </div>
      </div>

      {/* Rating Sheet - Mobile First */}
      <PartnerRentalRatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        partnerId={partnerId || ''}
        partnerName={partnerData.company_name}
        onSuccess={() => {
          // Refresh data after rating
          window.location.reload();
        }}
      />

      {/* Share Sheet - Responsive (Drawer mobile + Dialog desktop) */}
      <PartnerRentalShareSheet
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        partnerId={partnerId || ''}
        partnerName={partnerData.company_name}
        totalVehicles={partnerData.stats.available_vehicles}
        rating={partnerData.stats.rating_average}
        slogan={partnerData.slogan}
      />
    </div>
  );
};

export default PartnerRentalStoreView;
