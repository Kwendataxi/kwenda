import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationStats {
  total_sent: number;
  total_read: number;
  total_pending: number;
  total_failed: number;
  read_rate: number;
}

export interface NotificationType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface NotificationTemplate {
  id: string;
  type_id: string;
  name: string;
  title_template: string;
  content_template: string;
  is_active: boolean;
}

export interface AdminNotification {
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

export const useAdminNotifications = () => {
  const [loading, setLoading] = useState(false);
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
  const { toast } = useToast();

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
      console.error('Error loading notification stats:', error);
    }
  };

  const sendNotification = async (notificationData: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-notifications/send', {
        body: notificationData
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: data.message,
      });

      // Reload data
      await loadNotifications();
      await loadStats();

      return { success: true, data };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const renderTemplate = async (templateId: string, variables: Record<string, any>) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-notifications/render-template', {
        body: { template_id: templateId, variables }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du rendu du template",
        variant: "destructive"
      });
      throw error;
    }
  };

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

  useEffect(() => {
    loadData();
  }, []);

  return {
    loading,
    types,
    templates,
    notifications,
    stats,
    sendNotification,
    renderTemplate,
    loadData,
    refreshData: loadData
  };
};