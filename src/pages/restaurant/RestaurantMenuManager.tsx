import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ['Entrées', 'Plats', 'Desserts', 'Boissons'];

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  is_available: boolean;
  moderation_status: string;
  main_image_url: string | null;
  preparation_time: number | null;
}

export default function RestaurantMenuManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Plats',
    price: '',
    preparation_time: '15',
    main_image_url: '',
    is_available: true,
  });

  useEffect(() => {
    loadRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadProducts();
    }
  }, [restaurantId]);

  const loadRestaurantProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProduct = async () => {
    if (!restaurantId) return;

    try {
      setSaving(true);

      const productData = {
        restaurant_id: restaurantId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        preparation_time: parseInt(formData.preparation_time),
        main_image_url: formData.main_image_url || null,
        is_available: formData.is_available,
        moderation_status: 'pending',
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('food_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Plat mis à jour (en attente de modération)',
        });
      } else {
        const { error } = await supabase
          .from('food_products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Plat ajouté (en attente de modération)',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price.toString(),
      preparation_time: product.preparation_time?.toString() || '15',
      main_image_url: product.main_image_url || '',
      is_available: product.is_available,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Supprimer ce plat ?')) return;

    try {
      const { error } = await supabase
        .from('food_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Plat supprimé',
      });

      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Plats',
      price: '',
      preparation_time: '15',
      main_image_url: '',
      is_available: true,
    });
    setEditingProduct(null);
  };

  const getModerationBadge = (status: string) => {
    const variants: any = {
      pending: { label: 'En attente', variant: 'secondary' },
      approved: { label: 'Approuvé', variant: 'default' },
      rejected: { label: 'Rejeté', variant: 'destructive' },
    };
    const { label, variant } = variants[status] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion du Menu</h1>
            <p className="text-muted-foreground">Ajoutez et gérez vos plats</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau plat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Modifier le plat' : 'Nouveau plat'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nom du plat *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Poulet Moambé"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez votre plat..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Catégorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prix (CDF) *</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div>
                  <Label>Temps de préparation (min)</Label>
                  <Input
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                    placeholder="15"
                  />
                </div>

                <div>
                  <Label>URL de l'image</Label>
                  <Input
                    value={formData.main_image_url}
                    onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Disponible</Label>
                  <Switch
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSaveProduct}
                  disabled={saving || !formData.name || !formData.price}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
                  </div>
                  {getModerationBadge(product.moderation_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.main_image_url && (
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{product.price.toLocaleString()} FC</span>
                  <Badge variant={product.is_available ? 'default' : 'secondary'}>
                    {product.is_available ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun plat ajouté</p>
              <p className="text-sm text-muted-foreground">Commencez par ajouter votre premier plat</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
