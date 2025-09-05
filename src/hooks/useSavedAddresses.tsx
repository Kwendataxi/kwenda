import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

interface SavedAddress {
  id: string;
  label: string;
  address_line: string;
  city: string;
  commune?: string;
  quartier?: string;
  coordinates?: any;
  is_default: boolean;
  address_type: string;
  created_at: string;
}

export const useSavedAddresses = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des adresses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les adresses sauvegardées.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAddress = async (addressData: Omit<SavedAddress, 'id' | 'created_at'>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Si c'est une adresse par défaut, retirer le statut des autres
      if (addressData.is_default) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_addresses')
        .insert({
          ...addressData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setAddresses(prev => [data, ...prev.filter(addr => !data.is_default || !addr.is_default)]);
      
      toast({
        title: "Adresse sauvegardée",
        description: `L'adresse "${addressData.label}" a été ajoutée à vos favoris.`,
      });

      return data;
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de l\'adresse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'adresse.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddress = async (id: string, updates: Partial<SavedAddress>) => {
    setIsLoading(true);
    try {
      // Si on définit comme adresse par défaut, retirer le statut des autres
      if (updates.is_default) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id);
      }

      const { data, error } = await supabase
        .from('saved_addresses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAddresses(prev => prev.map(addr => 
        addr.id === id ? { ...addr, ...data } : 
        updates.is_default ? { ...addr, is_default: false } : addr
      ));

      toast({
        title: "Adresse mise à jour",
        description: "Les modifications ont été sauvegardées.",
      });

      return data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'adresse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'adresse.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAddresses(prev => prev.filter(addr => addr.id !== id));
      
      toast({
        title: "Adresse supprimée",
        description: "L'adresse a été supprimée de vos favoris.",
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'adresse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'adresse.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultAddress = async (id: string) => {
    await updateAddress(id, { is_default: true });
  };

  const getDefaultAddress = () => {
    return addresses.find(addr => addr.is_default);
  };

  const getAddressesByType = (type: 'personal' | 'business') => {
    return addresses.filter(addr => addr.address_type === type);
  };

  return {
    addresses,
    saveAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    getAddressesByType,
    isLoading,
    refetch: fetchAddresses,
  };
};