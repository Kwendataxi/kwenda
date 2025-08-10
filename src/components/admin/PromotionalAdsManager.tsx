import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PromotionalAd {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  cta_text: string;
  cta_action: string;
  cta_target: string | null;
  target_zones: any[];
  target_user_types: string[];
  display_priority: number;
  is_active: boolean;
  click_count: number;
  impression_count: number;
  created_at: string;
}

export const PromotionalAdsManager = () => {
  const [ads, setAds] = useState<PromotionalAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<PromotionalAd | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    cta_text: 'En savoir plus',
    cta_action: 'service',
    cta_target: 'transport',
    display_priority: 1,
    is_active: true,
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_ads')
        .select('*')
        .order('display_priority', { ascending: false });

      if (error) throw error;
      setAds(data as PromotionalAd[] || []);
    } catch (error) {
      console.error('Erreur lors du chargement des publicités:', error);
      toast.error('Erreur lors du chargement des publicités');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAd) {
        const { error } = await supabase
          .from('promotional_ads')
          .update(formData)
          .eq('id', editingAd.id);

        if (error) throw error;
        toast.success('Publicité mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('promotional_ads')
          .insert([formData]);

        if (error) throw error;
        toast.success('Publicité créée avec succès');
      }

      setShowForm(false);
      setEditingAd(null);
      resetForm();
      fetchAds();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (ad: PromotionalAd) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url || '',
      cta_text: ad.cta_text,
      cta_action: ad.cta_action,
      cta_target: ad.cta_target || '',
      display_priority: ad.display_priority,
      is_active: ad.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) return;

    try {
      const { error } = await supabase
        .from('promotional_ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Publicité supprimée');
      fetchAds();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_ads')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Publicité ${!isActive ? 'activée' : 'désactivée'}`);
      fetchAds();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      cta_text: 'En savoir plus',
    cta_action: 'service',
      cta_target: 'transport',
      display_priority: 1,
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Publicités Promotionnelles</h2>
          <p className="text-muted-foreground">Gérez les espaces publicitaires de l'application</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle publicité
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>
              {editingAd ? 'Modifier la publicité' : 'Nouvelle publicité'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cta_text">Texte du bouton</Label>
                  <Input
                    id="cta_text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="image_url">URL de l'image</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cta_action">Type d'action</Label>
                  <Select value={formData.cta_action} onValueChange={(value) => setFormData({ ...formData, cta_action: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="product">Produit</SelectItem>
                      <SelectItem value="redirect">Redirection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cta_target">Cible</Label>
                  <Input
                    id="cta_target"
                    value={formData.cta_target}
                    onChange={(e) => setFormData({ ...formData, cta_target: e.target.value })}
                    placeholder="transport, marketplace, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="display_priority">Priorité</Label>
                  <Input
                    id="display_priority"
                    type="number"
                    value={formData.display_priority}
                    onChange={(e) => setFormData({ ...formData, display_priority: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Publicité active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingAd ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAd(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ads List */}
      <div className="space-y-4">
        {ads.map((ad, index) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {ad.image_url && (
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-foreground">{ad.title}</h3>
                        <Badge variant={ad.is_active ? 'default' : 'secondary'}>
                          {ad.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Badge variant="outline">
                          Priorité {ad.display_priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{ad.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {ad.impression_count} vues
                        </div>
                        <div className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          {ad.click_count} clics
                        </div>
                        <div>
                          CTR: {ad.impression_count > 0 ? ((ad.click_count / ad.impression_count) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={() => toggleActive(ad.id, ad.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ad)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ad.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {ads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucune publicité créée pour le moment</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              Créer votre première publicité
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};