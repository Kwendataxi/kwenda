import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, MessageCircle, Package, Truck, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  description: string;
  specifications?: Record<string, string>;
  inStock: boolean;
  stockCount: number;
  brand?: string;
  condition?: string;
}

interface MarketplaceProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: () => void;
  onStartChat: () => void;
  onCreateOrder: () => void;
}

export const MarketplaceProductDetails: React.FC<MarketplaceProductDetailsProps> = ({
  product,
  onBack,
  onAddToCart,
  onStartChat,
  onCreateOrder
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Image carousel with embla
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center'
  });

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b"
      >
        <div className="container mx-auto flex items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover-scale">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold flex-1 truncate">{product.name}</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="hover-scale"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="hover-scale">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Images (Desktop) / Full Width (Mobile) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Main Image Carousel */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {productImages.map((img, index) => (
                      <div key={index} className="flex-[0_0_100%] min-w-0">
                        <div className="aspect-square relative">
                          <img
                            src={img}
                            alt={`${product.name} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carousel Controls */}
                {productImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
                      onClick={scrollPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
                      onClick={scrollNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {productImages.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === selectedImageIndex 
                              ? 'bg-primary w-8' 
                              : 'bg-muted-foreground/30'
                          }`}
                          onClick={() => {
                            setSelectedImageIndex(index);
                            emblaApi?.scrollTo(index);
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="hidden sm:grid grid-cols-4 md:grid-cols-6 gap-2">
                {productImages.map((img, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      emblaApi?.scrollTo(index);
                    }}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Product Details Tabs (Mobile) */}
            <Card className="lg:hidden">
              <CardContent className="p-4">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="specs">Caractéristiques</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-4 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="specs" className="mt-4">
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="text-sm font-medium text-muted-foreground">{key}</span>
                            <span className="text-sm font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune spécification disponible
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Product Info & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Product Info Card */}
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Title & Category */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                      {product.name}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    {product.brand && <Badge variant="outline">{product.brand}</Badge>}
                    {product.condition && (
                      <Badge variant={product.condition === 'new' ? 'default' : 'secondary'}>
                        {product.condition === 'new' ? 'Neuf' : 'Occasion'}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews} avis)
                  </span>
                </div>

                <Separator />

                {/* Price */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Prix TTC</p>
                </div>

                <Separator />

                {/* Stock Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disponibilité</span>
                  </div>
                  <Badge variant={product.inStock ? 'default' : 'destructive'}>
                    {product.inStock 
                      ? `${product.stockCount} en stock` 
                      : 'Rupture de stock'}
                  </Badge>
                </div>

                {/* Quantity Selector */}
                {product.inStock && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantité</span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                          disabled={quantity >= product.stockCount}
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full hover-scale"
                        onClick={onCreateOrder}
                        size="lg"
                      >
                        Commander maintenant
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full hover-scale"
                        onClick={onAddToCart}
                        size="lg"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ajouter au panier
                      </Button>
                    </div>
                  </motion.div>
                )}

                <Separator />

                {/* Trust Badges */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Livraison rapide disponible</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vendeur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{product.seller}</p>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-success" />
                      <span className="text-xs text-muted-foreground">Vendeur vérifié</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={onStartChat} 
                  className="w-full hover-scale"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter le vendeur
                </Button>
              </CardContent>
            </Card>

            {/* Description & Specs (Desktop) */}
            <Card className="hidden lg:block">
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="specs">Spécifications</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-4 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="specs" className="mt-4">
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <motion.div 
                            key={key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-between items-center py-2 border-b last:border-b-0"
                          >
                            <span className="text-sm font-medium text-muted-foreground">{key}</span>
                            <span className="text-sm font-semibold">{value}</span>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune spécification disponible
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};