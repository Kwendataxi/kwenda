import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Camera, Upload, X, ArrowLeft, ArrowRight, CheckCircle, Eye, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useProductFormValidation } from '@/hooks/useProductFormValidation';
import { CompactProductCard } from './CompactProductCard';
import { MARKETPLACE_CATEGORIES, PRODUCT_CONDITIONS } from '@/config/marketplaceCategories';
import { cn } from '@/lib/utils';

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
  onSubmit: (data: SellProductFormData) => Promise<boolean>;
}

export const SellProductForm: React.FC<SellProductFormProps> = ({ onBack, onSubmit }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
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

  const { 
    imagePreviews, 
    uploadedFiles,
    uploadImages, 
    removeImage, 
    isDragging, 
    setIsDragging 
  } = useImageUpload(3, 5);

  const { errors, completionRate, isValid } = useProductFormValidation({
    ...formData,
    images: imagePreviews as any
  });

  const steps = [
    { number: 1, title: 'Photos', icon: Camera },
    { number: 2, title: 'Détails', icon: Upload },
    { number: 3, title: 'Aperçu', icon: Eye }
  ];

  const handleNext = () => {
    if (currentStep === 1 && imagePreviews.length === 0) {
      toast({
        title: "Photos requises",
        description: "Ajoutez au moins une photo de votre produit",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    uploadImages(e.dataTransfer.files);
  };

  const handleInputChange = (field: keyof SellProductFormData, value: string | number) => {
    if (field === 'stock_count') {
      setFormData(prev => ({ ...prev, [field]: Number(value) || 1 }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <motion.div
              className={cn(
                "flex flex-col items-center gap-2",
                currentStep >= step.number ? "opacity-100" : "opacity-50"
              )}
              whileHover={{ scale: 1.05 }}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                currentStep >= step.number 
                  ? "bg-primary text-white shadow-lg" 
                  : "bg-muted text-muted-foreground"
              )}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{step.title}</span>
            </motion.div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-muted relative">
                <motion.div
                  className="absolute inset-0 bg-primary"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: currentStep > step.number ? '100%' : '0%' 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profil du produit</span>
            <Badge variant={completionRate === 100 ? "default" : "secondary"}>
              {completionRate}%
            </Badge>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* ÉTAPE 1 : PHOTOS */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos du produit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Drag & Drop Zone */}
                <motion.div
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                  whileHover={{ scale: 1.01 }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p className="font-medium text-lg mb-1">Glissez vos photos ici</p>
                  <p className="text-sm text-muted-foreground">ou cliquez pour parcourir</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum 3 photos • Max 5MB par photo
                  </p>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadImages(e.target.files)}
                  />
                </motion.div>

                {/* Image Previews - Horizontal Scroll */}
                {imagePreviews.length > 0 && (
                  <div className="mt-6">
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                      <AnimatePresence>
                        {imagePreviews.map((img, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="relative flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 group snap-start"
                          >
                            <img 
                              src={img} 
                              className="w-full h-full object-cover rounded-xl shadow-md" 
                              alt={`Preview ${i + 1}`}
                            />
                            <motion.button
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(i);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                            {i === 0 && (
                              <Badge className="absolute top-2 left-2 bg-primary text-xs">
                                Principale
                              </Badge>
                            )}
                            <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                              <Badge variant="secondary" className="text-[10px] bg-black/50 text-white">
                                {i + 1}/{imagePreviews.length}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Faites glisser pour voir toutes les photos • La première sera l'image principale
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ÉTAPE 2 : DÉTAILS */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Détails du produit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Titre avec validation */}
                <div className="relative">
                  <Label>Titre du produit *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: iPhone 13 Pro Max 256GB"
                    className={cn(
                      "border-2 transition-colors",
                      formData.title.length >= 10 ? "border-green-500" : "border-border"
                    )}
                  />
                  <AnimatePresence>
                    {formData.title.length >= 10 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-3 top-9"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.title && (
                    <p className="text-xs text-destructive mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Décrivez votre produit en détail (minimum 50 caractères)..."
                    rows={5}
                    maxLength={1000}
                    className={cn(
                      "border-2 transition-colors",
                      formData.description.length >= 50 ? "border-green-500" : "border-border"
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length}/1000 caractères (min. 50)
                    </p>
                    {errors.description && (
                      <p className="text-xs text-destructive mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>

                {/* Prix */}
                <div className="relative">
                  <Label>Prix (CDF) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Catégorie et Condition */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Catégorie *</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKETPLACE_CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>État *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => handleInputChange('condition', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="État" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CONDITIONS.map(cond => (
                          <SelectItem key={cond.value} value={cond.value}>
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stock + Brand */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantité en stock *</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleInputChange('stock_count', String(Math.max(1, formData.stock_count - 1)))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={formData.stock_count}
                        onChange={(e) => handleInputChange('stock_count', e.target.value)}
                        min={1}
                        max={9999}
                        className="text-center tabular-nums"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleInputChange('stock_count', String(Math.min(9999, formData.stock_count + 1)))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      1-9999 unités
                    </p>
                  </div>

                  <div>
                    <Label>Marque (optionnel)</Label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Ex: Samsung, Nike..."
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Si applicable
                    </p>
                  </div>
                </div>

                {/* Specifications (optionnel) */}
                <div>
                  <Label>Caractéristiques (optionnel)</Label>
                  <div className="space-y-2">
                    {Object.entries(formData.specifications).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <span className="text-sm flex-1">
                          <strong>{key}:</strong> {value}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const newSpecs = { ...formData.specifications };
                            delete newSpecs[key];
                            setFormData(prev => ({ ...prev, specifications: newSpecs }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {Object.keys(formData.specifications).length < 10 && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id="spec-key"
                          placeholder="Nom (ex: Couleur)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const key = (e.target as HTMLInputElement).value.trim();
                              const value = (document.getElementById('spec-value') as HTMLInputElement)?.value.trim();
                              if (key && value) {
                                setFormData(prev => ({
                                  ...prev,
                                  specifications: { ...prev.specifications, [key]: value }
                                }));
                                (e.target as HTMLInputElement).value = '';
                                (document.getElementById('spec-value') as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Input
                          id="spec-value"
                          placeholder="Valeur (ex: Noir)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = (e.target as HTMLInputElement).value.trim();
                              const key = (document.getElementById('spec-key') as HTMLInputElement)?.value.trim();
                              if (key && value) {
                                setFormData(prev => ({
                                  ...prev,
                                  specifications: { ...prev.specifications, [key]: value }
                                }));
                                (e.target as HTMLInputElement).value = '';
                                (document.getElementById('spec-key') as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Ajoutez des détails techniques (couleur, taille, garantie, etc.)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ÉTAPE 3 : APERÇU */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu en direct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <CompactProductCard
                    product={{
                      id: 'preview',
                      name: formData.title || "Titre du produit",
                      price: Number(formData.price) || 0,
                      image: imagePreviews[0] || '/placeholder.png',
                      rating: 0,
                      reviewCount: 0,
                      category: formData.category,
                      seller: "Vous",
                      sellerId: "preview",
                      isAvailable: true,
                    }}
                    onAddToCart={() => {}}
                    onViewDetails={() => {}}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Voici comment votre produit apparaîtra sur la marketplace
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        )}

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={async () => {
              // ✅ CORRECTION 4: Validation avant submit
              if (uploadedFiles.length === 0) {
                toast({
                  title: "Photos manquantes",
                  description: "Ajoutez au moins une photo avant de publier",
                  variant: "destructive"
                });
                return;
              }
              
              if (!formData.title || !formData.price || !formData.category) {
                toast({
                  title: "Champs incomplets",
                  description: "Remplissez tous les champs obligatoires",
                  variant: "destructive"
                });
                return;
              }
              
              // ✅ CORRECTION 2: Passer les Files objects au lieu des previews
              const success = await onSubmit({ ...formData, images: uploadedFiles });
              if (success) {
                setCurrentStep(1);
                setFormData({
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
              }
            }}
            disabled={!isValid || uploadedFiles.length === 0}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Publier le produit
          </Button>
        )}
      </div>
    </div>
  );
};
