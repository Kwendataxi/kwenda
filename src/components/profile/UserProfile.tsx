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
import { Star, Shield, Phone, Mail, User, FileText, Wallet, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { UserVerification } from './UserVerification';
import { UserRatings } from './UserRatings';
import { UserStatistics } from './UserStatistics';
import { ActivityHistory } from './ActivityHistory';
import { KwendaPayWallet } from '../wallet/KwendaPayWallet';
import ReferralSystem from '../advanced/ReferralSystem';

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
    <div className="container mx-auto p-4 lg:p-6 space-y-8">
      {/* Modern Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-8 lg:p-12 border border-border/50 shadow-xl">
        <div className="absolute inset-0 bg-grid-small opacity-5" />
        <div className="relative flex flex-col lg:flex-row items-center gap-8">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full opacity-75 group-hover:opacity-100 transition duration-300 blur-sm" />
            <Avatar className="relative w-32 h-32 lg:w-40 lg:h-40 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                {profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2">
              <ProfilePictureUpload onUploadComplete={handleAvatarUpdate} />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center lg:text-left space-y-6 max-w-2xl">
            <div className="space-y-3">
              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {profile.display_name || 'Utilisateur'}
                </h1>
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1.5 text-sm font-medium">
                  <Shield className="w-4 h-4 mr-1.5" />
                  Vérifié
                </Badge>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground text-lg">
                <Mail className="w-5 h-5" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 flex-wrap">
              <div className="flex items-center gap-2 bg-background/80 rounded-full px-4 py-2 shadow-sm border border-border/30">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{rating.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({rating.total_ratings} avis)
                </span>
              </div>
              <Badge variant="outline" className="capitalize text-sm px-3 py-1.5 bg-background/80 border-border/30">
                {profile.user_type || 'client'}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={updateProfile}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setIsEditing(false)}
                    className="bg-background/80 hover:bg-background border-border/50"
                  >
                    Annuler
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <User className="w-5 h-5 mr-2" />
                  Modifier le profil
                </Button>
              )}
              
              {profile.phone_number && (
                <Button variant="outline" size="lg" className="bg-background/80 hover:bg-background border-border/50">
                  <Phone className="w-5 h-5 mr-2" />
                  {profile.phone_number}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Modern Tabs - Only 4 Main Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 rounded-xl bg-muted/50 p-2 shadow-sm">
          <TabsTrigger 
            value="info" 
            className="flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <User className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger 
            value="wallet" 
            className="flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Wallet className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Wallet</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Shield className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Activité</span>
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

        <TabsContent value="wallet" className="space-y-6">
          {/* Enhanced Wallet with Referral System */}
          <div className="grid gap-6">
            <KwendaPayWallet />
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Parrainage & Récompenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReferralSystem />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <UserVerification />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Combined Activity: Stats + Ratings + History */}
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Mes Avis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserRatings />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserStatistics />
                </CardContent>
              </Card>
            </div>
            <ActivityHistory />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};