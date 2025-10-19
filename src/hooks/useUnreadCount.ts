import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './useAuth';

const supabaseUrl = 'https://wddlktajnhwhyquwcdgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZGxrdGFqbmh3aHlxdXdjZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNDA1NjUsImV4cCI6MjA2OTcxNjU2NX0.rViBegpawtg1sFwafH_fczlB0oeA8E6V3MtDELcSIiU';

export const useUnreadCount = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }
        });
        
        const response: any = await client
          .from('system_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (response.count != null) {
          setUnreadCount(response.count as number);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Refresh toutes les 30s
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id]);

  return { unreadCount };
};
