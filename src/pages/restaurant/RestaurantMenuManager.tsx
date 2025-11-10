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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { ProductImageUpload } from '@/components/restaurant/ProductImageUpload';
import { RestaurantLayout } from '@/components/restaurant/RestaurantLayout';
import { cn } from '@/lib/utils';
import { FOOD_CATEGORIES } from '@/config/foodCategories';

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
    category: 'plats',
    price: '',
    preparation_time: '15',
    main_image_url: '',
    is_available: true,
  });
  const [productImages, setProductImages] = useState<string[]>([]);

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

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Nom du plat
    if (!formData.name.trim()) {
      errors.push('Le nom du plat est obligatoire');
    } else if (formData.name.length < 3) {
      errors.push('Le nom doit contenir au moins 3 caractères');
    } else if (formData.name.length > 100) {
      errors.push('Le nom ne doit pas dépasser 100 caractères');
    }
    
    // Catégorie
    if (!formData.category) {
      errors.push('Veuillez sélectionner une catégorie');
    }
    
    // Prix
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      errors.push('Le prix est obligatoire');
    } else if (price <= 0) {
      errors.push('Le prix doit être supérieur à 0 CDF');
    } else if (price > 1000000) {
      errors.push('Le prix ne peut pas dépasser 1.000.000 CDF');
    }
    
    // Temps de préparation
    const prepTime = parseInt(formData.preparation_time);
    if (prepTime < 5) {
      errors.push('Le temps de préparation doit être d\'au moins 5 minutes');
    } else if (prepTime > 180) {
      errors.push('Le temps de préparation ne peut pas dépasser 180 minutes');
    }
    
    // Images (recommandé mais pas obligatoire)
    if (productImages.length === 0) {
      errors.push('⚠️ Recommandation : Ajoutez au moins une photo pour augmenter vos ventes');
    }
    
    return { valid: errors.length === 0, errors };
  };

  const handleSaveProduct = async () => {
    if (!restaurantId) return;

    // Validation
    const validation = validateForm();
    if (!validation.valid) {
      validation.errors.forEach(error => {
        toast({
          title: 'Validation échouée',
          description: error,
          variant: 'destructive',
        });
      });
      return;
    }

    try {
      setSaving(true);

      console.log('📝 [MenuManager] Saving product:', {
        name: formData.name,
        category: formData.category,
        price: formData.price,
        images: productImages.length
      });

      const productData = {
        restaurant_id: restaurantId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        price: parseFloat(formData.price),
        preparation_time: parseInt(formData.preparation_time),
        main_image_url: productImages[0] || null,
        images: productImages,
        is_available: formData.is_available,
        moderation_status: 'pending',
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('food_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }

        toast({
          title: '✅ Plat mis à jour',
          description: 'En attente de validation par l\'équipe Kwenda',
        });
      } else {
        const { data, error } = await supabase
          .from('food_products')
          .insert(productData)
          .select()
          .single();

        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }

        console.log('✅ Product created:', data);

        toast({
          title: '✅ Plat ajouté avec succès',
          description: 'Il sera visible après validation (environ 24h)',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadProducts();
    } catch (error: any) {
      console.error('❌ Save error:', error);
      
      let errorMessage = 'Impossible de sauvegarder le plat';
      
      // Messages d'erreur détaillés
      if (error.code === '23505') {
        errorMessage = 'Un plat avec ce nom existe déjà';
      } else if (error.code === '23503') {
        errorMessage = 'Erreur de référence (restaurant_id invalide)';
      } else if (error.code === '42501') {
        errorMessage = 'Permissions insuffisantes. Contactez le support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erreur de sauvegarde',
        description: errorMessage,
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
    // Charger les images existantes depuis la base
    setProductImages(product.main_image_url ? [product.main_image_url] : []);
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
      category: 'plats',
      price: '',
      preparation_time: '15',
      main_image_url: '',
      is_available: true,
    });
    setProductImages([]);
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
    <RestaurantLayout>
      <div className="container mx-auto px-4">
        <div className="space-y-6">
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
            <DialogContent className="max-w-2xl h-[90vh] sm:h-[95vh] flex flex-col p-0">
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
                <DialogTitle>
                  {editingProduct ? 'Modifier le plat' : 'Nouveau plat'}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="space-y-4 px-6 py-4">
                  <div>
                    <Label>Nom du plat *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Poulet Moambé"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>Minimum 3 caractères</span>
                      <span className={cn(
                        formData.name.length >= 100 && "text-destructive font-medium"
                      )}>
                        {formData.name.length}/100
                      </span>
                    </div>
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

                  <div>
                    <Label className="mb-3 block">Catégorie *</Label>
                    <RadioGroup 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      className="grid grid-cols-2 gap-3"
                    >
                      {FOOD_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <div key={cat.id}>
                            <RadioGroupItem
                              value={cat.id}
                              id={cat.id}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={cat.id}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all",
                                formData.category === cat.id && "border-primary bg-primary/10"
                              )}
                            >
                              <Icon className="h-6 w-6 mb-2" />
                              <span className="text-sm font-medium">{cat.name}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Prix (CDF) *</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="5000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 1.000.000 CDF
                    </p>
                  </div>

                  <div>
                    <Label>Temps de préparation (min)</Label>
                    <Input
                      type="number"
                      value={formData.preparation_time}
                      onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                      placeholder="15"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Entre 5 et 180 minutes
                    </p>
                  </div>

                  <div>
                    <Label>Photos du produit</Label>
                    <ProductImageUpload
                      restaurantId={restaurantId || ''}
                      currentImages={productImages}
                      onImagesChange={setProductImages}
                      maxImages={5}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Disponible</Label>
                    <Switch
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                    />
                  </div>
                </div>
              </ScrollArea>

              {/* Footer avec bouton fixe */}
              <div className="flex-shrink-0 border-t px-6 py-4 bg-background">
                <Button
                  className="w-full"
                  onClick={handleSaveProduct}
                  disabled={saving || !formData.name || !formData.price}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Mettre à jour' : 'Ajouter le plat'}
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
                  <span className="text-lg font-bold">{product.price.toLocaleString()} CDF</span>
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
    </RestaurantLayout>
  );
}
