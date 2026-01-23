import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Camera, Upload, X, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditProductFormData {
  id: string;
  title: string;
  description: string;
  price: string;
  stock_count: string;
  category: string;
  condition: string;
  status: string;
  images: (File | string)[];
}

interface EditProductFormProps {
  product: any;
  onBack: () => void;
  onUpdate: () => void;
}

const categories = [
  { id: 'electronics', name: 'Électronique' },
  { id: 'fashion', name: 'Mode & Vêtements' },
  { id: 'home', name: 'Maison & Jardin' },
  { id: 'food', name: 'Alimentation' },
  { id: 'beauty', name: 'Beauté & Cosmétiques' },
  { id: 'sports', name: 'Sports & Loisirs' },
  { id: 'books', name: 'Livres & Éducation' },
  { id: 'automotive', name: 'Automobile' },
  { id: 'other', name: 'Autre' }
];

const conditions = [
  { id: 'new', name: 'Neuf' },
  { id: 'like-new', name: 'Comme neuf' },
  { id: 'good', name: 'Bon état' },
  { id: 'fair', name: 'État correct' },
  { id: 'poor', name: 'Usagé' }
];

const statuses = [
  { id: 'active', name: 'Actif' },
  { id: 'inactive', name: 'Inactif' },
  { id: 'sold', name: 'Vendu' }
];

export const EditProductForm: React.FC<EditProductFormProps> = ({ product, onBack, onUpdate }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<EditProductFormData>({
    id: product.id,
    title: product.title || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    stock_count: product.stock_count?.toString() || '1',
    category: product.category || '',
    condition: product.condition || '',
    status: product.status || 'active',
    images: Array.isArray(product.images) ? product.images : []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set up image previews for existing images
    if (Array.isArray(product.images)) {
      setImagePreviews(product.images.map(img => typeof img === 'string' ? img : ''));
    }
  }, [product]);

  const handleInputChange = (field: keyof EditProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - formData.images.length);
    
    newFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Les images doivent faire moins de 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Champs requis manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Handle image uploads for new files
      const imageUrls: string[] = [];
      
      for (const image of formData.images) {
        if (typeof image === 'string') {
          // Existing image URL
          imageUrls.push(image);
        } else {
          // New file to upload
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `product-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(filePath, image);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(filePath);

          imageUrls.push(urlData.publicUrl);
        }
      }

      // Prepare update data
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_count: parseInt(formData.stock_count) || 0,
        category: formData.category,
        condition: formData.condition,
        status: formData.status,
        images: imageUrls,
        updated_at: new Date().toISOString()
      };

      // ⚠️ Si produit était approuvé, repasser en pending pour re-modération
      let willRequireRemoderation = false;
      if (product.moderation_status === 'approved') {
        updateData.moderation_status = 'pending';
        updateData.moderated_at = null;
        updateData.moderator_id = null;
        willRequireRemoderation = true;
      }

      // Update product in database
      const { error } = await supabase
        .from('marketplace_products')
        .update(updateData)
        .eq('id', formData.id);

      if (error) throw error;

      toast({
        title: "✅ Produit mis à jour",
        description: willRequireRemoderation 
          ? "Votre produit a été re-soumis pour modération suite à vos modifications. Vous serez notifié une fois vérifié."
          : "Les modifications ont été enregistrées avec succès.",
      });

      onUpdate();
      onBack();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "❌ Erreur",
        description: "Une erreur est survenue lors de la modification",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-9 w-9 p-0 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Modifier le produit</h1>
            <p className="text-sm text-muted-foreground">Modifiez les détails de votre produit</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Images Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photos du produit *
            </CardTitle>
            <p className="text-sm text-muted-foreground">Jusqu'à 5 photos (max 5MB chacune)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {index === 0 && (
                    <Badge className="absolute bottom-2 left-2 text-xs bg-primary text-white">
                      Principal
                    </Badge>
                  )}
                </div>
              ))}
              
              {formData.images.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground text-center">Ajouter photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails du produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du produit *</Label>
              <Input
                id="title"
                placeholder="Ex: iPhone 15 Pro Max 256GB"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre produit, son état, ses caractéristiques..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condition">État</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="État du produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map(condition => (
                      <SelectItem key={condition.id} value={condition.id}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix (FC) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Ex: 850000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="stock_count">Quantité en stock *</Label>
                <Input
                  id="stock_count"
                  type="number"
                  placeholder="Ex: 10"
                  value={formData.stock_count}
                  onChange={(e) => handleInputChange('stock_count', e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut du produit" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Modification...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
};
