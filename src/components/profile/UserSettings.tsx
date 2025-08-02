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

export const UserSettings = () => {
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState({
    // Notifications
    push_notifications: true,
    email_notifications: true,
    sms_notifications: false,
    booking_reminders: true,
    promotional_offers: false,
    
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

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      push_notifications: true,
      email_notifications: true,
      sms_notifications: false,
      booking_reminders: true,
      promotional_offers: false,
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
    });
    
    toast({
      title: "Paramètres réinitialisés",
      description: "Tous les paramètres ont été remis aux valeurs par défaut.",
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
          <h2 className="text-2xl font-bold">Paramètres</h2>
          <p className="text-muted-foreground">Personnalisez votre expérience Kwenda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings}>
            Réinitialiser
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notifications push</Label>
                <p className="text-xs text-muted-foreground">Recevoir des notifications sur votre appareil</p>
              </div>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(checked) => handleSettingChange('push_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notifications email</Label>
                <p className="text-xs text-muted-foreground">Recevoir des emails de confirmation</p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notifications SMS</Label>
                <p className="text-xs text-muted-foreground">Recevoir des SMS pour les courses importantes</p>
              </div>
              <Switch
                checked={settings.sms_notifications}
                onCheckedChange={(checked) => handleSettingChange('sms_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Rappels de réservation</Label>
                <p className="text-xs text-muted-foreground">Rappels avant vos courses programmées</p>
              </div>
              <Switch
                checked={settings.booking_reminders}
                onCheckedChange={(checked) => handleSettingChange('booking_reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Offres promotionnelles</Label>
                <p className="text-xs text-muted-foreground">Recevoir des offres spéciales et réductions</p>
              </div>
              <Switch
                checked={settings.promotional_offers}
                onCheckedChange={(checked) => handleSettingChange('promotional_offers', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Confidentialité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Partage de localisation</Label>
                <p className="text-xs text-muted-foreground">Partager votre position avec le chauffeur</p>
              </div>
              <Switch
                checked={settings.location_sharing}
                onCheckedChange={(checked) => handleSettingChange('location_sharing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Historique visible</Label>
                <p className="text-xs text-muted-foreground">Permettre aux chauffeurs de voir vos trajets récents</p>
              </div>
              <Switch
                checked={settings.ride_history_visible}
                onCheckedChange={(checked) => handleSettingChange('ride_history_visible', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Visibilité du profil</Label>
              <Select
                value={settings.profile_visibility}
                onValueChange={(value) => handleSettingChange('profile_visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Amis seulement</SelectItem>
                  <SelectItem value="private">Privé</SelectItem>
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
              Langue et région
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Langue de l'interface</Label>
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
                Choisissez votre langue préférée pour l'application
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Préférences d'application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Mode sombre</Label>
                <p className="text-xs text-muted-foreground">Interface en mode sombre</p>
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
                <Label className="text-sm font-medium">Effets sonores</Label>
                <p className="text-xs text-muted-foreground">Sons lors des notifications et interactions</p>
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
                <Label className="text-sm font-medium">Localisation automatique</Label>
                <p className="text-xs text-muted-foreground">Détecter automatiquement votre position</p>
              </div>
              <Switch
                checked={settings.auto_location}
                onCheckedChange={(checked) => handleSettingChange('auto_location', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Cartes hors ligne</Label>
                <p className="text-xs text-muted-foreground">Télécharger les cartes pour utilisation hors ligne</p>
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
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Authentification à deux facteurs</Label>
                  <p className="text-xs text-muted-foreground">Protection supplémentaire de votre compte</p>
                  {settings.two_factor_auth && (
                    <Badge variant="secondary" className="mt-1">Activé</Badge>
                  )}
                </div>
                <Switch
                  checked={settings.two_factor_auth}
                  onCheckedChange={(checked) => handleSettingChange('two_factor_auth', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Connexion biométrique</Label>
                  <p className="text-xs text-muted-foreground">Empreinte digitale ou reconnaissance faciale</p>
                  {settings.biometric_login && (
                    <Badge variant="secondary" className="mt-1">Activé</Badge>
                  )}
                </div>
                <Switch
                  checked={settings.biometric_login}
                  onCheckedChange={(checked) => handleSettingChange('biometric_login', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Déconnexion automatique</Label>
                  <p className="text-xs text-muted-foreground">Se déconnecter après une période d'inactivité</p>
                  {settings.auto_logout && (
                    <Badge variant="secondary" className="mt-1">Activé</Badge>
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
              Zone dangereuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <h3 className="font-semibold text-destructive mb-2">Supprimer définitivement mon compte</h3>
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