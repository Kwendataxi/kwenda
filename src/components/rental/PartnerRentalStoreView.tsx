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
import { PartnerRentalReviewsSection } from './PartnerRentalReviewsSection';
import { 
  Heart, Share2, MessageCircle, Star, Users, Car, 
  Award, MapPin, Search, Filter, Phone, Mail, Globe
} from 'lucide-react';
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

  // Fetch partner data with stats
  const { data: partnerData, isLoading: partnerLoading } = useQuery({
    queryKey: ['partner-rental-store', partnerId],
    queryFn: async () => {
      const { data: partner, error } = await supabase
        .from('partenaires')
        .select(`
          id,
          user_id,
          company_name,
          banner_image,
          slogan,
          shop_description,
          phone,
          email,
          website,
          profiles!inner(avatar_url, display_name)
        `)
        .eq('id', partnerId)
        .maybeSingle();

      if (error) throw error;
      if (!partner) throw new Error('Partenaire introuvable');

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
        profiles: partner.profiles,
        stats: stats || {
          total_vehicles: 0,
          available_vehicles: 0,
          total_bookings: 0,
          completed_bookings: 0,
          avg_rating: 0,
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: partnerData?.company_name || 'Partenaire Location',
        text: partnerData?.slogan || 'Découvrez nos véhicules',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papier');
    }
  };

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
  const bannerImage = partnerData?.banner_image || '/placeholder.svg';

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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Premium Banner Header */}
      <div className="relative h-72 overflow-hidden">
        <img 
          src={bannerImage}
          alt={partnerData.company_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Logo Overlay */}
        <div className="absolute bottom-0 left-0 right-0 transform translate-y-1/2 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden shadow-2xl">
                  <img 
                    src={partnerData.profiles?.avatar_url || '/placeholder.svg'}
                    alt={partnerData.company_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <PartnerTierBadge tier={tier} className="shadow-lg" />
                </div>
              </div>
              
              <div className="flex-1 pb-4 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{partnerData.company_name}</h1>
                {partnerData.slogan && (
                  <p className="text-lg opacity-90">{partnerData.slogan}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pb-4">
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  size="lg"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="gap-2"
                >
                  <Heart className={isFollowing ? "fill-current" : ""} />
                  {isFollowing ? 'Suivi' : 'Suivre'}
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare} className="gap-2">
                  <Share2 className="h-5 w-5" />
                  Partager
                </Button>
                <Button variant="outline" size="lg" onClick={() => setShowRatingDialog(true)} className="gap-2">
                  <Star className="h-5 w-5" />
                  Noter
                </Button>
                {partnerData.phone && (
                  <Button variant="outline" size="lg" onClick={handleContact} className="gap-2">
                    <Phone className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Glassmorphism */}
      <div className="max-w-7xl mx-auto px-4 mt-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="glassmorphism">
            <CardContent className="p-4 text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{partnerData.stats.available_vehicles}</div>
              <div className="text-xs text-muted-foreground">Véhicules dispos</div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{partnerData.stats.completed_bookings}</div>
              <div className="text-xs text-muted-foreground">Locations</div>
            </CardContent>
          </Card>

          <Card 
            className="glassmorphism cursor-pointer hover:shadow-lg transition-all"
            onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500 fill-yellow-500" />
              <div className="text-2xl font-bold">
                {partnerData.stats.avg_rating ? partnerData.stats.avg_rating.toFixed(1) : '0.0'}
              </div>
              <div className="text-xs text-muted-foreground">
                {partnerData.stats.rating_count} avis
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{followersCount}</div>
              <div className="text-xs text-muted-foreground">Abonnés</div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-4 text-center">
              <PartnerTierBadge tier={tier} />
              <div className="text-xs text-muted-foreground mt-2">Abonnement</div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {partnerData.shop_description && (
          <Card className="glassmorphism mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-3">À propos</h2>
              <p className="text-muted-foreground leading-relaxed">{partnerData.shop_description}</p>
              <div className="flex gap-4 mt-4 text-sm">
                {partnerData.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {partnerData.email}
                  </div>
                )}
                {partnerData.website && (
                  <a 
                    href={partnerData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Site web
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
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

      {/* Rating Dialog */}
      <PartnerRentalRatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        partnerId={partnerId || ''}
        partnerName={partnerData.company_name}
        onRatingSubmitted={() => {
          setShowRatingDialog(false);
          // Refresh data would happen automatically via query invalidation
        }}
      />
    </div>
  );
};

export default PartnerRentalStoreView;
