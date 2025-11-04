import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Settings, Bell, Globe, Moon, Sun, Volume2, VolumeX, Smartphone, Shield, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export const UserSettings = () => {
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  
  // 🔔 Hooks de notifications
  const { requestPermission, isGranted, isDenied } = useNotificationPermissions();
  const { preferences, loading: prefsLoading, updatePreference, savePreferences } = useNotificationPreferences();
  
  // 🔧 État local pour les paramètres (non-notifications)
  const [settings, setSettings] = useState({
    // Privacy
    location_sharing: true,
    ride_history_visible: true,
    profile_visibility: 'public',
    
    // App preferences
    dark_mode: false,
    sound_effects: true,
    auto_location: true,
    offline_maps: false,
    
    // Security
    two_factor_auth: false,
    biometric_login: false,
    auto_logout: false,
  });

  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger les paramètres depuis Supabase au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setSettings({
            location_sharing: data.location_sharing ?? true,
            ride_history_visible: (data as any).ride_history_visible ?? true,
            profile_visibility: (data as any).profile_visibility ?? 'public',
            dark_mode: data.dark_mode ?? false,
            sound_effects: (data as any).sound_effects ?? true,
            auto_location: (data as any).auto_location ?? true,
            offline_maps: (data as any).offline_maps ?? false,
            two_factor_auth: (data as any).two_factor_auth ?? false,
            biometric_login: (data as any).biometric_login ?? false,
            auto_logout: (data as any).auto_logout ?? false
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, [user?.id]);

  // Appliquer le mode sombre automatiquement
  useEffect(() => {
    if (settings.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.dark_mode]);

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePushNotificationToggle = async (checked: boolean) => {
    if (checked && !isGranted) {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: t('settings.permission_denied'),
          description: t('settings.permission_denied_desc'),
          variant: "destructive"
        });
        return;
      }
    }
    
    await updatePreference('push_enabled', checked);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // 1. Sauvegarder les préférences de notifications
      if (preferences) {
        await savePreferences(preferences);
      }
      
      // 2. Sauvegarder les autres paramètres dans user_settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          push_notifications: preferences?.push_enabled ?? true,
          email_notifications: preferences?.payment_alerts ?? true,
          sms_notifications: false,
          booking_reminders: preferences?.ride_updates ?? true,
          promotional_offers: preferences?.promotions ?? false,
          location_sharing: settings.location_sharing,
          ride_history_visible: settings.ride_history_visible,
          profile_visibility: settings.profile_visibility,
          dark_mode: settings.dark_mode,
          sound_effects: settings.sound_effects,
          auto_location: settings.auto_location,
          offline_maps: settings.offline_maps,
          two_factor_auth: settings.two_factor_auth,
          biometric_login: settings.biometric_login,
          auto_logout: settings.auto_logout
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      
      toast({
        title: t('settings.saved'),
        description: t('settings.saved_desc'),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.save_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    const defaultSettings = {
      location_sharing: true,
      ride_history_visible: true,
      profile_visibility: 'public',
      dark_mode: false,
      sound_effects: true,
      auto_location: true,
      offline_maps: false,
      two_factor_auth: false,
      biometric_login: false,
      auto_logout: false,
    };
    
    setSettings(defaultSettings);
    
    // Réinitialiser aussi les préférences de notifications
    await savePreferences({
      push_enabled: true,
      ride_updates: true,
      delivery_updates: true,
      payment_alerts: true,
      promotions: false,
      driver_updates: true,
      system_alerts: true,
      marketplace_updates: true,
      chat_messages: true,
      digest_frequency: 'daily',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      sound_enabled: true,
      vibration_enabled: true,
      priority_only: false
    });
    
    // Sauvegarder dans la base
    await saveSettings();
    
    toast({
      title: t('settings.reset'),
      description: t('settings.reset_desc'),
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast({
        title: "Erreur",
        description: "Veuillez taper 'SUPPRIMER' pour confirmer.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      // Call the edge function to delete user account
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { user_id: user?.id }
      });

      if (error) throw error;

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé définitivement. Vous allez être déconnecté.",
      });

      // Sign out the user
      await signOut();
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte. Contactez le support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation('');
    }
  };

  const languageOptions = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ln', name: 'Lingala', flag: '🇨🇩' },
    { code: 'kg', name: 'Kikongo', flag: '🇨🇩' },
    { code: 'lua', name: 'Tshiluba', flag: '🇨🇩' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings}>
            {t('settings.reset')}
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('settings.notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.push_notifications')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.push_notifications_desc')}</p>
              </div>
              <Switch
                checked={preferences?.push_enabled ?? true}
                onCheckedChange={handlePushNotificationToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.email_notifications')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.email_notifications_desc')}</p>
              </div>
              <Switch
                checked={preferences?.payment_alerts ?? true}
                onCheckedChange={(checked) => updatePreference('payment_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.booking_reminders')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.booking_reminders_desc')}</p>
              </div>
              <Switch
                checked={preferences?.ride_updates ?? true}
                onCheckedChange={(checked) => updatePreference('ride_updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.promotional_offers')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.promotional_offers_desc')}</p>
              </div>
              <Switch
                checked={preferences?.promotions ?? false}
                onCheckedChange={(checked) => updatePreference('promotions', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('settings.privacy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.location_sharing')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.location_sharing_desc')}</p>
              </div>
              <Switch
                checked={settings.location_sharing}
                onCheckedChange={(checked) => handleSettingChange('location_sharing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.ride_history')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.ride_history_desc')}</p>
              </div>
              <Switch
                checked={settings.ride_history_visible}
                onCheckedChange={(checked) => handleSettingChange('ride_history_visible', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('settings.profile_visibility')}</Label>
              <Select
                value={settings.profile_visibility}
                onValueChange={(value) => handleSettingChange('profile_visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('settings.visibility_public')}</SelectItem>
                  <SelectItem value="friends">{t('settings.visibility_friends')}</SelectItem>
                  <SelectItem value="private">{t('settings.visibility_private')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('settings.language_interface')}</Label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('settings.language_desc')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              {t('settings.app_preferences')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.dark_mode')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.dark_mode_desc')}</p>
              </div>
              <div className="flex items-center gap-2">
                {settings.dark_mode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <Switch
                  checked={settings.dark_mode}
                  onCheckedChange={(checked) => handleSettingChange('dark_mode', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.sound_effects')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.sound_effects_desc')}</p>
              </div>
              <div className="flex items-center gap-2">
                {settings.sound_effects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <Switch
                  checked={settings.sound_effects}
                  onCheckedChange={(checked) => handleSettingChange('sound_effects', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.auto_location')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.auto_location_desc')}</p>
              </div>
              <Switch
                checked={settings.auto_location}
                onCheckedChange={(checked) => handleSettingChange('auto_location', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('settings.offline_maps')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.offline_maps_desc')}</p>
              </div>
              <Switch
                checked={settings.offline_maps}
                onCheckedChange={(checked) => handleSettingChange('offline_maps', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('settings.security')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t('settings.two_factor')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.two_factor_desc')}</p>
                  {settings.two_factor_auth && (
                    <Badge variant="secondary" className="mt-1">{t('settings.enabled')}</Badge>
                  )}
                </div>
                <Switch
                  checked={settings.two_factor_auth}
                  onCheckedChange={(checked) => handleSettingChange('two_factor_auth', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t('settings.biometric')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.biometric_desc')}</p>
                  {settings.biometric_login && (
                    <Badge variant="secondary" className="mt-1">{t('settings.enabled')}</Badge>
                  )}
                </div>
                <Switch
                  checked={settings.biometric_login}
                  onCheckedChange={(checked) => handleSettingChange('biometric_login', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t('settings.auto_logout')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.auto_logout_desc')}</p>
                  {settings.auto_logout && (
                    <Badge variant="secondary" className="mt-1">{t('settings.enabled')}</Badge>
                  )}
                </div>
                <Switch
                  checked={settings.auto_logout}
                  onCheckedChange={(checked) => handleSettingChange('auto_logout', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="lg:col-span-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t('settings.danger_zone')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <h3 className="font-semibold text-destructive mb-2">{t('settings.delete_account')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cette action est irréversible. Toutes vos données, trajets, transactions et informations personnelles seront définitivement supprimés.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Seront supprimés :</strong> Profil, historique des courses, portefeuille, méthodes de paiement, favoris, et toutes données associées.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        Confirmer la suppression du compte
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          <strong>ATTENTION :</strong> Cette action est définitive et irréversible.
                        </p>
                        <p>
                          Toutes vos données seront supprimées définitivement dans les prochaines minutes.
                        </p>
                        <p>
                          Pour confirmer, tapez <strong>"SUPPRIMER"</strong> dans le champ ci-dessous :
                        </p>
                        <Input
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Tapez SUPPRIMER"
                          className="mt-2"
                        />
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'SUPPRIMER' || isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save indicator */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6">
        <Button 
          onClick={saveSettings} 
          disabled={loading}
          className="shadow-lg"
        >
          {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  );
};