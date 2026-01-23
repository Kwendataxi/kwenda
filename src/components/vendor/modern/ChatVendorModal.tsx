import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_avatar?: string;
  product_title: string;
  product_image?: string;
  product_price: number;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  status: string;
}

interface ChatVendorModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChatVendorModal: React.FC<ChatVendorModalProps> = ({
  open,
  onClose
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (open && user) {
      loadConversations();
      subscribeToMessages();
    }
  }, [open, user]);

  const subscribeToMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel('vendor-chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_messages'
        },
        (payload) => {
          console.log('Message update:', payload);
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error }: any = await supabase
        .from('marketplace_chats')
        .select('*')
        .eq('seller_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { count }: any = await supabase
            .from('marketplace_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            id: conv.id,
            product_id: conv.product_id,
            buyer_id: conv.buyer_id,
            buyer_name: conv.buyer?.display_name || 'Client',
            buyer_avatar: conv.buyer?.profile_photo_url,
            product_title: conv.products?.title || 'Produit',
            product_image: conv.products?.images?.[0],
            product_price: conv.products?.price || 0,
            last_message_at: conv.last_message_at,
            unread_count: count || 0,
            status: conv.status
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    navigate(`/marketplace/vendor/chat/${conversationId}`);
    onClose();
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.product_title.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'unread') return matchesSearch && conv.unread_count > 0;
    if (activeTab === 'active') return matchesSearch && conv.status === 'active';
    return matchesSearch;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  const activeCount = conversations.filter(c => c.status === 'active').length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Messages clients</DialogTitle>
              {totalUnread > 0 && (
                <Badge variant="destructive">{totalUnread} non lus</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6">
            <TabsTrigger value="all">
              Tous ({conversations.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Non lus ({totalUnread})
            </TabsTrigger>
            <TabsTrigger value="active">
              Actifs ({activeCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 overflow-y-auto px-6 pb-6 mt-0">
            {loading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 p-3 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'Aucune conversation trouvée' : 'Aucun message pour le moment'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {filteredConversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <button
                      onClick={() => handleConversationClick(conv.id)}
                      className="w-full p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.buyer_avatar} />
                          <AvatarFallback>
                            {conv.buyer_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{conv.buyer_name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.product_title}
                              </p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              {conv.last_message_at && (
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(conv.last_message_at), {
                                    addSuffix: true,
                                    locale: fr
                                  })}
                                </p>
                              )}
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm font-medium text-primary mt-1">
                            {conv.product_price.toLocaleString()} FC
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
