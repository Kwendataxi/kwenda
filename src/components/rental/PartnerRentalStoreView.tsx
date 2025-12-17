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
  Heart, Share2, Star, Users, Car, 
  Award, MapPin, Search, Phone, Mail, Globe, ArrowLeft
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
  const { data: partnerData, isLoading: partnerLoading, error: partnerError, refetch: refetchPartner } = useQuery({
    queryKey: ['partner-rental-store', partnerId],
    queryFn: async () => {
      const { data: partner, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle();

      if (error) throw error;
      if (!partner) throw new Error('Partenaire introuvable');

      // Fetch profile separately - use user_id column, not id
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('user_id', partner.user_id)
        .maybeSingle();

      // Fetch stats from materialized view - don't throw on error
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
    enabled: !!partnerId,
    retry: 2,
    staleTime: 30000
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
  
  // Gradients dynamiques par tier si pas d'image - Thème vert
  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-emerald-700 via-teal-600 to-green-800';
      case 'gold':
        return 'from-emerald-600 via-teal-500 to-green-600';
      case 'diamond':
        return 'from-emerald-500 via-green-400 to-teal-500';
      default:
        return 'from-emerald-600 via-teal-500 to-green-600';
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

  if (partnerError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Car className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Boutique indisponible</h2>
            <p className="text-muted-foreground text-sm">
              {partnerError.message === 'Partenaire introuvable' 
                ? 'Cette boutique de location n\'existe pas ou a été supprimée.'
                : 'Une erreur est survenue lors du chargement. Veuillez réessayer.'}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate('/rental')}>
                Retour
              </Button>
              <Button onClick={() => refetchPartner()} className="bg-emerald-600 hover:bg-emerald-700">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
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

  // Génère un logo fallback avec initiales si pas d'avatar - Thème vert
  const generateLogoFallback = (name: string) => {
    const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600">
        <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
          {initials}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky Navigation Header */}
      <div className="sticky top-0 z-50 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/rental')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          
          <h2 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
            {partnerData?.company_name || 'Boutique'}
          </h2>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowShareDialog(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Clean Banner - Static gradient, no particles */}
      <div className="relative h-32 sm:h-44 md:h-52 overflow-hidden">
        {bannerImage ? (
          <>
            <img 
              src={bannerImage}
              alt={partnerData.company_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getTierGradient(tier)}`} />
        )}
      </div>

      {/* Profile Section - Simplified */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 -mt-10 sm:-mt-14 relative z-20">
          {/* Avatar - No hover scale */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-background shadow-lg overflow-hidden bg-muted dark:bg-slate-800">
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
            <div className="absolute -bottom-1 -right-1">
              <PartnerTierBadge tier={tier} className="shadow-md" />
            </div>
          </div>
          
          {/* Company Info */}
          <div className="flex-1 text-center sm:text-left pb-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {partnerData.company_name}
            </h1>
            {partnerData.slogan && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {partnerData.slogan}
              </p>
            )}
          </div>
        </div>

        {/* Inline Stats - Modern Horizontal Layout */}
        <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 mt-4 py-3 border-y border-border/40 dark:border-slate-700/50">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{partnerData.stats.available_vehicles}</div>
            <div className="text-xs text-muted-foreground">Véhicules</div>
          </div>
          <div className="w-px h-8 bg-border/50 dark:bg-slate-700" />
          <div 
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="text-lg font-bold text-foreground flex items-center gap-1 justify-center">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              {partnerData.stats.rating_average ? partnerData.stats.rating_average.toFixed(1) : '0.0'}
            </div>
            <div className="text-xs text-muted-foreground">{partnerData.stats.rating_count} avis</div>
          </div>
          <div className="w-px h-8 bg-border/50 dark:bg-slate-700" />
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{followersCount}</div>
            <div className="text-xs text-muted-foreground">Abonnés</div>
          </div>
          <div className="w-px h-8 bg-border/50 dark:bg-slate-700 hidden sm:block" />
          <div className="text-center hidden sm:block">
            <div className="text-lg font-bold text-foreground">{partnerData.stats.completed_bookings}</div>
            <div className="text-xs text-muted-foreground">Locations</div>
          </div>
        </div>

        {/* Action Buttons - Horizontal Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
          <Button 
            size="sm"
            variant={isFollowing ? "secondary" : "default"} 
            onClick={handleFollow} 
            disabled={followLoading} 
            className={cn(
              "rounded-full gap-1.5 shrink-0",
              !isFollowing && "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
            )}
          >
            <Heart className={cn("h-4 w-4", isFollowing && "fill-current")} />
            {isFollowing ? 'Suivi' : 'Suivre'}
          </Button>
          
          <Button 
            size="sm"
            variant="outline" 
            onClick={() => setShowShareDialog(true)}
            className="rounded-full gap-1.5 shrink-0 border-border/60 dark:border-slate-600 hover:bg-muted/50 dark:hover:bg-slate-800"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </Button>
          
          <Button 
            size="sm"
            variant="outline" 
            onClick={() => setShowRatingDialog(true)} 
            className="rounded-full gap-1.5 shrink-0 border-border/60 dark:border-slate-600 hover:bg-muted/50 dark:hover:bg-slate-800"
          >
            <Star className="h-4 w-4" />
            Noter
          </Button>
          
          {partnerData.phone && (
            <Button 
              size="sm"
              variant="outline" 
              onClick={handleContact} 
              className="rounded-full gap-1.5 shrink-0 border-border/60 dark:border-slate-600 hover:bg-muted/50 dark:hover:bg-slate-800"
            >
              <Phone className="h-4 w-4" />
              Appeler
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">

        {/* Enhanced About Section */}
        {partnerData.shop_description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glassmorphism mb-8 overflow-hidden border-emerald-500/20">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold">À propos de {partnerData.company_name}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {partnerData.shop_description}
                </p>
                
                {/* Enhanced Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {partnerData.email && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      <span>{partnerData.email}</span>
                    </div>
                  )}
                  {partnerData.phone && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      <span>{partnerData.phone}</span>
                    </div>
                  )}
                  {partnerData.website && (
                    <a href={partnerData.website} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <span>Site web</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters & Search - Thème vert */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-emerald-500/60" />
            <Input
              placeholder="Rechercher un véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Badge
              variant={!selectedCategory ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap ${!selectedCategory ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-0' : 'border-emerald-500/30 hover:bg-emerald-500/10'}`}
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
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <Card 
                    className="overflow-hidden cursor-pointer group bg-card dark:bg-card/95 border border-border/50 dark:border-border/40 hover:shadow-md hover:border-border dark:hover:border-border/60 transition-all duration-200"
                    onClick={() => navigate(`/rental/${vehicle.id}/details`)}
                  >
                    <div className="relative h-48 overflow-hidden bg-muted dark:bg-muted/50">
                      {hasRealImage ? (
                        <img 
                          src={vehicleImage} 
                          alt={vehicle.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        />
                      ) : (
                        <div className={`flex items-center justify-center h-full bg-gradient-to-br ${getVehicleGradient(vehicle)}`}>
                          <Car className="h-16 w-16 text-white/40" />
                        </div>
                      )}

                      {categoryTheme && vehicle.category && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-white/95 dark:bg-slate-800/95 text-foreground shadow-sm border-0">
                            {categoryTheme.icon} {vehicle.category.name}
                          </Badge>
                        </div>
                      )}

                      {vehicle.driver_available && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm border-0">
                            Avec chauffeur
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3 bg-card dark:bg-card/90">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1 text-foreground">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model} · {vehicle.year}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">À partir de</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {vehicle.daily_rate.toLocaleString()} CDF/j
                        </span>
                      </div>

                      <Button className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-0" size="sm">
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
