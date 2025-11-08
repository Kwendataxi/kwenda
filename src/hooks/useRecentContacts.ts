import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecentContact {
  user_id: string;
  display_name: string;
  phone_number?: string;
  avatar_color: string;
  last_transfer_date: string;
  total_transfers: number;
}

// Generate consistent color gradient for each user
const generateAvatarColor = (userId: string): string => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  ];
  
  // Generate consistent index from userId
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const useRecentContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<RecentContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch recent transfers from this user
      const { data: transfers, error } = await supabase
        .from('wallet_transfers')
        .select(`
          recipient_id,
          created_at,
          profiles!wallet_transfers_recipient_id_fkey(
            id,
            display_name,
            phone_number
          )
        `)
        .eq('sender_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by recipient and count transfers
      const contactsMap = new Map<string, RecentContact>();

      transfers?.forEach((transfer: any) => {
        const recipientId = transfer.recipient_id;
        const profile = transfer.profiles;

        if (!profile || !recipientId) return;

        if (contactsMap.has(recipientId)) {
          const existing = contactsMap.get(recipientId)!;
          existing.total_transfers += 1;
          
          // Update last transfer date if more recent
          if (new Date(transfer.created_at) > new Date(existing.last_transfer_date)) {
            existing.last_transfer_date = transfer.created_at;
          }
        } else {
          contactsMap.set(recipientId, {
            user_id: recipientId,
            display_name: profile.display_name || 'Utilisateur',
            phone_number: profile.phone_number,
            avatar_color: generateAvatarColor(recipientId),
            last_transfer_date: transfer.created_at,
            total_transfers: 1,
          });
        }
      });

      // Convert to array and sort by total transfers (favorites first), then by date
      const sortedContacts = Array.from(contactsMap.values()).sort((a, b) => {
        if (b.total_transfers !== a.total_transfers) {
          return b.total_transfers - a.total_transfers;
        }
        return new Date(b.last_transfer_date).getTime() - new Date(a.last_transfer_date).getTime();
      });

      setContacts(sortedContacts.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recent contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user?.id]);

  const refreshContacts = () => {
    setLoading(true);
    fetchContacts();
  };

  return {
    contacts,
    loading,
    refreshContacts,
  };
};
