import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bell, 
  Plus,
  Eye,
  Calendar,
  Target,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface NotificationTemplate {
  id: string;
  type_id: string;
  name: string;
  title_template: string;
  content_template: string;
  is_active: boolean;
}

interface AdminNotification {
  id: string;
  type_id: string;
  template_id?: string;
  title: string;
  content: string;
  target_type: string;
  target_criteria: any;
  priority: string;
  status: string;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  sent_at?: string;
  created_at: string;
}

interface NotificationStats {
  total_sent: number;
  total_read: number;
  total_pending: number;
  total_failed: number;
  read_rate: number;
}

export const AdminNotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_sent: 0,
    total_read: 0,
    total_pending: 0,
    total_failed: 0,
    read_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    type_id: '',
    template_id: '',
    title: '',
    content: '',
    target_type: 'all_users',
    target_criteria: {},
    priority: 'normal',
    scheduled_for: '',
    action_url: '',
    action_label: '',
    expires_at: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNotificationTypes(),
        loadTemplates(),
        loadNotifications(),
        loadStats()
      ]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationTypes = async () => {
    const { data, error } = await supabase
      .from('admin_notification_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setTypes(data || []);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('admin_notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    setTemplates(data || []);
  };

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setNotifications(data || []);
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-notifications/stats');
      if (error) throw error;
      setStats(data || {
        total_sent: 0,
        total_read: 0,
        total_pending: 0,
        total_failed: 0,
        read_rate: 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.type_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-notifications/send', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: data.message,
      });

      // Reset form
      setFormData({
        type_id: '',
        template_id: '',
        title: '',
        content: '',
        target_type: 'all_users',
        target_criteria: {},
        priority: 'normal',
        scheduled_for: '',
        action_url: '',
        action_label: '',
        expires_at: ''
      });

      setCreateDialogOpen(false);
      loadNotifications();
      loadStats();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    if (!templateId) {
      setFormData(prev => ({ ...prev, template_id: '', title: '', content: '' }));
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        title: template.title_template,
        content: template.content_template,
        type_id: template.type_id
      }));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500';
      case 'sending': return 'bg-yellow-500';
      case 'scheduled': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Envoyées</p>
                <p className="text-2xl font-bold">{stats.total_sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lues</p>
                <p className="text-2xl font-bold">{stats.total_read}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.total_pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de lecture</p>
                <p className="text-2xl font-bold">{stats.read_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="send">Envoyer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Nouvelle Notification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type de notification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type de notification</Label>
                  <Select value={formData.type_id} onValueChange={(value) => setFormData(prev => ({ ...prev, type_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="template">Template (optionnel)</Label>
                  <Select value={formData.template_id} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun template</SelectItem>
                      {templates.filter(t => !formData.type_id || t.type_id === formData.type_id).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contenu */}
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de la notification"
                />
              </div>

              <div>
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenu de la notification"
                  rows={4}
                />
              </div>

              {/* Ciblage et options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="target">Ciblage</Label>
                  <Select value={formData.target_type} onValueChange={(value) => setFormData(prev => ({ ...prev, target_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">Tous les utilisateurs</SelectItem>
                      <SelectItem value="user_role">Par rôle utilisateur</SelectItem>
                      <SelectItem value="specific_users">Utilisateurs spécifiques</SelectItem>
                      <SelectItem value="zone_users">Par zone géographique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduled">Programmée pour</Label>
                  <Input
                    id="scheduled"
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="action_url">URL d'action (optionnel)</Label>
                  <Input
                    id="action_url"
                    value={formData.action_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, action_url: e.target.value }))}
                    placeholder="/chemin-vers-action"
                  />
                </div>

                <div>
                  <Label htmlFor="action_label">Libellé du bouton d'action</Label>
                  <Input
                    id="action_label"
                    value={formData.action_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, action_label: e.target.value }))}
                    placeholder="Voir maintenant"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSendNotification} disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer la notification'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div key={notification.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notification.content}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getPriorityColor(notification.priority)} text-white`}>
                          {notification.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(notification.status)} text-white`}>
                          {notification.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{notification.total_recipients} destinataires</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{notification.successful_sends} envoyées</span>
                        </span>
                        {notification.failed_sends > 0 && (
                          <span className="flex items-center space-x-1">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>{notification.failed_sends} échouées</span>
                          </span>
                        )}
                      </div>
                      <span>
                        {notification.sent_at 
                          ? `Envoyée le ${format(new Date(notification.sent_at), 'dd/MM/yyyy à HH:mm')}`
                          : `Créée le ${format(new Date(notification.created_at), 'dd/MM/yyyy à HH:mm')}`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: {types.find(t => t.id === template.type_id)?.name}
                    </p>
                    <div className="mt-2 text-sm">
                      <p><strong>Titre:</strong> {template.title_template}</p>
                      <p className="mt-1"><strong>Contenu:</strong> {template.content_template}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};