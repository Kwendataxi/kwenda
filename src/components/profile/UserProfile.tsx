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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Star, Shield, Phone, Mail, User, FileText, Wallet, UserCheck, Edit2, Check, X, ChevronRight, Settings, Car, Users, MapPin, Clock, Gift, Headphones, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MobileProfileModal } from './MobileProfileModal';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { UserVerification } from './UserVerification';
import { UserRatings } from './UserRatings';
import { UserStatistics } from './UserStatistics';
import { ActivityHistory } from './ActivityHistory';
import { KwendaPayWallet } from '../wallet/KwendaPayWallet';
import ReferralSystem from '../advanced/ReferralSystem';
import { UserAddressesManager } from './UserAddressesManager';
import CustomerSupport from './CustomerSupport';
import { DriverUpgrade } from './DriverUpgrade';
import { TeamAccountManager } from './TeamAccountManager';
import { UserSettings } from './UserSettings';
import { AccountStatus } from './AccountStatus';
import { ModernProfileHeader } from './ModernProfileHeader';
import { ProfileActionButtons } from './ProfileActionButtons';

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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rating, setRating] = useState<UserRating>({ rating: 0, total_ratings: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    display_name: '',
    phone_number: '',
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeOption, setActiveOption] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserRating();
      console.log("===========================================> ",user);
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

  const handleNameSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editedDisplayName })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, display_name: editedDisplayName } : null);
      setIsEditingName(false);
      toast({
        title: "Nom mis à jour",
        description: "Votre nom a été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le nom.",
        variant: "destructive",
      });
    }
  };

  const handlePhoneSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: editedPhone })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, phone_number: editedPhone } : null);
      setIsEditingPhone(false);
      toast({
        title: "Téléphone mis à jour",
        description: "Votre numéro de téléphone a été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le téléphone.",
        variant: "destructive",
      });
    }
  };

  const handleNameCancel = () => {
    setEditedDisplayName(profile?.display_name || '');
    setIsEditingName(false);
  };

  const handlePhoneCancel = () => {
    setEditedPhone(profile?.phone_number || '');
    setIsEditingPhone(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
      // The redirect to /auth will be handled by the AuthProvider
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter.",
        variant: "destructive",
      });
    }
  };

  const handleOptionClick = (option: string) => {
    setActiveOption(option);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Configuration de votre compte...</p>
          <p className="text-sm text-muted-foreground">
            Nous préparons votre profil, veuillez patienter.
          </p>
        </div>
      </div>
    );
  }

  const profileOptions = [
    {
      id: 'wallet',
      icon: Wallet,
      title: 'Modes de paiement',
      subtitle: 'Wallet Kwenda Pay',
      hasArrow: true
    },
    {
      id: 'referral',
      icon: Gift,
      title: 'Réductions et cadeaux',
      subtitle: 'Code promo et parrainage',
      hasArrow: true
    },
    {
      id: 'history',
      icon: Clock,
      title: 'Historique',
      subtitle: 'Activités et transactions',
      hasArrow: true
    },
    {
      id: 'addresses',
      icon: MapPin,
      title: 'Mes adresses',
      subtitle: 'Adresses sauvegardées',
      hasArrow: true
    },
    {
      id: 'support',
      icon: Headphones,
      title: 'Assistance',
      subtitle: 'Support client',
      hasArrow: true
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Sécurité',
      subtitle: 'Vérification et confidentialité',
      hasArrow: true
    },
    {
      id: 'driver',
      icon: Car,
      title: 'Travailler comme conducteur',
      subtitle: 'Upgrade votre compte',
      hasArrow: true
    },
    {
      id: 'team',
      icon: Users,
      title: 'Un compte pour votre équipe',
      subtitle: 'Compte entreprise',
      hasArrow: true
    },
    {
      id: 'settings',
      icon: Settings,
      title: 'Paramètres',
      subtitle: 'Notifications, langues, etc.',
      hasArrow: true
    }
  ];

  const renderModalContent = () => {
    try {
      switch (activeOption) {
        case 'wallet':
          return <KwendaPayWallet />;
        case 'referral':
          return <ReferralSystem />;
        case 'history':
          return <ActivityHistory />;
        case 'addresses':
          return <UserAddressesManager />;
        case 'support':
          return <CustomerSupport />;
        case 'security':
          return <UserVerification />;
        case 'driver':
          return <DriverUpgrade />;
        case 'team':
          return <TeamAccountManager />;
        case 'settings':
          return <UserSettings />;
        default:
          return (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 capitalize">{activeOption}</h3>
              <p className="text-muted-foreground">Fonctionnalité en développement...</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering modal content:', error);
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Une erreur s'est produite lors du chargement.</p>
          <button 
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Fermer
          </button>
        </div>
      );
    }
  };

  const getOptionTitle = (option: string) => {
    const optionMap: Record<string, string> = {
      'wallet': 'KwendaPay Wallet',
      'referral': 'Réductions et cadeaux',
      'history': 'Historique des activités',
      'addresses': 'Mes adresses',
      'support': 'Assistance client',
      'security': 'Sécurité et vérification',
      'driver': 'Devenir conducteur',
      'team': 'Compte équipe',
      'settings': 'Paramètres'
    };
    return optionMap[option] || option;
  };

  const handleQuickAction = (action: string) => {
    handleOptionClick(action);
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen content-with-bottom-nav">
      {/* Modern Profile Header */}
      <ModernProfileHeader
        profile={profile}
        user={user}
        rating={rating}
        onEditName={() => {
          setEditedDisplayName(profile.display_name || '');
          setIsEditingName(true);
        }}
        onEditPhone={() => {
          setEditedPhone(profile.phone_number || '');
          setIsEditingPhone(true);
        }}
      />

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm glassmorphism">
            <h3 className="text-lg font-semibold mb-4">Modifier le nom</h3>
            <Input
              value={editedDisplayName}
              onChange={(e) => setEditedDisplayName(e.target.value)}
              placeholder="Votre nom"
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleNameSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={handleNameCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Phone Modal */}
      {isEditingPhone && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm glassmorphism">
            <h3 className="text-lg font-semibold mb-4">Modifier le téléphone</h3>
            <Input
              value={editedPhone}
              onChange={(e) => setEditedPhone(e.target.value)}
              placeholder="Numéro de téléphone"
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handlePhoneSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={handlePhoneCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Action Buttons */}
      <div className="px-4 py-4">
        <ProfileActionButtons onQuickAction={handleQuickAction} />
      </div>

      {/* Account Status */}
      <div className="px-4 py-2">
        <AccountStatus />
      </div>

      {/* Profile Options List */}
      <div className="px-4 py-2 space-y-2">
        {profileOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-all duration-200 rounded-xl group glassmorphism-soft hover:glassmorphism"
            >
              <div className="bg-gradient-to-br from-congo-red/10 to-congo-yellow/10 p-3 rounded-xl group-hover:from-congo-red/20 group-hover:to-congo-yellow/20 transition-all duration-200">
                <IconComponent className="h-5 w-5 text-congo-red group-hover:text-congo-red-electric transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground group-hover:text-congo-red transition-colors">{option.title}</div>
                <div className="text-sm text-muted-foreground">{option.subtitle}</div>
              </div>
              {option.hasArrow && (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-congo-yellow transition-all duration-200 group-hover:translate-x-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Logout Section */}
      <div className="px-4 py-4 mt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full flex items-center gap-3 text-destructive hover:text-destructive glassmorphism-soft hover:glassmorphism border-destructive/20 hover:border-destructive/40">
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glassmorphism">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir vous déconnecter de votre compte Kwenda Taxi ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
                Se déconnecter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Mobile-friendly Modal for detailed views */}
      <MobileProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={getOptionTitle(activeOption)}
        className="glassmorphism"
      >
        {renderModalContent()}
      </MobileProfileModal>
    </div>
  );
};