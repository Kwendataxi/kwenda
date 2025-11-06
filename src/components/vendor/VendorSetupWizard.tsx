import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Store } from 'lucide-react';

const VendorSetupWizard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_description: ''
  });

  useEffect(() => {
    checkExistingProfile();
  }, [user]);

  const checkExistingProfile = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    // Vérifier si un profil existe déjà
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('id, shop_name, shop_description')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      // Profil existe, pré-remplir le formulaire
      setFormData({
        shop_name: data.shop_name || '',
        shop_description: data.shop_description || ''
      });
    }
    
    setLoading(false);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!formData.shop_name.trim()) {
      toast({
        title: "❌ Champ requis",
        description: "Le nom de la boutique est obligatoire",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .upsert({
          user_id: user.id,
          shop_name: formData.shop_name.trim(),
          shop_description: formData.shop_description.trim() || null
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "✅ Profil vendeur activé !",
        description: "Vous pouvez maintenant publier des produits"
      });

      navigate('/vendeur');
    } catch (error: any) {
      console.error('Erreur création profil vendeur:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible de créer le profil",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">🎉 Bienvenue chez Kwenda Vendeurs</CardTitle>
          <CardDescription>
            Complétez votre profil pour commencer à vendre sur la marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleComplete} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shop_name">
                Nom de votre boutique <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shop_name"
                placeholder="Ex: Électronique Plus"
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                required
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Ce nom sera visible par tous les clients
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop_description">Description de votre boutique</Label>
              <Textarea
                id="shop_description"
                placeholder="Décrivez vos produits et services..."
                value={formData.shop_description}
                onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.shop_description.length}/500 caractères
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">📋 Prochaines étapes :</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Votre profil sera créé immédiatement</li>
                <li>Vous pourrez publier des produits</li>
                <li>Les clients pourront visiter votre boutique</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="flex-1"
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting || !formData.shop_name.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Activer mon compte vendeur'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSetupWizard;
