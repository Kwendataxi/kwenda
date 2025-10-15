import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Store } from 'lucide-react';
import { VendorShopShareButtons } from './VendorShopShareButtons';

export const VendorShopSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorId, setVendorId] = useState<string>('');
  const [productCount, setProductCount] = useState(0);
  const [profile, setProfile] = useState({
    shop_name: '',
    shop_description: '',
    shop_banner_url: '',
    shop_logo_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendorProfile, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (vendorProfile) {
        setVendorId(vendorProfile.id);
        setProfile({
          shop_name: vendorProfile.shop_name || '',
          shop_description: vendorProfile.shop_description || '',
          shop_banner_url: vendorProfile.shop_banner_url || '',
          shop_logo_url: vendorProfile.shop_logo_url || ''
        });
      }

      // Get product count
      const { count } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('moderation_status', 'approved');
      
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté.'
        });
        return;
      }

      const { error } = await supabase
        .from('vendor_profiles')
        .upsert({
          user_id: user.id,
          shop_name: profile.shop_name,
          shop_description: profile.shop_description,
          shop_banner_url: profile.shop_banner_url,
          shop_logo_url: profile.shop_logo_url
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Boutique mise à jour',
        description: 'Les informations de votre boutique ont été enregistrées.'
      });

      // Reload to get vendor ID if it was just created
      if (!vendorId) {
        loadProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Configuration de la boutique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop_name">Nom de la boutique *</Label>
            <Input
              id="shop_name"
              value={profile.shop_name}
              onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
              placeholder="Ex: Électronique Plus"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop_description">Description</Label>
            <Textarea
              id="shop_description"
              value={profile.shop_description}
              onChange={(e) => setProfile({ ...profile, shop_description: e.target.value })}
              placeholder="Décrivez votre boutique et vos produits..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {profile.shop_description.length}/500 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop_logo">URL du logo (optionnel)</Label>
            <Input
              id="shop_logo"
              type="url"
              value={profile.shop_logo_url}
              onChange={(e) => setProfile({ ...profile, shop_logo_url: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Recommandé: 200x200px (format carré)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop_banner">URL de la bannière (optionnel)</Label>
            <Input
              id="shop_banner"
              type="url"
              value={profile.shop_banner_url}
              onChange={(e) => setProfile({ ...profile, shop_banner_url: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Recommandé: 1200x300px (ratio 16:9)
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !profile.shop_name.trim()}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {vendorId && profile.shop_name && (
        <Card>
          <CardHeader>
            <CardTitle>Partager ma boutique</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorShopShareButtons
              vendorId={vendorId}
              vendorName={profile.shop_name}
              productCount={productCount}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
