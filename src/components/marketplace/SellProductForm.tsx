import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Camera, Upload, X, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MARKETPLACE_CATEGORIES, PRODUCT_CONDITIONS } from '@/config/marketplaceCategories';

interface SellProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: File[];
  stock_count: number;
  brand: string;
  specifications: Record<string, string>;
}

interface SellProductFormProps {
  onBack: () => void;
  onSubmit: (data: SellProductFormData) => void;
}


export const SellProductForm: React.FC<SellProductFormProps> = ({ onBack, onSubmit }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SellProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    images: [],
    stock_count: 1,
    brand: '',
    specifications: {}
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const handleInputChange = (field: keyof SellProductFormData, value: string | number) => {
    if (field === 'stock_count') {
      setFormData(prev => ({ ...prev, [field]: Number(value) || 1 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addSpecification = () => {
    if (!specKey.trim() || !specValue.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir la clé et la valeur de la spécification",
        variant: "destructive"
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [specKey.trim()]: specValue.trim() }
    }));
    setSpecKey('');
    setSpecValue('');
  };

  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
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

    if (formData.images.length === 0) {
      toast({
        title: "Images requises",
        description: "Ajoutez au moins une photo de votre produit",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      toast({
        title: "Produit mis en vente",
        description: "Votre produit a été publié avec succès!",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la publication",
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
            <h1 className="text-lg font-semibold text-foreground">Vendre un produit</h1>
            <p className="text-sm text-muted-foreground">Ajoutez les détails de votre produit</p>
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
            <p className="text-sm text-muted-foreground">Ajoutez jusqu'à 5 photos (max 5MB chacune)</p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/100 caractères
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/500 caractères
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACE_CATEGORIES.filter(cat => cat.id !== 'all').map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condition">État *</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="État du produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CONDITIONS.map(condition => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Quantité en stock *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => handleInputChange('stock_count', String(Math.max(1, formData.stock_count - 1)))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_count}
                    onChange={(e) => handleInputChange('stock_count', e.target.value)}
                    min="1"
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => handleInputChange('stock_count', String(formData.stock_count + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="brand">Marque (optionnel)</Label>
                <Input
                  id="brand"
                  placeholder="Ex: Apple, Samsung..."
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                />
              </div>
            </div>

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

            {/* Spécifications techniques */}
            <div className="space-y-3">
              <Label>Spécifications techniques (optionnel)</Label>
              <div className="space-y-2">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm">
                      <span className="font-medium">{key}:</span> {value}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecification(key)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Ex: Processeur"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                />
                <Input
                  placeholder="Ex: Intel Core i5"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpecification}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une spécification
              </Button>
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
            {isSubmitting ? 'Publication...' : 'Mettre en vente'}
          </Button>
        </div>
      </form>
    </div>
  );
};