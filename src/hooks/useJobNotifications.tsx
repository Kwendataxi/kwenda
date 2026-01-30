/**
 * 🔔 Hook pour les notifications d'offres d'emploi Kwenda Job
 * Écoute les nouveaux jobs via Supabase Realtime
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

interface JobNotificationPreferences {
  enabled: boolean;
}

interface Job {
  id: string;
  title: string;
  company_name: string;
  location_city: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
}

/**
 * Récupère les préférences de notification job depuis localStorage
 */
const getJobNotificationPrefs = (): JobNotificationPreferences => {
  try {
    const stored = localStorage.getItem('job_notification_preferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return { enabled: true }; // Activé par défaut
};

/**
 * Sauvegarde les préférences de notification job
 */
export const saveJobNotificationPrefs = (prefs: JobNotificationPreferences) => {
  localStorage.setItem('job_notification_preferences', JSON.stringify(prefs));
};

/**
 * Formate le salaire pour affichage
 */
const formatSalary = (job: Job): string => {
  if (!job.salary_min && !job.salary_max) return '';
  
  const currency = job.salary_currency || 'CDF';
  
  if (job.salary_min && job.salary_max) {
    return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${currency}`;
  }
  
  if (job.salary_min) {
    return `À partir de ${job.salary_min.toLocaleString()} ${currency}`;
  }
  
  return `Jusqu'à ${job.salary_max?.toLocaleString()} ${currency}`;
};

/**
 * Hook principal pour les notifications job
 */
export const useJobNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Ne rien faire si pas d'utilisateur connecté
    if (!user) return;

    // Vérifier les préférences
    const prefs = getJobNotificationPrefs();
    if (!prefs.enabled) {
      console.log('🔕 Notifications job désactivées');
      return;
    }

    // S'abonner aux nouveaux jobs
    const channel = supabase
      .channel('job-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.active'
        },
        (payload) => {
          const job = payload.new as Job;
          
          console.log('📢 Nouvelle offre d\'emploi:', job.title);
          
          // Afficher le toast
          const salary = formatSalary(job);
          
          toast.custom(
            (t) => (
              <div className="bg-background/95 backdrop-blur-md border border-primary/20 rounded-2xl shadow-lg p-4 max-w-sm animate-in slide-in-from-top-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                    <span className="text-lg">💼</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.company_name} • {job.location_city}
                    </p>
                    {salary && (
                      <p className="text-xs font-medium text-primary mt-1">
                        {salary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      toast.dismiss(t);
                      navigate(`/job/${job.id}`);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Voir l'offre
                  </button>
                  <button
                    onClick={() => toast.dismiss(t)}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            ),
            {
              duration: 8000,
              position: 'top-center'
            }
          );

          // Envoyer une notification push native si disponible
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Nouvelle offre Kwenda Job', {
                body: `${job.title} - ${job.company_name} (${job.location_city})`,
                icon: '/icons/icon-192x192.png',
                tag: `job-${job.id}`,
                data: { url: `/job/${job.id}` }
              });
            } catch (err) {
              console.warn('Push notification failed:', err);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Job notifications subscription:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, navigate]);

  return null;
};

/**
 * Composant invisible qui active les notifications job
 */
export const JobNotificationListener = () => {
  useJobNotifications();
  return null;
};

export default useJobNotifications;
