import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Edit, Plus, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  name_fr: string;
  slug: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function CategoryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name_fr: '',
    description: '',
    icon: '',
  });

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['marketplace-categories-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as Category[];
    }
  });

  // Fetch product counts per category
  const { data: productCounts } = useQuery({
    queryKey: ['category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('category');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((product) => {
        counts[product.category] = (counts[product.category] || 0) + 1;
      });
      
      return counts;
    }
  });

  // Toggle category active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories-admin'] });
      toast({
        title: 'Succès',
        description: 'Statut de la catégorie mis à jour',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la catégorie',
        variant: 'destructive',
      });
      console.error('Error toggling category:', error);
    }
  });

  // Update category
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories-admin'] });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: 'Succès',
        description: 'Catégorie mise à jour',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la catégorie',
        variant: 'destructive',
      });
      console.error('Error updating category:', error);
    }
  });

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditForm({
      name_fr: category.name_fr,
      description: category.description || '',
      icon: category.icon || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCategory) return;
    
    updateCategoryMutation.mutate({
      id: selectedCategory.id,
      updates: editForm
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des catégories</h2>
          <p className="text-muted-foreground">Gérer les catégories de produits de la marketplace</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories?.filter(c => c.slug !== 'all').map((category) => {
          const productCount = productCounts?.[category.slug] || 0;
          
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {category.name_fr}
                      {!category.is_active && (
                        <Badge variant="secondary">Désactivée</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Slug: {category.slug}
                    </CardDescription>
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Produits actifs</span>
                  <Badge variant="outline">{productCount}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor={`active-${category.id}`}>Active</Label>
                  <Switch
                    id={`active-${category.id}`}
                    checked={category.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: category.id, is_active: checked })
                    }
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name_fr">Nom (français)</Label>
              <Input
                id="name_fr"
                value={editForm.name_fr}
                onChange={(e) => setEditForm({ ...editForm, name_fr: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="icon">Icône (Lucide)</Label>
              <Input
                id="icon"
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                placeholder="Ex: Smartphone, Home, etc."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateCategoryMutation.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
