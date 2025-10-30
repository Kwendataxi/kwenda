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
import { Star, Shield, Phone, Mail, User, FileText, Wallet, UserCheck, Edit2, Check, X, ChevronRight, Settings, Car, Users, MapPin, Clock, Gift, Headphones, LogOut, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MobileProfileModal } from './MobileProfileModal';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { UserVerification } from './UserVerification';
import { UserRatings } from './UserRatings';
import { UserStatistics } from './UserStatistics';
import { ActivityHistory } from './ActivityHistory';
import { KwendaPayWallet } from '../wallet/KwendaPayWallet';
import { ReferralPanel } from './ReferralPanel';
import { PromoCodePanel } from './PromoCodePanel';
import { UserAddressesManager } from './UserAddressesManager';
import CustomerSupport from './CustomerSupport';
import { useNavigate } from 'react-router-dom';
import { DriverUpgrade } from './DriverUpgrade';
import { TeamAccountManager } from './TeamAccountManager';
import { UserSettings } from './UserSettings';

import { ModernProfileHeader } from './ModernProfileHeader';
import { ProfileActionButtons } from './ProfileActionButtons';
import { useIsVendor } from '@/hooks/useIsVendor';

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

interface UserProfileProps {
  onWalletAccess?: () => void;
}

export const UserProfile = ({ onWalletAccess }: UserProfileProps = {}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
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
  const { isVendor } = useIsVendor();

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
        title: t('profile.updated'),
        description: t('profile.updated_desc'),
      });

      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('common.error'),
        description: t('profile.error_update'),
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
        title: t('profile.name_updated'),
        description: t('profile.name_updated_desc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('profile.error_update_name'),
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
        title: t('profile.phone_updated'),
        description: t('profile.phone_updated_desc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('profile.error_update_phone'),
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
        title: t('profile.logout_success'),
        description: t('profile.logout_success_desc'),
      });
      // The redirect to /auth will be handled by the AuthProvider
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('profile.error_logout'),
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
          <p className="text-muted-foreground">{t('profile.loading')}</p>
          <p className="text-sm text-muted-foreground">
            {t('profile.loading')}
          </p>
        </div>
      </div>
    );
  }

  const profileOptions = [
    {
      id: 'history',
      icon: Clock,
      title: t('profile.history'),
      subtitle: t('activity.title'),
      hasArrow: true
    },
    {
      id: 'addresses',
      icon: MapPin,
      title: t('profile.addresses'),
      subtitle: t('profile.addresses'),
      hasArrow: true
    },
    {
      id: 'support',
      icon: Headphones,
      title: t('profile.support'),
      subtitle: t('support.title'),
      hasArrow: true
    },
    {
      id: 'settings',
      icon: Settings,
      title: t('profile.settings'),
      subtitle: t('profile.settings'),
      hasArrow: true
    }
  ];

  const renderModalContent = () => {
    try {
      switch (activeOption) {
        case 'wallet':
          return <KwendaPayWallet />;
        case 'referral':
          return <ReferralPanel open={true} onClose={() => setActiveOption(null)} />;
        case 'promocode':
          return <PromoCodePanel open={true} onClose={() => {
            setActiveOption(null);
            setShowModal(false);
          }} />;
        case 'history':
          return <ActivityHistory />;
        case 'addresses':
          // Rediriger vers la page mobile dédiée
          navigate('/mes-adresses');
          return null;
        case 'vendor':
          navigate('/vendeur');
          return null;
        case 'vendor-request':
          const { VendorVerificationRequest } = require('@/components/vendor/VendorVerificationRequest');
          return <VendorVerificationRequest />;
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
          return null;
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
            {t('common.close')}
          </button>
        </div>
      );
    }
  };

  const getOptionTitle = (option: string) => {
    const optionMap: Record<string, string> = {
      'wallet': 'KwendaPay Wallet',
      'referral': 'Réductions et cadeaux',
      'promocode': 'Codes promotionnels',
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
    console.log('🔍 [UserProfile] handleQuickAction appelé avec action:', action);
    console.log('🔍 [UserProfile] onWalletAccess disponible:', !!onWalletAccess);
    
    if (action === 'wallet') {
      console.log('💰 [UserProfile] Action wallet détectée, appel de onWalletAccess...');
      if (onWalletAccess) {
        onWalletAccess();
        console.log('✅ [UserProfile] onWalletAccess() appelé avec succès');
      } else {
        console.log('❌ [UserProfile] onWalletAccess non disponible');
      }
    } else {
      console.log('🔀 [UserProfile] Autre action, redirection vers handleOptionClick');
      handleOptionClick(action);
    }
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
          <div className="bg-card border border-border shadow-lg rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{t('profile.edit_name')}</h3>
            <Input
              value={editedDisplayName}
              onChange={(e) => setEditedDisplayName(e.target.value)}
              placeholder={t('profile.enter_name')}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleNameSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {t('profile.save')}
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
          <div className="bg-card border border-border shadow-lg rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{t('profile.edit_phone')}</h3>
            <Input
              value={editedPhone}
              onChange={(e) => setEditedPhone(e.target.value)}
              placeholder={t('profile.enter_phone')}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handlePhoneSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {t('profile.save')}
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

      {/* Section Vendeur - Afficher pour TOUS les clients */}
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isVendor ? (
            // Utilisateur déjà vendeur → Accès direct
            <button
              onClick={() => navigate('/vendeur')}
              className="w-full relative overflow-hidden p-6 rounded-2xl group bg-gradient-to-br from-primary via-primary to-primary-glow hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-500 hover:scale-[1.02]"
            >
              <div className="absolute top-3 right-3 bg-congo-yellow text-congo-dark px-2 py-1 rounded-full text-xs font-bold">
                ⭐ ACTIF
              </div>
              <div className="relative flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <Store className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xl font-bold text-white">Mon espace vendeur</div>
                  <div className="text-sm text-white/90">Gérer mes produits et commandes</div>
                </div>
                <ChevronRight className="h-6 w-6 text-white" />
              </div>
            </button>
          ) : (
            // Client non-vendeur → Demander vérification
            <button
              onClick={() => handleOptionClick('vendor-request')}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <Store className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-lg font-bold text-foreground">Devenir vendeur</div>
                  <div className="text-sm text-muted-foreground">
                    Vendez vos produits sur Kwenda Marketplace
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-primary" />
              </div>
            </button>
          )}
        </motion.div>
      </div>

      {/* Profile Options List */}
      <div className="px-4 py-2 space-y-2">
        {profileOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-all duration-200 rounded-xl group bg-card border border-border shadow-lg"
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
            <Button variant="outline" className="w-full flex items-center gap-3 text-destructive hover:text-destructive bg-card border-destructive/20 hover:border-destructive/40 shadow-lg">
              <LogOut className="h-4 w-4" />
              {t('profile.logout')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border border-border shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('profile.logout_confirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('profile.logout_confirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
                {t('profile.logout')}
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
        className="bg-card border border-border shadow-lg"
      >
        {renderModalContent()}
      </MobileProfileModal>
    </div>
  );
};