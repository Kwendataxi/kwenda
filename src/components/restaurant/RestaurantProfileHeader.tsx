import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Clock, Store, Phone, Mail, MapPin, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RestaurantImageSettings } from './RestaurantImageSettings';

interface RestaurantProfile {
  id: string;
  restaurant_name: string;
  phone_number: string;
  email: string;
  city: string;
  address: string;
  logo_url: string | null;
  verification_status: string;
  created_at: string;
}

export function RestaurantProfileHeader() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImageEditor, setShowImageEditor] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const getVerificationBadge = () => {
    switch (profile.verification_status) {
      case 'verified':
      case 'approved':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Vérifié
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return null;
    }
  };

  const memberSince = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-800 shadow-lg">
              <AvatarImage src={profile.logo_url || ''} alt={profile.restaurant_name} />
              <AvatarFallback className="bg-orange-600 text-white text-2xl">
                {profile.restaurant_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Bouton d'édition en overlay */}
            <button
              onClick={() => setShowImageEditor(true)}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Modifier les images"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>

            {/* Badge "Ajouter" si pas de logo */}
            {!profile.logo_url && (
              <div className="absolute -bottom-1 -right-1">
                <button
                  onClick={() => setShowImageEditor(true)}
                  className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg hover:bg-orange-700 transition-colors flex items-center gap-1"
                >
                  <Camera className="h-3 w-3" />
                  Ajouter
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.restaurant_name}</h1>
                {getVerificationBadge()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Membre depuis {memberSince}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-600" />
                <span>{profile.phone_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-600" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                <span>{profile.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-orange-600" />
                <span className="text-muted-foreground">Restaurant</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Dialog pour modifier les images */}
    <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les images</DialogTitle>
        </DialogHeader>
        <RestaurantImageSettings 
          onImageUpdate={() => {
            loadProfile();
            setShowImageEditor(false);
          }}
        />
      </DialogContent>
    </Dialog>
    </>
  );
}
