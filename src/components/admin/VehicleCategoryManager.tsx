import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Car, Settings, DollarSign } from 'lucide-react';

interface VehicleCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  color_class: string;
  base_price: number;
  recommended_price_range: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const VehicleCategoryManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VehicleCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_name: 'Car',
    color_class: 'text-blue-600',
    base_price: '',
    min_price: '',
    max_price: '',
    is_active: true,
    sort_order: '1'
  });

  // Mock data pour les catégories en attendant la vraie implémentation
  const categories = [
    { id: '1', name: 'ECO', description: 'Véhicules économiques et écologiques', icon_name: 'Car', color_class: 'text-green-600', base_price: 30000, recommended_price_range: {min: 25000, max: 40000}, is_active: true, sort_order: 1, created_at: new Date().toISOString() },
    { id: '2', name: 'PREMIUM', description: 'Véhicules haut de gamme', icon_name: 'Car', color_class: 'text-purple-600', base_price: 60000, recommended_price_range: {min: 50000, max: 80000}, is_active: true, sort_order: 2, created_at: new Date().toISOString() },
    { id: '3', name: 'FIRST CLASS', description: 'Véhicules de luxe', icon_name: 'Car', color_class: 'text-yellow-600', base_price: 100000, recommended_price_range: {min: 80000, max: 150000}, is_active: true, sort_order: 3, created_at: new Date().toISOString() },
    { id: '4', name: 'UTILITAIRES', description: 'Véhicules utilitaires', icon_name: 'Truck', color_class: 'text-blue-600', base_price: 45000, recommended_price_range: {min: 35000, max: 60000}, is_active: true, sort_order: 4, created_at: new Date().toISOString() }
  ];
  const isLoading = false;

  // Mutation pour créer/modifier une catégorie
  const saveCategory = useMutation({
    mutationFn: async (categoryData: any) => {
      const payload = {
        ...categoryData,
        base_price: parseFloat(categoryData.base_price) || 0,
        sort_order: parseInt(categoryData.sort_order) || 1,
        recommended_price_range: {
          min: parseFloat(categoryData.min_price) || 0,
          max: parseFloat(categoryData.max_price) || 0
        }
      };

      // Désactiver les mutations pour l'instant car les tables n'existent pas encore
      console.log('Sauvegarde désactivée:', payload);
      throw new Error('Fonctionnalité non disponible - tables en cours de création');
    },
    onSuccess: () => {
      toast({
        title: editingCategory ? 'Catégorie modifiée' : 'Catégorie créée',
        description: `La catégorie a été ${editingCategory ? 'modifiée' : 'créée'} avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ['vehicle-categories-admin'] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
        variant: 'destructive',
      });
      console.error('Save category error:', error);
    }
  });

  // Mutation pour supprimer une catégorie
  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      // Désactiver les suppressions pour l'instant
      console.log('Suppression désactivée:', categoryId);
      throw new Error('Fonctionnalité non disponible - tables en cours de création');
    },
    onSuccess: () => {
      toast({
        title: 'Catégorie supprimée',
        description: 'La catégorie a été supprimée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['vehicle-categories-admin'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
      console.error('Delete category error:', error);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_name: 'Car',
      color_class: 'text-blue-600',
      base_price: '',
      min_price: '',
      max_price: '',
      is_active: true,
      sort_order: '1'
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: VehicleCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon_name: category.icon_name || 'Car',
      color_class: category.color_class || 'text-blue-600',
      base_price: category.base_price?.toString() || '',
      min_price: category.recommended_price_range?.min?.toString() || '',
      max_price: category.recommended_price_range?.max?.toString() || '',
      is_active: category.is_active,
      sort_order: category.sort_order?.toString() || '1'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCategory.mutate(formData);
  };

  const iconOptions = [
    'Car', 'Truck', 'Bus', 'Bike', 'Plane', 'Ship', 'Train'
  ];

  const colorOptions = [
    { value: 'text-blue-600', label: 'Bleu', bg: 'bg-blue-100' },
    { value: 'text-green-600', label: 'Vert', bg: 'bg-green-100' },
    { value: 'text-purple-600', label: 'Violet', bg: 'bg-purple-100' },
    { value: 'text-orange-600', label: 'Orange', bg: 'bg-orange-100' },
    { value: 'text-red-600', label: 'Rouge', bg: 'bg-red-100' },
    { value: 'text-yellow-600', label: 'Jaune', bg: 'bg-yellow-100' }
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Types de Véhicules</h2>
          <p className="text-muted-foreground">
            Gérez les catégories de véhicules disponibles en location
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Modifier la Catégorie' : 'Créer une Catégorie'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la Catégorie</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PREMIUM"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la catégorie..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icône</Label>
                  <select
                    id="icon"
                    value={formData.icon_name}
                    onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <select
                    id="color"
                    value={formData.color_class}
                    onChange={(e) => setFormData({ ...formData, color_class: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_price">Prix de Base (CDF)</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="50000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_price">Prix Min Recommandé</Label>
                  <Input
                    id="min_price"
                    type="number"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                    placeholder="40000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_price">Prix Max Recommandé</Label>
                  <Input
                    id="max_price"
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                    placeholder="80000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordre d'Affichage</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Catégorie active</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={saveCategory.isPending}>
                  {saveCategory.isPending ? 'Sauvegarde...' : (editingCategory ? 'Modifier' : 'Créer')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorOptions.find(c => c.value === category.color_class)?.bg || 'bg-gray-100'}`}>
                    <Car className={`h-5 w-5 ${category.color_class || 'text-gray-600'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ordre: {category.sort_order}
                    </p>
                  </div>
                </div>
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}

              {category.base_price > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {category.base_price.toLocaleString()} CDF
                  </span>
                </div>
              )}

              {category.recommended_price_range && (
                <div className="text-sm text-muted-foreground">
                  Fourchette recommandée: {category.recommended_price_range.min?.toLocaleString()} - {category.recommended_price_range.max?.toLocaleString()} CDF
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCategory.mutate(category.id)}
                  disabled={deleteCategory.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!categories?.length && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Aucune catégorie de véhicule configurée</p>
              <p className="text-sm text-muted-foreground">
                Créez des catégories pour organiser les véhicules de location (ECO, PREMIUM, etc.)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};