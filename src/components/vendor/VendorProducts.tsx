import { MyProductsList } from '@/components/marketplace/MyProductsList';
import { SellProductForm } from '@/components/marketplace/SellProductForm';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const VendorProducts = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMyProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      return [];
    }

    return (data || []).map(p => ({ 
      ...p, 
      currency: 'CDF',
      moderation_status: p.moderation_status as 'pending' | 'approved' | 'rejected',
      images: Array.isArray(p.images) ? p.images.map(img => String(img)) : []
    }));
  };

  const handleProductAdded = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes produits</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Annuler' : 'Ajouter un produit'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-sm text-muted-foreground mb-4">
            Utilisez l'interface marketplace pour ajouter des produits
          </p>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Fermer
          </Button>
        </div>
      )}

      <MyProductsList key={refreshKey} loadMyProducts={loadMyProducts} />
    </div>
  );
};
