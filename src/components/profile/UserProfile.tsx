import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Shield, Camera, Phone, Mail, User, CreditCard, FileText, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { PaymentMethodsManager } from './PaymentMethodsManager';
import { UserVerification } from './UserVerification';
import { UserRatings } from './UserRatings';
import { UserStatistics } from './UserStatistics';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  user_type: string;
}

interface UserRating {
  rating: number;
  total_ratings: number;
}

export const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rating, setRating] = useState<UserRating>({ rating: 0, total_ratings: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    display_name: '',
    phone_number: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserRating();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        display_name: data.display_name || '',
        phone_number: data.phone_number || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRating = async () => {
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user?.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
        const avgRating = totalRating / data.length;
        setRating({ rating: Math.round(avgRating * 10) / 10, total_ratings: data.length });
      }
    } catch (error) {
      console.error('Error loading rating:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });

      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  if (!profile) {
    return <div className="text-center p-8">Profil non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-lg">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <ProfilePictureUpload onUploadComplete={handleAvatarUpdate} />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.display_name || 'Utilisateur'}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <Badge variant="secondary">
                  <Star className="w-3 h-3 mr-1" />
                  {rating.rating.toFixed(1)} ({rating.total_ratings} avis)
                </Badge>
                <Badge variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  Compte vérifié
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={updateProfile}>Sauvegarder</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Modifier le profil
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="info">
            <User className="w-4 h-4 mr-1" />
            Infos
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-1" />
            Paiement
          </TabsTrigger>
          <TabsTrigger value="verification">
            <Shield className="w-4 h-4 mr-1" />
            Vérification
          </TabsTrigger>
          <TabsTrigger value="ratings">
            <Star className="w-4 h-4 mr-1" />
            Avis
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Award className="w-4 h-4 mr-1" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="activity">
            <FileText className="w-4 h-4 mr-1" />
            Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Nom complet</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Numéro de téléphone</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="user_type">Type de compte</Label>
                  <Input
                    id="user_type"
                    value={profile.user_type}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <PaymentMethodsManager />
        </TabsContent>

        <TabsContent value="verification">
          <UserVerification />
        </TabsContent>

        <TabsContent value="ratings">
          <UserRatings />
        </TabsContent>

        <TabsContent value="stats">
          <UserStatistics />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Historique d'activité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fonctionnalité en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};