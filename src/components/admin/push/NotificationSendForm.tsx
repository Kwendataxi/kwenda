import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Eye, Bell, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationCampaigns } from '@/hooks/useNotificationCampaigns';
import { toast } from 'sonner';
import { callEdgeFunction } from '@/utils/edgeFunctionConfig';

const TARGET_OPTIONS = [
  { value: 'all_clients', label: 'Tous les clients', icon: Users, description: 'Utilisateurs de l\'app qui commandent des services' },
  { value: 'all_drivers', label: 'Tous les chauffeurs', icon: Users, description: 'Chauffeurs actifs et inactifs' },
  { value: 'active_drivers', label: 'Chauffeurs actifs', icon: CheckCircle2, description: 'Chauffeurs vérifiés et actifs uniquement' },
  { value: 'verified_drivers', label: 'Chauffeurs vérifiés', icon: CheckCircle2, description: 'Chauffeurs avec vérification complète' },
  { value: 'all_partners', label: 'Tous les partenaires', icon: Users, description: 'Partenaires de la plateforme' },
  { value: 'all_vendors', label: 'Tous les vendeurs', icon: Users, description: 'Vendeurs du marketplace' },
  { value: 'zone_users', label: 'Par zone géographique', icon: Users, description: 'Utilisateurs d\'une ville spécifique' }
];

interface RecipientCount {
  count: number;
  loading: boolean;
}

export const NotificationSendForm: React.FC = () => {
  const [form, setForm] = useState({
    target_type: 'all_clients',
    title: '',
    message: '',
    priority: 'normal',
    city: 'Kinshasa'
  });

  const [recipientCount, setRecipientCount] = useState<RecipientCount>({
    count: 0,
    loading: false
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);

  const { createCampaign } = useNotificationCampaigns();

  // Calculer le nombre de destinataires
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
        case 'all_vendors':
          query = supabase.from('seller_profiles').select('id', { count: 'exact', head: true }).eq('verified_seller', true);
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

  // Envoyer la notification
  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Le titre et le message sont obligatoires');
      return;
    }

    if (recipientCount.count === 0) {
      toast.error('Aucun destinataire trouvé pour cette sélection');
      return;
    }

    setSending(true);

    try {
      // Créer la campagne
      const created = await createCampaign({
        campaign_title: form.title.trim(),
        message_content: form.message.trim(),
        target_type: form.target_type,
        target_criteria: form.target_type === 'zone_users' ? { city: form.city } : {},
        priority: form.priority
      });

      if (!created) {
        setSending(false);
        return;
      }

      // Envoyer via notification-dispatcher
      try {
        await callEdgeFunction('notification-dispatcher', {
          action: 'send',
          notification: {
            type: 'broadcast',
            title: form.title.trim(),
            message: form.message.trim(),
            recipients: form.target_type,
            priority: form.priority,
            send_immediately: true
          }
        });

        toast.success(`Notification envoyée à ${recipientCount.count} destinataires`);
        
        // Réinitialiser le formulaire
        setForm({
          target_type: 'all_clients',
          title: '',
          message: '',
          priority: 'normal',
          city: 'Kinshasa'
        });
        setPreviewMode(false);
      } catch (edgeError) {
        console.error('Erreur Edge Function:', edgeError);
        toast.warning('Campagne créée mais erreur d\'envoi. Vérifier les logs.');
      }

    } catch (error) {
      console.error('Erreur envoi notification:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    calculateRecipients(form.target_type, form.city);
  }, [form.target_type, form.city]);

  const targetInfo = TARGET_OPTIONS.find(option => option.value === form.target_type) || TARGET_OPTIONS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {!previewMode ? (
          <>
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
                        <SelectItem value="Abidjan">Abidjan</SelectItem>
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
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Rédigez votre message ici..."
                    rows={6}
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {form.message.length}/500 caractères
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
                      {form.message || 'Contenu de la notification'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {form.priority === 'urgent' ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">À l'instant</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPreviewMode(!previewMode)}
              disabled={!form.title && !form.message}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Éditer' : 'Aperçu'}
            </Button>
            
            <Button
              className="w-full"
              onClick={handleSend}
              disabled={sending || !form.title || !form.message || recipientCount.count === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Envoi...' : `Envoyer à ${recipientCount.count}`}
            </Button>

            {recipientCount.count > 0 && (
              <div className="text-xs text-center text-muted-foreground">
                La notification sera envoyée immédiatement
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
