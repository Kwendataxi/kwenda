import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Store } from 'lucide-react';

export const VendorShopSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    shop_name: '',
    shop_description: '',
    shop_banner_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          shop_name: data.shop_name || '',
          shop_description: data.shop_description || '',
          shop_banner_url: data.shop_banner_url || ''
        });
      }
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
          shop_banner_url: profile.shop_banner_url
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Boutique mise à jour',
        description: 'Les informations de votre boutique ont été enregistrées.'
      });
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
  );
};
