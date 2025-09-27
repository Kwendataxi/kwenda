import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, MessageSquare, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationForm {
  title: string;
  content: string;
  target_type: string;
  target_criteria: any;
  priority: string;
  type_id?: string;
  template_id?: string;
}

export function AdminNotificationManager() {
  const [activeTab, setActiveTab] = useState('send');
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    content: '',
    target_type: 'all',
    target_criteria: {},
    priority: 'normal'
  });
  
  const { 
    loading, 
    types, 
    templates, 
    notifications, 
    stats, 
    sendNotification,
    renderTemplate 
  } = useAdminNotifications();
  
  const { toast } = useToast();

  const handleSendNotification = async () => {
    if (!form.title || !form.content) {
      toast({
        title: "Erreur",
        description: "Le titre et le contenu sont requis",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendNotification(form);
      setForm({
        title: '',
        content: '',
        target_type: 'all',
        target_criteria: {},
        priority: 'normal'
      });
      toast({
        title: "Succès",
        description: "Notification envoyée avec succès",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getTargetTypeBadge = (targetType: string) => {
    const typeMap = {
      all: { variant: 'default' as const, label: 'Tous' },
      drivers: { variant: 'secondary' as const, label: 'Chauffeurs' },
      clients: { variant: 'outline' as const, label: 'Clients' },
      partners: { variant: 'destructive' as const, label: 'Partenaires' }
    };
    
    const config = typeMap[targetType as keyof typeof typeMap] || { 
      variant: 'secondary' as const, 
      label: targetType 
    };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { variant: 'secondary' as const, label: 'Basse' },
      normal: { variant: 'default' as const, label: 'Normale' },
      high: { variant: 'destructive' as const, label: 'Haute' },
      urgent: { variant: 'destructive' as const, label: 'Urgente' }
    };
    
    const config = priorityMap[priority as keyof typeof priorityMap] || { 
      variant: 'default' as const, 
      label: priority 
    };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Notifications</h1>
          <p className="text-muted-foreground">
            Envoyez des notifications et gérez les communications
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send">Envoyer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nouvelle Notification</CardTitle>
                <CardDescription>
                  Créez et envoyez une notification à vos utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Titre</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Titre de la notification"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type de cible</label>
                  <Select 
                    value={form.target_type} 
                    onValueChange={(value) => setForm({ ...form, target_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="drivers">Chauffeurs</SelectItem>
                      <SelectItem value="clients">Clients</SelectItem>
                      <SelectItem value="partners">Partenaires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priorité</label>
                  <Select 
                    value={form.priority} 
                    onValueChange={(value) => setForm({ ...form, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Contenu</label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Contenu de la notification"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSendNotification} 
                  className="w-full"
                  disabled={loading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer Notification
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aperçu</CardTitle>
                <CardDescription>
                  Prévisualisation de votre notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{form.title || 'Titre de la notification'}</span>
                    {getPriorityBadge(form.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {form.content || 'Contenu de la notification...'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Cible: {getTargetTypeBadge(form.target_type)}</span>
                    <span>Maintenant</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Notifications</CardTitle>
              <CardDescription>
                Toutes les notifications envoyées récemment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          {getTargetTypeBadge(notification.target_type)}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Envoyé: {new Date(notification.created_at).toLocaleString('fr-FR')}</span>
                          <span>Destinataires: {notification.total_recipients}</span>
                          <span>Succès: {notification.successful_sends}</span>
                          {notification.failed_sends > 0 && (
                            <span className="text-red-600">Échecs: {notification.failed_sends}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant={notification.status === 'sent' ? "default" : "secondary"}>
                        {notification.status === 'sent' ? 'Envoyé' : notification.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune notification envoyée récemment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Notification</CardTitle>
              <CardDescription>
                Gérez vos modèles de notifications prédéfinis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Titre: {template.title_template}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.content_template}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun template disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Envoyés</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_sent}</div>
                <p className="text-xs text-muted-foreground">
                  Notifications envoyées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Lecture</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.read_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total_read} notifications lues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_pending}</div>
                <p className="text-xs text-muted-foreground">
                  Notifications en attente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Échecs</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.total_failed}</div>
                <p className="text-xs text-muted-foreground">
                  Notifications échouées
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance des Notifications</CardTitle>
              <CardDescription>
                Statistiques détaillées sur l'efficacité des notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Taux de succès d'envoi</span>
                  <Badge variant="default">
                    {stats.total_sent > 0 ? (((stats.total_sent - stats.total_failed) / stats.total_sent) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Engagement utilisateurs</span>
                  <Badge variant="secondary">
                    {stats.read_rate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notifications en file d'attente</span>
                  <Badge variant={stats.total_pending > 0 ? "destructive" : "default"}>
                    {stats.total_pending}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}