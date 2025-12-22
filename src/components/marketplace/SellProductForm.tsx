import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Switch } from '../ui/switch';
import { Camera, Upload, X, ArrowLeft, ArrowRight, CheckCircle, Eye, Plus, Minus, Loader2, AlertCircle, FileCode, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useProductFormValidation } from '@/hooks/useProductFormValidation';
import { CompactProductCard } from './CompactProductCard';
import { DigitalFileUpload } from './DigitalFileUpload';
import { MARKETPLACE_CATEGORIES, PRODUCT_CONDITIONS } from '@/config/marketplaceCategories';
import {
  DigitalCategorySelector,
  DigitalCourseFields,
  DigitalEbookFields,
  DigitalTemplateFields,
  DigitalSoftwareFields,
  DigitalAudioVideoFields,
  DigitalPhotoFields,
  DigitalPresetFields,
  DigitalDocumentFields,
  DigitalOtherFields
} from './digital-fields';
import { cn } from '@/lib/utils';
import { debounce } from '@/utils/performanceUtils';

export interface SellProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: File[];
  stock_count: number;
  brand: string;
  specifications: Record<string, string>;
  // Champs digitaux
  is_digital: boolean;
  digital_file_url: string;
  digital_file_name: string;
  digital_file_size: number;
  digital_file_type: string;
  digital_download_limit: number;
  digital_category: string;
  digital_specs: Record<string, any>;
}

interface SellProductFormProps {
  onBack: () => void;
  onSubmit: (data: SellProductFormData) => Promise<boolean>;
  isSubmitting?: boolean;
  uploadProgress?: number;
}

export const SellProductForm: React.FC<SellProductFormProps> = ({ 
  onBack, 
  onSubmit,
  isSubmitting = false,
  uploadProgress = 0
}) => {
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
    specifications: {},
    // Champs digitaux
    is_digital: false,
    digital_file_url: '',
    digital_file_name: '',
    digital_file_size: 0,
    digital_file_type: '',
    digital_download_limit: 5,
    digital_category: '',
    digital_specs: {}
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
    // Pour les produits digitaux, on peut passer sans photos (optionnelles)
    if (currentStep === 1 && !formData.is_digital && imagePreviews.length === 0) {
      toast({
        title: "Photos requises",
        description: "Ajoutez au moins une photo de votre produit",
        variant: "destructive"
      });
      return;
    }
    // Pour les produits digitaux, vérifier que le fichier est uploadé
    if (currentStep === 1 && formData.is_digital && !formData.digital_file_url) {
      toast({
        title: "Fichier requis",
        description: "Téléchargez le fichier digital à vendre",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleDigitalFileUploaded = (fileData: {
    url: string;
    name: string;
    size: number;
    type: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      digital_file_url: fileData.url,
      digital_file_name: fileData.name,
      digital_file_size: fileData.size,
      digital_file_type: fileData.type
    }));
  };

  const handleDigitalToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_digital: checked,
      // Reset digital fields si on désactive
      ...(checked ? {} : {
        digital_file_url: '',
        digital_file_name: '',
        digital_file_size: 0,
        digital_file_type: '',
        digital_download_limit: 5
      }),
      // Pour les produits digitaux, mettre stock illimité et condition "new"
      ...(checked ? { stock_count: 9999, condition: 'new' } : {})
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    uploadImages(e.dataTransfer.files);
  };

  // ✅ PHASE 2: Debounced input handler pour meilleure performance
  const debouncedInputChange = useCallback(
    debounce((field: keyof SellProductFormData, value: string | number) => {
      if (field === 'stock_count') {
        setFormData(prev => ({ ...prev, [field]: Number(value) || 1 }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }, 300),
    []
  );

  const handleInputChange = (field: keyof SellProductFormData, value: string | number) => {
    // Inputs critiques sans debounce
    if (field === 'category' || field === 'condition' || field === 'stock_count') {
      if (field === 'stock_count') {
        setFormData(prev => ({ ...prev, [field]: Number(value) || 1 }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      // Inputs text avec debounce
      debouncedInputChange(field, value);
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

      {/* ✅ PHASE 3: Afficher la progression d'upload si en cours */}
      {isSubmitting && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">📤 Publication en cours...</p>
                <Progress value={uploadProgress} className="mt-2 h-2" />
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">{uploadProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      {!isSubmitting && (
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
      )}

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
            {/* Toggle Produit Digital */}
            <Card className={cn(
              "transition-all",
              formData.is_digital 
                ? "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800" 
                : ""
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      formData.is_digital 
                        ? "bg-purple-100 dark:bg-purple-900/30" 
                        : "bg-muted"
                    )}>
                      {formData.is_digital ? (
                        <FileCode className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="is-digital" className="font-medium cursor-pointer">
                        Produit Digital
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {formData.is_digital 
                          ? "Fichier téléchargeable (PDF, ZIP, MP3...)" 
                          : "Produit physique à livrer"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="is-digital"
                    checked={formData.is_digital}
                    onCheckedChange={handleDigitalToggle}
                  />
                </div>
                {formData.is_digital && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <Download className="h-3 w-3 mr-1" />
                      Téléchargement instantané
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Pas de livraison
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Fichier Digital OU Photos selon le type */}
            {formData.is_digital ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-purple-600" />
                    Fichier à vendre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DigitalFileUpload
                    onFileUploaded={handleDigitalFileUploaded}
                    downloadLimit={formData.digital_download_limit}
                    onDownloadLimitChange={(limit) => setFormData(prev => ({ ...prev, digital_download_limit: limit }))}
                    currentFile={formData.digital_file_url ? {
                      url: formData.digital_file_url,
                      name: formData.digital_file_name,
                      size: formData.digital_file_size,
                      type: formData.digital_file_type
                    } : null}
                  />
                  
                  {/* Photo de couverture optionnelle */}
                  <div className="mt-6 pt-6 border-t">
                    <Label className="text-sm text-muted-foreground mb-3 block">
                      Photo de couverture (optionnelle)
                    </Label>
                    <motion.div
                      className={cn(
                        "border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer",
                        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {imagePreviews.length > 0 ? (
                        <div className="flex items-center justify-center gap-4">
                          <img src={imagePreviews[0]} className="h-16 w-16 object-cover rounded-lg" alt="Cover" />
                          <div className="text-left">
                            <p className="text-sm font-medium">Image de couverture</p>
                            <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Ajouter une image de couverture</p>
                        </>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => uploadImages(e.target.files)}
                      />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            ) : (
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

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-6">
                      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                        {imagePreviews.map((img, i) => (
                          <div
                            key={i}
                            className="relative flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 group snap-start"
                          >
                            <img 
                              src={img} 
                              className="w-full h-full object-cover rounded-xl shadow-md" 
                              alt={`Preview ${i + 1}`}
                            />
                            <button
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(i);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
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
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Faites glisser pour voir toutes les photos • La première sera l'image principale
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                  <Label>
                    <div className="flex items-center justify-between">
                      <span>Description *</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {formData.description.length} caractères
                      </span>
                    </div>
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Décrivez votre produit en détail : caractéristiques, état, défauts éventuels, accessoires inclus..."
                    rows={10}
                    className={cn(
                      "min-h-[200px] resize-y border-2 transition-colors",
                      formData.description.length >= 20 ? "border-green-500" : "border-border"
                    )}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive mt-1">{errors.description}</p>
                  )}
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

                {/* Affichage conditionnel selon is_digital */}
                {formData.is_digital ? (
                  <>
                    {/* Sélecteur de catégorie digitale */}
                    <DigitalCategorySelector
                      value={formData.digital_category}
                      onChange={(cat) => setFormData(prev => ({ ...prev, digital_category: cat, digital_specs: {} }))}
                    />

                    {/* Champs spécifiques selon la catégorie digitale */}
                    {formData.digital_category === 'course' && (
                      <DigitalCourseFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'ebook' && (
                      <DigitalEbookFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'template' && (
                      <DigitalTemplateFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'software' && (
                      <DigitalSoftwareFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'audio' && (
                      <DigitalAudioVideoFields
                        type="audio"
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'video' && (
                      <DigitalAudioVideoFields
                        type="video"
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'photo' && (
                      <DigitalPhotoFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'preset' && (
                      <DigitalPresetFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'document' && (
                      <DigitalDocumentFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                    {formData.digital_category === 'other_digital' && (
                      <DigitalOtherFields
                        specs={formData.digital_specs}
                        onChange={(specs) => setFormData(prev => ({ ...prev, digital_specs: specs }))}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* Champs pour produits physiques */}
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
                            {MARKETPLACE_CATEGORIES.filter(cat => cat.id !== 'all' && cat.id !== 'digital').map(cat => (
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
                  </>
                )}

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
                      name: formData.title || "Nom du produit à vendre",
                      price: Number(formData.price) || 25000,
                      image: imagePreviews.length > 0 
                        ? imagePreviews[0] 
                        : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=400&fit=crop',
                      rating: 0,
                      reviewCount: 0,
                      category: formData.category || 'other',
                      seller: "Votre boutique",
                      sellerId: "preview",
                      isAvailable: formData.stock_count > 0,
                    }}
                    onAddToCart={() => {}}
                    onViewDetails={() => {}}
                  />
                </div>

                {/* Messages d'aide contextuels */}
                {imagePreviews.length === 0 && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        <strong>Aperçu temporaire.</strong> Ajoutez des photos à l'étape 1 pour voir votre produit réel.
                      </span>
                    </p>
                  </div>
                )}

                {imagePreviews.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Aperçu avec vos {imagePreviews.length} photo(s) uploadée(s)
                      </span>
                    </p>
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Voici comment votre produit apparaîtra sur la marketplace Kwenda
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
                  specifications: {},
                  is_digital: false,
                  digital_file_url: '',
                  digital_file_name: '',
                  digital_file_size: 0,
                  digital_file_type: '',
                  digital_download_limit: 5,
                  digital_category: '',
                  digital_specs: {}
                });
              }
            }}
            disabled={!isValid || (!formData.is_digital && uploadedFiles.length === 0) || (formData.is_digital && !formData.digital_file_url) || isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publier le produit
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
