import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from './useUserRoles';

interface SecurityMetric {
  metric_name: string;
  metric_value: string;
  description: string;
  alert_level: string;
}

interface SecurityAlert {
  alert_type: string;
  severity: string;
  message: string;
  user_id: string;
  created_at: string;
}

interface SecurityStatus {
  check_type: string;
  status: string;
  details: string;
}

export const useSecurityDashboard = () => {
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [status, setStatus] = useState<SecurityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch security metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_security_dashboard_metrics');
      
      if (metricsError) {
        console.error('Error fetching security metrics:', metricsError);
      } else {
        setMetrics(metricsData || []);
      }

      // Fetch security alerts
      const { data: alertsData, error: alertsError } = await supabase
        .rpc('get_security_alerts_current');
      
      if (alertsError) {
        console.error('Error fetching security alerts:', alertsError);
      } else {
        setAlerts(alertsData || []);
      }

      // Fetch security status
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_security_status');
      
      if (statusError) {
        console.error('Error fetching security status:', statusError);
      } else {
        setStatus(statusData || []);
      }

    } catch (err) {
      console.error('Error in fetchSecurityData:', err);
      setError('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rolesLoading) {
      fetchSecurityData();
    }
  }, [isAdmin, rolesLoading]);

  const refresh = () => {
    fetchSecurityData();
  };

  return {
    metrics,
    alerts,
    status,
    loading: loading || rolesLoading,
    error,
    refresh,
    hasAccess: isAdmin
  };
};