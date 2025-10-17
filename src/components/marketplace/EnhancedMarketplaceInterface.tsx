import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Package, Store, User, Plus, ArrowLeft, ShoppingBag, ShoppingCart as CartIcon, Shield, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatProvider } from '@/components/chat/ChatProvider';

// Components
import { CategoryFilter } from './CategoryFilter';
import { SearchBar } from './SearchBar';
import { ImageUploadProgress, ImageUploadStatus } from './ImageUploadProgress';
import { CompactProductCard } from './CompactProductCard';
import { ProductGrid } from './ProductGrid';
import { UnifiedShoppingCart } from './cart/UnifiedShoppingCart';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { VendorStoreView } from './VendorStoreView';
import { ClientEscrowDashboard } from '../escrow/ClientEscrowDashboard';
import { SellProductForm } from './SellProductForm';
import { VendorDashboard } from './VendorDashboard';
import { HorizontalProductScroll } from './HorizontalProductScroll';
import { WalletBalance } from './WalletBalance';
import { DeliveryCalculator } from './DeliveryCalculator';
import { OrderTracker } from './OrderTracker';
import { AdvancedOrderTracker } from './AdvancedOrderTracker';
import { VerifiedSellerGuard } from './VerifiedSellerGuard';
import { AdvancedFilters } from './AdvancedFilters';

import { DeliveryFeeApprovalDialog } from './DeliveryFeeApprovalDialog';
import { EditProductForm } from './EditProductForm';

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserVerification } from '@/hooks/useUserVerification';
import { useWallet } from '@/hooks/useWallet';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  image: string;
  category: string;
  condition: string;
  description: string;
  seller_id: string;
  seller: { display_name: string };
  location: string;
  coordinates?: { lat: number; lng: number };
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviews: number;
  brand?: string;
  specifications?: Record<string, any>;
  viewCount?: number;
  salesCount?: number;
  popularityScore?: number;
  created_at?: string;
}

interface HorizontalProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  location?: { lat: number; lng: number };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
  seller_id: string;
  coordinates?: { lat: number; lng: number };
}

interface EnhancedMarketplaceInterfaceProps {
  onNavigate: (path: string) => void;
}

export const EnhancedMarketplaceInterface: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  return (
    <ChatProvider>
      <EnhancedMarketplaceContent onNavigate={onNavigate} />
    </ChatProvider>
  );
};

const EnhancedMarketplaceContent: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const geolocation = useGeolocation();
  const locationLoading = geolocation.loading;
  const coordinates = geolocation.latitude && geolocation.longitude ? { lat: geolocation.latitude, lng: geolocation.longitude } : null;
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useMarketplaceOrders();
  const { verification } = useUserVerification();
  const { wallet } = useWallet();
  const { startConversation } = useMarketplaceChat();
  
  // State management
  const [currentTab, setCurrentTab] = useState<'shop' | 'sell' | 'orders' | 'escrow' | 'vendor'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUploadStatuses, setImageUploadStatuses] = useState<ImageUploadStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  
  // Delivery fee approval
  const [pendingFeeOrder, setPendingFeeOrder] = useState<any | null>(null);
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedCategory: 'all',
    priceRange: [0, 2000000] as [number, number],
    minRating: 0,
    conditions: [] as string[],
    maxDistance: 50,
    availability: 'all' as 'all' | 'available' | 'unavailable',
    sortBy: 'popularity',
    showOnlyFavorites: false,
  });
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Hooks
  const ordersHook = useMarketplaceOrders();

  // Check for pending fee approval orders
  useEffect(() => {
    if (orders && orders.length > 0) {
      const pendingApproval = orders.find(o => o.status === 'pending_buyer_approval' && !o.delivery_fee_approved_by_buyer);
      if (pendingApproval && pendingApproval.id !== pendingFeeOrder?.id) {
        setPendingFeeOrder(pendingApproval);
        setIsFeeDialogOpen(true);
      }
    }
  }, [orders]);

  // Load products with optimized caching
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // ✅ FILTRE : Uniquement les produits approuvés visibles sur la marketplace
      // Tri par popularité (view_count + sales_count)
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('status', 'active')
        .eq('moderation_status', 'approved')  // ✅ Produits approuvés uniquement
        .order('popularity_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Handle empty data gracefully
      if (!data || data.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // ✅ PHASE 1.4 : Fonction de normalisation d'images
      const normalizeProductImages = (images: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) {
          return images.map(img => typeof img === 'string' ? img : String(img)).filter(Boolean);
        }
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [images];
          } catch {
            return [images];
          }
        }
        return [];
      };

      const transformedProducts = data.map(product => {
        const specsObj = product.specifications && typeof product.specifications === 'object' 
          ? product.specifications as Record<string, any>
          : {};
        
        const normalizedImages = normalizeProductImages(product.images);
        
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          images: normalizedImages,
          image: normalizedImages[0] || 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
          category: product.category,
          condition: product.condition || 'new',
          description: product.description || '',
          seller_id: product.seller_id,
          seller: { 
            display_name: t('marketplace.unknown_seller') // Will fetch from seller_profiles later
          },
          location: product.location || 'Kinshasa',
          coordinates: product.coordinates && typeof product.coordinates === 'object' 
            ? product.coordinates as { lat: number; lng: number }
            : undefined,
          inStock: (product.stock_count || 0) > 0,
          stockCount: product.stock_count || 0,
          rating: product.rating_average || 0,
          reviews: product.rating_count || 0,
          brand: product.brand,
          specifications: specsObj,
          viewCount: product.view_count || 0,
          salesCount: product.sales_count || 0,
          popularityScore: product.popularity_score || 0,
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Set empty products on error instead of showing error toast
      setProducts([]);
      
      // Only show toast for network errors, not empty results
      if (error instanceof Error && error.message !== 'No rows found') {
        toast({
          title: t('common.error'),
          description: 'Impossible de charger les produits. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter management functions
  const handleUpdateFilter = <K extends keyof typeof filters>(
    key: K, 
    value: typeof filters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedCategory: 'all',
      priceRange: [0, 2000000],
      minRating: 0,
      conditions: [],
      maxDistance: 50,
      availability: 'all',
      sortBy: 'popularity',
      showOnlyFavorites: false,
    });
  };

  const handleApplyQuickFilter = (preset: string) => {
    switch (preset) {
      case 'nearby':
        handleUpdateFilter('maxDistance', 5);
        break;
      case 'cheap':
        handleUpdateFilter('priceRange', [0, 50000]);
        handleUpdateFilter('sortBy', 'price_low');
        break;
      case 'premium':
        handleUpdateFilter('minRating', 4.5);
        handleUpdateFilter('sortBy', 'rating');
        break;
      case 'new':
        handleUpdateFilter('conditions', ['new']);
        break;
      case 'deals':
        handleUpdateFilter('priceRange', [0, 100000]);
        break;
    }
  };

  // Calculate filter stats
  const hasActiveFilters = 
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 2000000 ||
    filters.minRating > 0 ||
    filters.conditions.length > 0 ||
    filters.maxDistance < 50 ||
    filters.availability !== 'all' ||
    filters.showOnlyFavorites;

  const activeFiltersCount = [
    filters.priceRange[0] > 0 || filters.priceRange[1] < 2000000,
    filters.minRating > 0,
    filters.conditions.length > 0,
    filters.maxDistance < 50,
    filters.availability !== 'all',
    filters.showOnlyFavorites,
  ].filter(Boolean).length;

  const calculateAveragePrice = (prods: Product[]) => {
    if (prods.length === 0) return 0;
    return prods.reduce((sum, p) => sum + p.price, 0) / prods.length;
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Category filter
    const categoryMatch = filters.selectedCategory === 'all' || product.category === filters.selectedCategory;
    if (!categoryMatch) return false;

    // Search filter (from filters state + legacy searchQuery)
    const query = filters.searchQuery || searchQuery;
    if (query && !product.title.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }

    // Price filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }

    // Rating filter
    if (filters.minRating > 0 && product.rating < filters.minRating) {
      return false;
    }

    // Condition filter
    if (filters.conditions.length > 0 && !filters.conditions.includes(product.condition)) {
      return false;
    }

    // Availability filter
    if (filters.availability === 'available' && !product.inStock) {
      return false;
    }
    if (filters.availability === 'unavailable' && product.inStock) {
      return false;
    }

    // Distance filter
    if (filters.maxDistance < 50 && coordinates && product.coordinates) {
      const distance = calculateDistance(
        coordinates.lat, coordinates.lng,
        product.coordinates.lat, product.coordinates.lng
      );
      if (distance > filters.maxDistance) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch (filters.sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        if (coordinates && a.coordinates && b.coordinates) {
          const distA = calculateDistance(coordinates.lat, coordinates.lng, a.coordinates.lat, a.coordinates.lng);
          const distB = calculateDistance(coordinates.lat, coordinates.lng, b.coordinates.lat, b.coordinates.lng);
          return distA - distB;
        }
        return 0;
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'popularity':
      default:
        return (b.rating * b.reviews) - (a.rating * a.reviews);
    }
  });

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.title,
        price: product.price,
        image: product.image,
        quantity: 1,
        seller: product.seller.display_name || t('marketplace.unknown_seller'),
        seller_id: product.seller_id,
        coordinates: product.coordinates
      }]);
    }

    toast({
      title: t('marketplace.product_added'),
      description: t('marketplace.product_added_desc').replace('{0}', product.title),
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleProductSubmit = async (productData: any): Promise<boolean> => {
    console.log('📦 [Marketplace] Starting product submission');
    
    // ✅ Vérification authentification STRICTE
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      console.error('❌ [Marketplace] User not authenticated');
      toast({
        title: '❌ Non authentifié',
        description: 'Vous devez être connecté pour publier un produit',
        variant: 'destructive',
      });
      return false;
    }
    
    console.log('✅ [Marketplace] User authenticated:', user.id);
    console.log('📦 [Marketplace] Product data:', {
      title: productData.title,
      category: productData.category,
      price: productData.price,
      imagesCount: productData.images?.length || 0,
      sellerId: user.id
    });

    try {
      // ✅ Compression et validation d'image
      const compressImage = async (file: File): Promise<File> => {
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size <= MAX_SIZE) return file;

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d')!;
              
              const maxDim = 1920;
              let width = img.width;
              let height = img.height;
              
              if (width > height && width > maxDim) {
                height = (height * maxDim) / width;
                width = maxDim;
              } else if (height > maxDim) {
                width = (width * maxDim) / height;
                height = maxDim;
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                  } else {
                    reject(new Error('Compression failed'));
                  }
                },
                'image/jpeg',
                0.85
              );
            };
          };
        });
      };

      // ✅ Fonction helper pour retry upload avec timeout
      const uploadWithRetry = async (file: File, fileName: string, retries = 3) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const uploadPromise = supabase.storage
              .from('marketplace-products')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
              });

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Upload timeout')), 30000)
            );

            const { data, error } = await Promise.race([
              uploadPromise,
              timeoutPromise
            ]) as any;
          
            if (!error) {
              console.log(`✅ Upload réussi (tentative ${attempt + 1}): ${fileName}`);
              return { data, error: null };
            }
          
            if (attempt < retries) {
              const delay = 5000 * (attempt + 1);
              console.warn(`⚠️ Retry ${attempt + 1}/${retries} après ${delay}ms pour ${fileName}`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          
            return { data: null, error };
          } catch (err: any) {
            if (attempt < retries) {
              const delay = 5000 * (attempt + 1);
              console.warn(`⚠️ Exception retry ${attempt + 1}/${retries} après ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return { data: null, error: err };
          }
        }
        return { data: null, error: new Error('Max retries reached') };
      };

      // 1. Upload images to Supabase Storage
      const imageUrls: string[] = [];
      
      if (productData.images && productData.images.length > 0) {
        console.log(`📤 [Marketplace] Uploading ${productData.images.length} images`);
        toast({
          title: '📤 Upload des images...',
          description: `Upload de ${productData.images.length} image(s) en cours...`,
        });

        for (let i = 0; i < productData.images.length; i++) {
          const originalFile = productData.images[i];
          console.log(`📤 [Marketplace] Processing image ${i + 1}/${productData.images.length}:`, {
            name: originalFile.name,
            size: `${(originalFile.size / 1024).toFixed(2)} KB`,
            type: originalFile.type
          });

          // ✅ Validation taille
          if (originalFile.size > 5 * 1024 * 1024) {
            toast({
              title: '⚠️ Image trop volumineuse',
              description: `L'image ${i + 1} dépasse 5MB. Compression en cours...`,
            });
          }

          // ✅ Compression si nécessaire
          let file = originalFile;
          try {
            file = await compressImage(originalFile);
            console.log(`✅ Image ${i + 1} compressée: ${(file.size / 1024).toFixed(2)} KB`);
          } catch (compressError) {
            console.warn(`⚠️ Compression échouée pour image ${i + 1}, utilisation de l'original`);
          }
          
          // Generate unique filename avec préfixe products/
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/products/${Date.now()}-${i}.${fileExt}`;
          
          // ✅ Upload vers bucket marketplace-products avec retry avancé
          toast({
            title: `📤 Upload ${i + 1}/${productData.images.length}`,
            description: 'Upload en cours...',
          });

          const { data: uploadData, error: uploadError } = await uploadWithRetry(file, fileName);

          if (uploadError) {
            // Update status to error
            setImageUploadStatuses(prev => prev.map((status, idx) => 
              idx === i ? { ...status, status: 'error', error: uploadError.message } : status
            ));
            
            console.error('❌ [Marketplace] Image upload error:', {
              message: uploadError.message,
              fileName: fileName,
              userId: user.id,
              attempts: 'Max retries reached'
            });

            await supabase.from('activity_logs').insert({
              user_id: user.id,
              activity_type: 'product_image_upload_failed',
              description: `Échec upload image ${i + 1} pour produit "${productData.title}"`,
              metadata: {
                fileName,
                error: uploadError.message,
                fileSize: file.size,
                productTitle: productData.title
              }
            });

            console.warn(`⚠️ Continuing without image ${i + 1}`);
            continue;
          }

          // Get public URL depuis marketplace-products
          const { data: { publicUrl } } = supabase.storage
            .from('marketplace-products')
            .getPublicUrl(fileName);
          
          // Update status to success
          setImageUploadStatuses(prev => prev.map((status, idx) => 
            idx === i ? { ...status, status: 'success', progress: 100, url: publicUrl } : status
          ));
          
          console.log(`✅ [Marketplace] Image ${i + 1} uploaded:`, publicUrl);
          imageUrls.push(publicUrl);
        }
        console.log(`✅ [Marketplace] All ${imageUrls.length} images uploaded successfully`);
      }

      // 2. Create product in Supabase with uploaded image URLs
      console.log('💾 [Marketplace] Creating product in database');
      
      // ✅ Créer le produit même sans images (mode inactive)
      const hasFailedImages = imageUrls.length === 0 && productData.images && productData.images.length > 0;
      
      const productPayload = {
        title: productData.title,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        condition: productData.condition || 'new',
        images: imageUrls,
        seller_id: user.id,
        location: productData.location,
        coordinates: productData.coordinates,
        stock_count: productData.stock_count || 1,
        brand: productData.brand || null,
        specifications: productData.specifications || {},
        status: hasFailedImages ? 'inactive' : 'active',
        moderation_status: 'pending'
      };
      console.log('💾 [Marketplace] Product payload:', productPayload);
      
      if (hasFailedImages) {
        console.warn('⚠️ [Marketplace] Creating product as INACTIVE (no images uploaded)');
      }

      const { data, error } = await supabase
        .from('marketplace_products')
        .insert(productPayload)
        .select()
        .single();

      console.log('🧪 [DEBUG] Product insert result:', { data, error });

      if (error) {
        console.error('❌ [DEBUG] Product insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: '❌ Erreur de création',
          description: `${error.message} - Vérifiez les logs de la console`,
          variant: 'destructive',
        });
        return false;
      }

      console.log('✅ [DEBUG] Product created successfully:', {
        id: data.id,
        title: data.title,
        status: data.moderation_status,
        seller_id: data.seller_id
      });

      // Clear image upload statuses
      setImageUploadStatuses([]);

      // ✅ Notifications DIRECTES (sans Edge Function)
      console.log('📧 [Marketplace] Sending direct notifications');
      
      // 1. Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'product_created',
        description: `Produit créé: ${data.title}`,
        metadata: { product_id: data.id }
      });

      // 2. Notification admin DIRECTE
      const { error: adminNotifError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'product_moderation',
          severity: 'info',
          title: '📦 Nouveau produit à modérer',
          message: `${user.email} a publié "${data.title}" - ${data.price} CDF`,
          data: {
            product_id: data.id,
            seller_id: user.id
          }
        });
      
      if (adminNotifError) {
        console.error('❌ [Marketplace] Admin notification error:', adminNotifError);
      } else {
        console.log('✅ [Marketplace] Admin notification sent successfully');
      }

      // 3. Notification vendeur DIRECTE
      const { error: vendorNotifError } = await supabase
        .from('vendor_product_notifications')
        .insert({
          vendor_id: user.id,
          product_id: data.id,
          notification_type: 'product_submitted',
          title: '✅ Produit soumis',
          message: `Votre produit "${data.title}" est en cours de modération (24-48h)`,
          priority: 'normal',
          metadata: {
            product_id: data.id,
            product_title: data.title
          }
        });
      
      if (vendorNotifError) {
        console.error('❌ [Marketplace] Vendor notification error:', vendorNotifError);
      } else {
        console.log('✅ [Marketplace] Vendor notification sent successfully');
      }

      // 4. Toast de confirmation et redirection vers vendor
      toast({
        title: "✅ Produit soumis avec succès !",
        description: "Votre produit sera modéré sous 24-48h. Vous recevrez une notification.",
      });

      // 5. Redirection vers Vue vendeur
      setCurrentTab('vendor');

      // Reload products
      console.log('🔄 [Marketplace] Reloading products list');
      await loadProducts();
      
      console.log('✅ [Marketplace] Product submission completed successfully');
      return true;
      
    } catch (error: any) {
      console.error('❌ [Marketplace] Product submission failed:', error);
      console.error('❌ [Marketplace] Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      toast({
        title: '❌ Erreur de création',
        description: error.message || 'Impossible de créer le produit. Veuillez réessayer.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleCheckout = async () => {
    // Vider le panier local
    setCartItems([]);
    
    // Rafraîchir les commandes
    ordersHook.refetch();
    
    // Toast de confirmation
    toast({
      title: "✅ Commande validée",
      description: "Vos commandes ont été créées avec succès",
    });
  };

  // Product filtering and grouping
  const featuredProducts = filteredProducts.slice(0, 8);
  const popularProducts = filteredProducts.filter(p => p.rating >= 4.5).slice(0, 6);
  const nearbyProducts = filteredProducts.filter(p => p.coordinates).slice(0, 6);

  // Calcul des sous-ensembles de produits
  const trendingProducts = filteredProducts
    .filter(p => p.popularityScore && p.popularityScore > 200)
    .slice(0, 10);
  
  const newProducts = filteredProducts
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);
  
  const nearbyCalculated = coordinates
    ? filteredProducts
        .filter(p => p.coordinates)
        .sort((a, b) => {
          const distA = calculateDistance(coordinates.lat, coordinates.lng, a.coordinates!.lat, a.coordinates!.lng);
          const distB = calculateDistance(coordinates.lat, coordinates.lng, b.coordinates!.lat, b.coordinates!.lng);
          return distA - distB;
        })
        .slice(0, 10)
    : [];

  const convertToHorizontalProduct = (product: Product): HorizontalProduct => ({
    id: product.id,
    name: product.title,
    price: product.price,
    image: product.image,
    rating: product.rating || 0,
    reviewCount: product.reviews || 0,
    category: product.category,
    seller: product.seller?.display_name || 'Vendeur',
    sellerId: product.seller_id,
    isAvailable: product.inStock,
    location: product.coordinates,
  });

  const calculatePopularityScore = (product: Product) => {
    const views = product.viewCount || 0;
    const sales = product.salesCount || 0;
    const rating = product.rating || 0;
    return (views * 0.3) + (sales * 0.5) + (rating * 20);
  };

  const renderShopTab = () => (
    <div className="space-y-4">
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* SECTION TENDANCES */}
      {trendingProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <motion.h2 
              className="text-2xl font-bold flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <TrendingUp className="h-6 w-6 text-orange-500" />
              En Tendance
            </motion.h2>
            <Button variant="ghost" size="sm">Voir tout →</Button>
          </div>
          <HorizontalProductScroll
            title="En Tendance"
            products={trendingProducts.map(p => convertToHorizontalProduct(p))}
            onAddToCart={(product) => {
              const originalProduct = trendingProducts.find(p => p.id === product.id);
              if (originalProduct) addToCart(originalProduct);
            }}
            onViewDetails={(product) => {
              const originalProduct = trendingProducts.find(p => p.id === product.id);
              if (originalProduct) {
                setSelectedProduct(originalProduct);
                setIsProductDetailsOpen(true);
              }
            }}
            onViewSeller={setSelectedVendorId}
            userLocation={coordinates}
            autoScroll={true}
          />
        </section>
      )}

      {/* SECTION NOUVEAUTÉS */}
      {newProducts.length > 0 && (
        <section>
          <motion.h2 
            className="text-2xl font-bold flex items-center gap-2 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Sparkles className="h-6 w-6 text-purple-500" />
            Nouveautés
          </motion.h2>
          <ProductGrid
            products={newProducts.slice(0, 8).map(p => convertToHorizontalProduct(p))}
            onAddToCart={(product) => {
              const originalProduct = newProducts.find(p => p.id === product.id);
              if (originalProduct) addToCart(originalProduct);
            }}
            onViewDetails={(product) => {
              const originalProduct = newProducts.find(p => p.id === product.id);
              if (originalProduct) {
                setSelectedProduct(originalProduct);
                setIsProductDetailsOpen(true);
              }
            }}
            onViewSeller={setSelectedVendorId}
            userLocation={coordinates}
          />
        </section>
      )}

      {/* SECTION PRÈS DE VOUS - seulement si >3 produits */}
      {nearbyCalculated.length > 3 && (
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-green-500" />
            Près de chez vous
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {nearbyCalculated.slice(0, 4).map(p => {
              const converted = convertToHorizontalProduct(p);
              return (
                <CompactProductCard 
                  key={converted.id} 
                  product={converted}
                  onAddToCart={() => {
                    const originalProduct = nearbyCalculated.find(pr => pr.id === p.id);
                    if (originalProduct) addToCart(originalProduct);
                  }}
                  onViewDetails={() => {
                    setSelectedProduct(p);
                    setIsProductDetailsOpen(true);
                  }}
                  onViewSeller={setSelectedVendorId}
                  userLocation={coordinates}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* TOUS LES PRODUITS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Tous les produits</h2>
          
          {/* Tri rapide */}
          <select 
            value={filters.sortBy} 
            onChange={(e) => setFilters(prev => ({...prev, sortBy: e.target.value}))}
            className="h-8 text-xs border rounded-md px-2 bg-background"
          >
            <option value="popularity">Popularité</option>
            <option value="price_low">Prix croissant</option>
            <option value="price_high">Prix décroissant</option>
            <option value="rating">Meilleures notes</option>
            <option value="newest">Plus récents</option>
          </select>
        </div>
        <ProductGrid
          products={filteredProducts.map(p => convertToHorizontalProduct(p))}
          onAddToCart={(product) => {
            const originalProduct = filteredProducts.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = filteredProducts.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
            }
          }}
          onViewSeller={setSelectedVendorId}
          userLocation={coordinates}
          loading={loading}
        />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background mobile-safe-layout">
      {/* Modern Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('/client')} className="touch-manipulation">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Kwenda Shop
            </h1>
            <p className="text-xs text-muted-foreground">Marketplace sécurisé</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative touch-manipulation"
            onClick={() => setIsCartOpen(true)}
          >
            <Package className="w-5 h-5" />
            {cartItems.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-primary animate-pulse">
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 content-scrollable">
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="shop" className="flex items-center gap-1 touch-manipulation">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Boutique</span>
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-1 touch-manipulation">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Vendre</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 touch-manipulation">
              <CartIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="escrow" className="flex items-center gap-1 touch-manipulation">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Escrow</span>
            </TabsTrigger>
            <TabsTrigger value="vendor" className="flex items-center gap-1 touch-manipulation">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Vendeur</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-4">
            {renderShopTab()}
          </TabsContent>

          <TabsContent value="sell" className="mt-4">
            <VerifiedSellerGuard>
              <div className="space-y-6">
                <SellProductForm
                  onBack={() => setCurrentTab('shop')}
                  onSubmit={async (formData) => {
                    // Handle product creation with auto-location
                    const success = await handleProductSubmit({
                      ...formData,
                      coordinates: coordinates,
                      location: 'Kinshasa'
                    });
                    
                     if (success) {
                      toast({
                        title: '✅ Produit soumis avec succès!',
                        description: 'Votre produit est en cours de modération. Vous serez notifié dès validation.',
                        duration: 5000,
                      });
                      
                      // Redirection automatique après 2 secondes
                      setTimeout(() => {
                        setCurrentTab('vendor');
                      }, 2000);
                    }
                    return success;
                  }}
                />
                
                {/* Image Upload Progress */}
                {imageUploadStatuses.length > 0 && (
                  <ImageUploadProgress
                    images={imageUploadStatuses}
                    onRemove={(index) => {
                      setImageUploadStatuses(prev => prev.filter((_, i) => i !== index));
                    }}
                  />
                )}
              </div>
            </VerifiedSellerGuard>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <AdvancedOrderTracker />
          </TabsContent>

          <TabsContent value="escrow" className="mt-4">
            <ClientEscrowDashboard />
          </TabsContent>

          <TabsContent value="vendor" className="mt-4">
            {editingProduct ? (
              <EditProductForm
                product={editingProduct}
                onBack={() => setEditingProduct(null)}
                onUpdate={() => {
                  setEditingProduct(null);
                  loadProducts();
                }}
              />
            ) : (
              <VendorDashboard 
                onProductUpdate={loadProducts}
                onEditProduct={(product) => setEditingProduct(product)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Unified Shopping Cart (Sprint 1) */}
      <UnifiedShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        userCoordinates={coordinates}
      />

      {/* Product Details Dialog */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={{
            id: selectedProduct.id,
            name: selectedProduct.title,
            price: selectedProduct.price,
            image: selectedProduct.image,
            rating: selectedProduct.rating,
            reviewCount: selectedProduct.reviews,
            category: selectedProduct.category,
            seller: selectedProduct.seller.display_name,
            sellerId: selectedProduct.seller_id,
            isAvailable: selectedProduct.inStock,
            description: selectedProduct.description,
            location: selectedProduct.coordinates,
            brand: 'HP', // TODO: Add to product data
            condition: selectedProduct.condition,
            stockCount: selectedProduct.stockCount,
            specifications: {
              'Processeur': 'Intel Core i5',
              'RAM': '8GB DDR4',
              'Stockage': '256GB SSD',
              'Écran': '15.6" Full HD'
            } // TODO: Add to product data
          }}
          isOpen={isProductDetailsOpen}
          onClose={() => {
            setIsProductDetailsOpen(false);
            setSelectedProduct(null);
          }}
          onAddToCart={(product) => {
            if (selectedProduct) addToCart(selectedProduct);
          }}
          onViewSeller={(sellerId) => setSelectedVendorId(sellerId)}
          similarProducts={
            products
              .filter(p => 
                p.category === selectedProduct.category && 
                p.id !== selectedProduct.id &&
                p.seller_id !== selectedProduct.seller_id
              )
              .slice(0, 10)
              .map(p => ({
                id: p.id,
                name: p.title,
                price: p.price,
                image: p.image,
                rating: p.rating,
                reviewCount: p.reviews,
                category: p.category,
                seller: p.seller.display_name,
                sellerId: p.seller_id,
                isAvailable: p.inStock,
                location: p.coordinates
              }))
          }
          sellerProducts={
            products
              .filter(p => 
                p.seller_id === selectedProduct.seller_id && 
                p.id !== selectedProduct.id
              )
              .slice(0, 10)
              .map(p => ({
                id: p.id,
                name: p.title,
                price: p.price,
                image: p.image,
                rating: p.rating,
                reviewCount: p.reviews,
                category: p.category,
                seller: p.seller.display_name,
                sellerId: p.seller_id,
                isAvailable: p.inStock,
                location: p.coordinates
              }))
          }
          userLocation={coordinates}
        />
      )}

      {/* Vendor Store View */}
      {selectedVendorId && (
        <VendorStoreView
          vendorId={selectedVendorId}
          onClose={() => setSelectedVendorId(null)}
          onAddToCart={(product) => {
            // Find the original product and add to cart
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
              setSelectedVendorId(null);
            }
          }}
          userLocation={coordinates}
        />
      )}

      {/* Delivery Fee Approval Dialog */}
      {pendingFeeOrder && (
        <DeliveryFeeApprovalDialog
          order={pendingFeeOrder}
          open={isFeeDialogOpen}
          onOpenChange={setIsFeeDialogOpen}
          onApproved={() => {
            setIsFeeDialogOpen(false);
            setPendingFeeOrder(null);
            refetchOrders();
            toast({ title: "✅ Paiement confirmé", description: "Votre commande sera bientôt livrée" });
          }}
          onOpenChat={async () => {
            const conversationId = await startConversation(pendingFeeOrder.product_id, pendingFeeOrder.seller_id);
            if (conversationId) {
              setIsFeeDialogOpen(false);
              toast({ title: "Chat ouvert", description: "Discutez avec le vendeur" });
            }
          }}
        />
      )}

      {/* Advanced Filters Panel */}
      <AdvancedFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onUpdateFilter={handleUpdateFilter}
        onResetFilters={handleResetFilters}
        onApplyQuickFilter={handleApplyQuickFilter}
        hasActiveFilters={hasActiveFilters}
        filterStats={{
          totalProducts: products.length,
          filteredCount: filteredProducts.length,
          averagePrice: calculateAveragePrice(filteredProducts),
        }}
      />

    </div>
  );
};

export default EnhancedMarketplaceInterface;
