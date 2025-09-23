/**
 * Interface de livraison ultra-moderne et simplifiée
 * Design glassmorphism avec workflow en une seule page
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Package, Truck, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';
import { LocationSearchResult } from '@/services/simpleLocationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface DeliveryData {
  pickupLocation: LocationSearchResult | null;
  deliveryLocation: LocationSearchResult | null;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  packageType: string;
  estimatedPrice: number;
}

const SERVICE_TYPES = {
  flash: { 
    name: 'Flash', 
    icon: '⚡', 
    description: 'Livraison express (1-2h)',
    basePrice: 5000,
    color: 'text-red-500'
  },
  flex: { 
    name: 'Flex', 
    icon: '📦', 
    description: 'Livraison standard (2-4h)',
    basePrice: 3000,
    color: 'text-blue-500'
  },
  maxicharge: { 
    name: 'MaxiCharge', 
    icon: '🚚', 
    description: 'Gros colis (4-6h)',
    basePrice: 8000,
    color: 'text-purple-500'
  }
};

const PACKAGE_TYPES = [
  'Documents', 'Électronique', 'Vêtements', 'Nourriture', 
  'Médicaments', 'Mobilier', 'Équipement', 'Autre'
];

export default function ModernDeliveryInterface({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) {
  const { toast } = useToast();
  const { getCurrentPosition, searchLocations, calculateDistance, formatDistance } = useSimpleLocation();
  
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickupLocation: null,
    deliveryLocation: null,
    serviceType: 'flex',
    packageType: 'Documents',
    estimatedPrice: 3000
  });

  const [expandedSection, setExpandedSection] = useState<string>('pickup');
  const [pickupQuery, setPickupQuery] = useState('');
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSearchResult[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<LocationSearchResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser la position actuelle
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  // Recherche pickup
  useEffect(() => {
    if (pickupQuery.length > 0) {
      searchLocations(pickupQuery, setPickupSuggestions);
    } else {
      setPickupSuggestions([]);
    }
  }, [pickupQuery, searchLocations]);

  // Recherche delivery
  useEffect(() => {
    if (deliveryQuery.length > 0) {
      searchLocations(deliveryQuery, setDeliverySuggestions);
    } else {
      setDeliverySuggestions([]);
    }
  }, [deliveryQuery, searchLocations]);

  // Calculer le prix quand les locations changent
  useEffect(() => {
    if (deliveryData.pickupLocation && deliveryData.deliveryLocation) {
      const distance = calculateDistance(
        deliveryData.pickupLocation,
        deliveryData.deliveryLocation
      );
      
      const basePrice = SERVICE_TYPES[deliveryData.serviceType].basePrice;
      const distancePrice = Math.max(0, (distance / 1000 - 1)) * 500; // 500 CDF par km après le premier
      const estimatedPrice = Math.round(basePrice + distancePrice);
      
      setDeliveryData(prev => ({ ...prev, estimatedPrice }));
    }
  }, [deliveryData.pickupLocation, deliveryData.deliveryLocation, deliveryData.serviceType, calculateDistance]);

  const handleLocationSelect = (location: LocationSearchResult, type: 'pickup' | 'delivery') => {
    if (type === 'pickup') {
      setDeliveryData(prev => ({ ...prev, pickupLocation: location }));
      setPickupQuery(location.title);
      setPickupSuggestions([]);
      setExpandedSection('delivery');
    } else {
      setDeliveryData(prev => ({ ...prev, deliveryLocation: location }));
      setDeliveryQuery(location.title);
      setDeliverySuggestions([]);
      setExpandedSection('service');
    }
  };

  const handleSubmit = async () => {
    if (!deliveryData.pickupLocation || !deliveryData.deliveryLocation) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner les adresses de collecte et de livraison",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const orderData = {
        user_id: user.id,
        pickup_location: deliveryData.pickupLocation.address,
        delivery_location: deliveryData.deliveryLocation.address,
        pickup_coordinates: {
          lat: deliveryData.pickupLocation.lat,
          lng: deliveryData.pickupLocation.lng
        },
        delivery_coordinates: {
          lat: deliveryData.deliveryLocation.lat,
          lng: deliveryData.deliveryLocation.lng
        },
        delivery_type: deliveryData.serviceType,
        package_type: deliveryData.packageType,
        estimated_price: deliveryData.estimatedPrice,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Delivery order created:', data);

      // Automatic driver assignment
      try {
        const { data: assignmentResult, error: assignmentError } = await supabase.functions.invoke('delivery-dispatcher', {
          body: {
            orderId: data.id,
            pickupLat: deliveryData.pickupLocation.lat,
            pickupLng: deliveryData.pickupLocation.lng,
            deliveryType: deliveryData.serviceType
          }
        });

        if (assignmentError) {
          console.error('❌ Driver assignment failed:', assignmentError);
          toast({
            title: "Commande créée",
            description: "Commande créée mais aucun livreur disponible pour le moment"
          });
        } else if (assignmentResult?.success) {
          console.log('✅ Driver assigned:', assignmentResult.driver);
          toast({
            title: "Commande créée",
            description: "Votre demande de livraison a été enregistrée et un livreur a été assigné"
          });
        } else {
          toast({
            title: "Commande créée",
            description: "Votre demande de livraison a été enregistrée avec succès"
          });
        }
      } catch (assignmentError) {
        console.error('❌ Assignment service error:', assignmentError);
        toast({
          title: "Commande créée",
          description: "Votre demande de livraison a été enregistrée avec succès"
        });
      }

      onSubmit(data);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionHeader = ({ 
    id, 
    title, 
    icon, 
    isCompleted, 
    isExpanded 
  }: { 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    isCompleted: boolean;
    isExpanded: boolean;
  }) => (
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors rounded-lg"
      onClick={() => setExpandedSection(isExpanded ? '' : id)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'
        }`}>
          {icon}
        </div>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {isCompleted && <Badge variant="secondary" className="text-xs">✓</Badge>}
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
    </div>
  );

  const LocationInput = ({ 
    value, 
    onChange, 
    suggestions, 
    onSelect, 
    placeholder,
    type
  }: {
    value: string;
    onChange: (value: string) => void;
    suggestions: LocationSearchResult[];
    onSelect: (location: LocationSearchResult) => void;
    placeholder: string;
    type: 'pickup' | 'delivery';
  }) => (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass-input"
      />
      
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-border/20 rounded-lg overflow-hidden z-50">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-border/10 last:border-b-0"
              onClick={() => onSelect(suggestion)}
            >
              <div className="font-medium text-foreground">{suggestion.title}</div>
              {suggestion.subtitle && (
                <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background/95 dark:to-background/90 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Livraison Express</h1>
          <p className="text-muted-foreground">Service de livraison rapide et fiable</p>
        </div>

        {/* Main Card */}
        <Card className="glass-card border-border/20 overflow-hidden">
          <div className="p-6 space-y-6">
            
            {/* Section Pickup */}
            <div className="space-y-4">
              <SectionHeader
                id="pickup"
                title="Point de collecte"
                icon={<MapPin className="w-4 h-4" />}
                isCompleted={!!deliveryData.pickupLocation}
                isExpanded={expandedSection === 'pickup'}
              />
              
              {expandedSection === 'pickup' && (
                <div className="pl-11 space-y-4 animate-fade-in">
                  <LocationInput
                    value={pickupQuery}
                    onChange={setPickupQuery}
                    suggestions={pickupSuggestions}
                    onSelect={(location) => handleLocationSelect(location, 'pickup')}
                    placeholder="Où récupérer le colis ?"
                    type="pickup"
                  />
                </div>
              )}
            </div>

            {/* Section Delivery */}
            <div className="space-y-4">
              <SectionHeader
                id="delivery"
                title="Point de livraison"
                icon={<Package className="w-4 h-4" />}
                isCompleted={!!deliveryData.deliveryLocation}
                isExpanded={expandedSection === 'delivery'}
              />
              
              {expandedSection === 'delivery' && (
                <div className="pl-11 space-y-4 animate-fade-in">
                  <LocationInput
                    value={deliveryQuery}
                    onChange={setDeliveryQuery}
                    suggestions={deliverySuggestions}
                    onSelect={(location) => handleLocationSelect(location, 'delivery')}
                    placeholder="Où livrer le colis ?"
                    type="delivery"
                  />
                </div>
              )}
            </div>

            {/* Section Service */}
            <div className="space-y-4">
              <SectionHeader
                id="service"
                title="Type de service"
                icon={<Truck className="w-4 h-4" />}
                isCompleted={true}
                isExpanded={expandedSection === 'service'}
              />
              
              {expandedSection === 'service' && (
                <div className="pl-11 space-y-4 animate-fade-in">
                  <div className="grid gap-3">
                    {Object.entries(SERVICE_TYPES).map(([key, service]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                          deliveryData.serviceType === key
                            ? 'border-primary bg-primary/5'
                            : 'border-border/20 glass-card hover:border-primary/30'
                        }`}
                        onClick={() => setDeliveryData(prev => ({ ...prev, serviceType: key as any }))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{service.icon}</span>
                            <div>
                              <div className={`font-medium ${service.color}`}>{service.name}</div>
                              <div className="text-sm text-muted-foreground">{service.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-foreground">{service.basePrice.toLocaleString()} CDF</div>
                            <div className="text-xs text-muted-foreground">+ distance</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packageType">Type de colis</Label>
                    <select
                      id="packageType"
                      value={deliveryData.packageType}
                      onChange={(e) => setDeliveryData(prev => ({ ...prev, packageType: e.target.value }))}
                      className="w-full p-3 rounded-lg glass-input border border-border/20 bg-background/20 text-foreground"
                    >
                      {PACKAGE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Résumé et Prix */}
            {deliveryData.pickupLocation && deliveryData.deliveryLocation && (
              <div className="glass-card border border-green-500/20 bg-green-500/5 p-4 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-400">Résumé de la commande</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">
                      {formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{SERVICE_TYPES[deliveryData.serviceType].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{deliveryData.packageType}</span>
                  </div>
                  <div className="border-t border-border/20 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Prix estimé:</span>
                      <span className="text-xl font-bold text-primary">
                        {deliveryData.estimatedPrice.toLocaleString()} CDF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1 glass-button"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!deliveryData.pickupLocation || !deliveryData.deliveryLocation || isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Commander la livraison'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}