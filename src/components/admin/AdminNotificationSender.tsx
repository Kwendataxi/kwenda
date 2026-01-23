/**
 * Composant simplifié pour l'envoi de notifications administratives
 * Interface intuitive avec ciblage par type de compte
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Users, Eye, Clock, AlertTriangle, CheckCircle2, Bell } from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  category: string;
}

interface RecipientCount {
  count: number;
  loading: boolean;
}

const PREDEFINED_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'general_announcement',
    name: 'Annonce générale',
    title: 'Information importante',
    content: 'Nous vous informons que...',
    category: 'general'
  },
  {
    id: 'service_update',
    name: 'Mise à jour de service',
    title: 'Mise à jour du service KwendaRide',
    content: 'De nouvelles fonctionnalités sont maintenant disponibles...',
    category: 'service'
  },
  {
    id: 'maintenance_alert',
    name: 'Maintenance programmée',
    title: 'Maintenance du système',
    content: 'Une maintenance est programmée le {{date}} de {{start_time}} à {{end_time}}...',
    category: 'maintenance'
  },
  {
    id: 'security_alert',
    name: 'Alerte de sécurité',
    title: 'Alerte de sécurité importante',
    content: 'Nous avons détecté une activité suspecte sur votre compte...',
    category: 'security'
  }
];

const TARGET_OPTIONS = [
  { value: 'all_clients', label: 'Tous les clients', icon: Users, description: 'Utilisateurs de l\'app qui commandent des services' },
  { value: 'all_drivers', label: 'Tous les chauffeurs', icon: Users, description: 'Chauffeurs actifs et inactifs' },
  { value: 'active_drivers', label: 'Chauffeurs actifs', icon: CheckCircle2, description: 'Chauffeurs vérifiés et actifs uniquement' },
  { value: 'verified_drivers', label: 'Chauffeurs vérifiés', icon: CheckCircle2, description: 'Chauffeurs avec vérification complète' },
  { value: 'all_partners', label: 'Tous les partenaires', icon: Users, description: 'Partenaires de la plateforme' },
  { value: 'all_admins', label: 'Tous les admins', icon: Users, description: 'Équipe administrative' },
  { value: 'zone_users', label: 'Par zone géographique', icon: Users, description: 'Chauffeurs d\'une ville spécifique' }
];

export const AdminNotificationSender: React.FC = () => {
  const [form, setForm] = useState({
    target_type: 'all_clients',
    title: '',
    content: '',
    priority: 'normal',
    city: 'Kinshasa',
    template_id: ''
  });

  const [recipientCount, setRecipientCount] = useState<RecipientCount>({
    count: 0,
    loading: false
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  const { sendNotification, types } = useAdminNotifications();
  const { toast } = useToast();

  /**
   * Calculer le nombre de destinataires
   */
  const calculateRecipients = async (targetType: string, city?: string) => {
    setRecipientCount({ count: 0, loading: true });

    try {
      let query;
      
      switch (targetType) {
        case 'all_clients':
          query = supabase.from('clients').select('id', { count: 'exact', head: true }).eq('is_active', true);
          break;
        case 'all_drivers':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true }).eq('is_active', true);
          break;
        case 'active_drivers':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .in('verification_status', ['verified', 'approved']);
          break;
        case 'verified_drivers':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true })
            .eq('verification_status', 'verified')
            .eq('is_active', true);
          break;
        case 'all_partners':
          query = supabase.from('partenaires').select('id', { count: 'exact', head: true }).eq('is_active', true);
          break;
        case 'all_admins':
          query = supabase.from('admins').select('id', { count: 'exact', head: true }).eq('is_active', true);
          break;
        case 'zone_users':
          query = supabase.from('chauffeurs').select('id', { count: 'exact', head: true })
            .contains('service_areas', [city || 'Kinshasa'])
            .eq('is_active', true);
          break;
        default:
          setRecipientCount({ count: 0, loading: false });
          return;
      }

      const { count, error } = await query;
      
      if (error) {
        console.error('Erreur calcul destinataires:', error);
        setRecipientCount({ count: 0, loading: false });
        return;
      }

      setRecipientCount({ count: count || 0, loading: false });
    } catch (error) {
      console.error('Erreur calcul destinataires:', error);
      setRecipientCount({ count: 0, loading: false });
    }
  };

  /**
   * Appliquer un template prédéfini
   */
  const applyTemplate = (template: NotificationTemplate) => {
    setForm(prev => ({
      ...prev,
      title: template.title,
      content: template.content,
      template_id: template.id
    }));
  };

  /**
   * Envoyer la notification
   */
  const handleSendNotification = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({
        title: "Champs requis",
        description: "Le titre et le contenu sont obligatoires.",
        variant: "destructive"
      });
      return;
    }

    if (recipientCount.count === 0) {
      toast({
        title: "Aucun destinataire",
        description: "Aucun destinataire trouvé pour cette sélection.",
        variant: "destructive"
      });
      return;
    }

    setSendingNotification(true);

    try {
      const notificationData = {
        type_id: types[0]?.id || '1', // Utiliser le premier type disponible
        title: form.title.trim(),
        content: form.content.trim(),
        target_type: form.target_type,
        target_criteria: form.target_type === 'zone_users' ? { city: form.city } : {},
        priority: form.priority
      };

      await sendNotification(notificationData);

      // Réinitialiser le formulaire
      setForm({
        target_type: 'all_clients',
        title: '',
        content: '',
        priority: 'normal',
        city: 'Kinshasa',
        template_id: ''
      });
      
      setPreviewMode(false);
      
      toast({
        title: "Notification envoyée",
        description: `Notification envoyée à ${recipientCount.count} destinataires.`,
      });

    } catch (error) {
      console.error('Erreur envoi notification:', error);
    } finally {
      setSendingNotification(false);
    }
  };

  /**
   * Obtenir l'icône et la description du type de destinataire
   */
  const getTargetInfo = (targetType: string) => {
    return TARGET_OPTIONS.find(option => option.value === targetType) || TARGET_OPTIONS[0];
  };

  // Recalculer les destinataires quand le type ou la ville change
  useEffect(() => {
    calculateRecipients(form.target_type, form.city);
  }, [form.target_type, form.city]);

  const targetInfo = getTargetInfo(form.target_type);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Envoyer une notification</h2>
          <p className="text-muted-foreground">
            Diffuser des informations importantes aux utilisateurs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            disabled={!form.title && !form.content}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Éditer' : 'Aperçu'}
          </Button>
          
          <Button
            onClick={handleSendNotification}
            disabled={sendingNotification || !form.title || !form.content || recipientCount.count === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            {sendingNotification ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {!previewMode ? (
            <>
              {/* Templates prédéfinis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Templates prédéfinis
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez un template pour gagner du temps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PREDEFINED_TEMPLATES.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        className="h-auto p-4 text-left justify-start"
                        onClick={() => applyTemplate(template)}
                      >
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {template.title}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Destinataires */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Destinataires
                  </CardTitle>
                  <CardDescription>
                    Choisissez qui recevra cette notification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type de destinataires</Label>
                    <Select 
                      value={form.target_type} 
                      onValueChange={(value) => setForm(prev => ({ ...prev, target_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {targetInfo.description}
                    </p>
                  </div>

                  {form.target_type === 'zone_users' && (
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Select 
                        value={form.city} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, city: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                          <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                          <SelectItem value="Kolwezi">Kolwezi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Destinataires trouvés:</span>
                      {recipientCount.loading ? (
                        <Badge variant="secondary">Calcul...</Badge>
                      ) : (
                        <Badge variant={recipientCount.count > 0 ? "default" : "secondary"}>
                          {recipientCount.count} personnes
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contenu */}
              <Card>
                <CardHeader>
                  <CardTitle>Contenu de la notification</CardTitle>
                  <CardDescription>
                    Rédigez le message à envoyer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Nouvelle fonctionnalité disponible"
                      maxLength={100}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {form.title.length}/100 caractères
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Message *</Label>
                    <Textarea
                      id="content"
                      value={form.content}
                      onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Rédigez votre message ici..."
                      rows={6}
                      maxLength={500}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {form.content.length}/500 caractères
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Priorité</Label>
                    <Select 
                      value={form.priority} 
                      onValueChange={(value) => setForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Mode Aperçu */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Aperçu de la notification
                </CardTitle>
                <CardDescription>
                  Voici comment apparaîtra votre notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Bell className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{form.title || 'Titre de la notification'}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {form.content || 'Contenu de la notification'}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {form.priority === 'urgent' ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {form.priority === 'low' ? 'Basse' : form.priority === 'normal' ? 'Normale' : form.priority === 'high' ? 'Élevée' : 'Urgente'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Maintenant
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panneau de résumé */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Destinataires</Label>
                <div className="flex items-center gap-2 mt-1">
                  <targetInfo.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{targetInfo.label}</span>
                </div>
                {form.target_type === 'zone_users' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Ville: {form.city}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Nombre de destinataires</Label>
                <div className="mt-1">
                  {recipientCount.loading ? (
                    <Badge variant="secondary">Calcul en cours...</Badge>
                  ) : (
                    <Badge variant={recipientCount.count > 0 ? "default" : "destructive"}>
                      {recipientCount.count} personnes
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Priorité</Label>
                <div className="mt-1">
                  <Badge variant={form.priority === 'urgent' ? 'destructive' : form.priority === 'high' ? 'secondary' : 'outline'}>
                    {form.priority === 'low' ? 'Basse' : form.priority === 'normal' ? 'Normale' : form.priority === 'high' ? 'Élevée' : 'Urgente'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">
                  {!form.title || !form.content ? (
                    <Badge variant="secondary">Brouillon</Badge>
                  ) : recipientCount.count === 0 ? (
                    <Badge variant="destructive">Aucun destinataire</Badge>
                  ) : (
                    <Badge variant="default">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Prêt à envoyer
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};