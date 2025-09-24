import React, { useState } from 'react';
import { ArrowLeft, Plus, Heart, Star, Home, Building, MapPin, Navigation, Edit, Trash2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SavedAddress {
  id: string;
  label: string;
  address_line: string;
  city: string;
  commune?: string;
  quartier?: string;
  coordinates?: any;
  is_default: boolean;
  address_type: string;
  usage_count?: number;
  created_at: string;
}

export const MobileAddressManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const { 
    addresses, 
    saveAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress,
    incrementAddressUsage,
    isLoading 
  } = useSavedAddresses();

  const { getCurrentPosition } = useSimpleLocation();

  const [formData, setFormData] = useState({
    label: '',
    address_line: '',
    city: 'Kinshasa',
    commune: '',
    quartier: '',
    address_type: 'personal' as 'personal' | 'business',
    is_default: false,
    coordinates: null as any
  });

  const resetForm = () => {
    setFormData({
      label: '',
      address_line: '',
      city: 'Kinshasa',
      commune: '',
      quartier: '',
      address_type: 'personal',
      is_default: false,
      coordinates: null
    });
    setEditingAddress(null);
  };

  const handleUseCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const position = await getCurrentPosition();
      if (position) {
        setFormData(prev => ({
          ...prev,
          address_line: position.address,
          coordinates: { lat: position.lat, lng: position.lng }
        }));
        toast({
          title: "Position détectée",
          description: "Votre position actuelle a été utilisée.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible de détecter votre position. Vérifiez vos paramètres.",
        variant: "destructive",
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!formData.label || !formData.address_line) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir au moins le nom et l'adresse.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
      } else {
        await saveAddress(formData);
      }
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'adresse.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address_line: address.address_line,
      city: address.city,
      commune: address.commune || '',
      quartier: address.quartier || '',
      address_type: address.address_type as 'personal' | 'business',
      is_default: address.is_default,
      coordinates: address.coordinates
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      await deleteAddress(id);
    }
  };

  const toggleFavorite = async (address: SavedAddress) => {
    await setDefaultAddress(address.id);
  };

  const handleAddressClick = async (address: SavedAddress) => {
    try {
      // Incrémenter le compteur d'usage
      await incrementAddressUsage(address.id);
      
      // Naviguer vers l'interface taxi avec l'adresse pré-remplie
      navigate('/transport', {
        state: {
          prefilledAddress: {
            address: `${address.label} - ${address.address_line}`,
            lat: address.coordinates?.lat || -4.3217,
            lng: address.coordinates?.lng || 15.3069
          },
          addressType: 'pickup' // Utiliser comme point de départ par défaut
        }
      });
      
      toast({
        title: "Adresse sélectionnée",
        description: `${address.label} utilisée comme point de départ`,
      });
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'adresse:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner l'adresse",
        variant: "destructive",
      });
    }
  };

  const getUsageCount = (address: SavedAddress) => {
    return address.usage_count || 0;
  };

  // Trier les adresses par favoris puis par usage
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return (b.usage_count || 0) - (a.usage_count || 0);
  });

  const AddressCard = ({ address }: { address: SavedAddress }) => (
    <div 
      className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm cursor-pointer hover:bg-card/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      onClick={() => handleAddressClick(address)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="mt-1">
            {address.address_type === 'business' ? (
              <Building className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Home className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-foreground">{address.label}</h3>
              {address.is_default && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{address.address_line}</p>
            <p className="text-xs text-muted-foreground">
              {[address.quartier, address.commune, address.city].filter(Boolean).join(', ')}
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <Badge variant="secondary" className="text-xs">
                Utilisée {getUsageCount(address)} fois
              </Badge>
              <Badge variant={address.address_type === 'business' ? 'default' : 'outline'} className="text-xs">
                {address.address_type === 'business' ? 'Pro' : 'Perso'}
              </Badge>
            </div>
            
            {/* Bouton Commander un taxi visible */}
            <Button
              size="sm"
              className="w-full mt-3 bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                handleAddressClick(address);
              }}
            >
              <Car className="h-4 w-4 mr-2" />
              Commander un taxi
            </Button>
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(address);
            }}
            className="h-8 w-8 p-0"
          >
            <Heart className={`h-4 w-4 ${address.is_default ? 'text-red-500 fill-current' : 'text-muted-foreground'}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(address);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(address.id);
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile */}
      <div className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Mes adresses</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Bouton Ajouter */}
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Ajouter une adresse
        </Button>

        {/* Section Adresses Favorites */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Adresses favorites</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : addresses.length > 0 ? (
            <div className="space-y-3">
              {sortedAddresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune adresse</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez vos adresses fréquentes pour gagner du temps lors de vos commandes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajouter/Modifier Adresse */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Bouton Géolocalisation */}
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              className="w-full"
            >
              {isDetectingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Détection en cours...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Utiliser ma position actuelle
                </>
              )}
            </Button>

            <div>
              <Label htmlFor="label">Nom de l'adresse *</Label>
              <Input
                id="label"
                placeholder="Ex: Maison, Bureau, Gym..."
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Adresse complète *</Label>
              <Input
                id="address"
                placeholder="Numéro, avenue, rue..."
                value={formData.address_line}
                onChange={(e) => setFormData({...formData, address_line: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commune">Commune</Label>
                <Input
                  id="commune"
                  placeholder="Ex: Gombe"
                  value={formData.commune}
                  onChange={(e) => setFormData({...formData, commune: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="quartier">Quartier</Label>
                <Input
                  id="quartier"
                  placeholder="Ex: Socimat"
                  value={formData.quartier}
                  onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Type d'adresse</Label>
              <Select value={formData.address_type} onValueChange={(value: 'personal' | 'business') => setFormData({...formData, address_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personnelle</SelectItem>
                  <SelectItem value="business">Professionnelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="default"
                checked={formData.is_default}
                onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="default" className="text-sm">
                Définir comme adresse favorite
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={!formData.label || !formData.address_line}>
                {editingAddress ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};