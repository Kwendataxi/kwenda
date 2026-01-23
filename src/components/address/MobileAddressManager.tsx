import React, { useState } from 'react';
import { ArrowLeft, Plus, Home, Building, MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AddressChip, AddressData } from './AddressChip';
import { coordinateService } from '@/services/coordinateService';
import { cn } from '@/lib/utils';

export const MobileAddressManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const { 
    addresses, 
    saveAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress,
    incrementAddressUsage,
    getAddressesByType,
    isLoading 
  } = useSavedAddresses();

  const { getCurrentPosition } = useSimpleLocation();
  
  // Google Places Autocomplete pour la recherche d'adresse
  const { predictions, isLoading: autocompleteLoading, search, getPlaceDetails, clearPredictions } = 
    useGooglePlacesAutocomplete({ debounceMs: 300 });
  const [showPredictions, setShowPredictions] = useState(false);

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
        description: "Impossible de détecter votre position.",
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
        description: "Veuillez remplir le nom et l'adresse.",
        variant: "destructive",
      });
      return;
    }

    // Valider/normaliser les coordonnées
    const normalizedCoords = coordinateService.normalize(formData.coordinates, formData.city);
    
    if (!normalizedCoords.isValid && !formData.coordinates) {
      toast({
        title: "Position recommandée",
        description: "Utilisez 'Ma position' ou recherchez une adresse précise pour une meilleure précision.",
      });
    }

    try {
      const addressToSave = {
        ...formData,
        coordinates: { lat: normalizedCoords.lat, lng: normalizedCoords.lng }
      };

      if (editingAddress) {
        await updateAddress(editingAddress.id, addressToSave);
      } else {
        await saveAddress(addressToSave);
      }
      resetForm();
      clearPredictions();
      setShowPredictions(false);
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'adresse.",
        variant: "destructive",
      });
    }
  };

  const handleAddressSearch = (value: string) => {
    setFormData({...formData, address_line: value});
    if (value.length >= 2) {
      search(value);
      setShowPredictions(true);
    } else {
      clearPredictions();
      setShowPredictions(false);
    }
  };

  const handleSelectPrediction = async (placeId: string, description: string) => {
    const details = await getPlaceDetails(placeId);
    if (details) {
      setFormData({
        ...formData,
        address_line: details.address,
        coordinates: { lat: details.coordinates.lat, lng: details.coordinates.lng }
      });
      toast({
        title: "Adresse sélectionnée",
        description: "Coordonnées GPS enregistrées.",
      });
    } else {
      setFormData({...formData, address_line: description});
    }
    setShowPredictions(false);
    clearPredictions();
  };

  const handleEdit = (address: AddressData) => {
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
    if (window.confirm('Supprimer cette adresse ?')) {
      await deleteAddress(id);
    }
  };

  const handleAddressClick = async (address: AddressData) => {
    try {
      // Vérifier coordonnées valides
      const hasValidCoords = address.coordinates &&
        typeof address.coordinates.lat === 'number' &&
        typeof address.coordinates.lng === 'number' &&
        !isNaN(address.coordinates.lat) &&
        !isNaN(address.coordinates.lng) &&
        Math.abs(address.coordinates.lat) > 0.01 &&
        Math.abs(address.coordinates.lng) > 0.01;

      let finalLat = address.coordinates?.lat;
      let finalLng = address.coordinates?.lng;

      // Si pas de coordonnées valides, utiliser fallback par ville
      if (!hasValidCoords) {
        const cityDefaults: Record<string, { lat: number; lng: number }> = {
          'Kinshasa': { lat: -4.3217, lng: 15.3069 },
          'Abidjan': { lat: 5.3497, lng: -3.9923 },
          'Lubumbashi': { lat: -11.6792, lng: 27.4716 },
          'Kolwezi': { lat: -10.7147, lng: 25.4665 }
        };
        const cityCoords = cityDefaults[address.city || 'Kinshasa'] || cityDefaults['Kinshasa'];
        finalLat = cityCoords.lat;
        finalLng = cityCoords.lng;
      }

      // Incrémenter usage
      await incrementAddressUsage(address.id);
      
      // Naviguer vers taxi avec destination pré-remplie
      navigate('/transport', {
        state: {
          prefilledAddress: {
            address: address.address_line,
            name: address.label,
            lat: finalLat,
            lng: finalLng
          },
          addressType: 'destination'
        }
      });
    } catch (error) {
      console.error('Erreur navigation vers taxi:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la navigation',
        variant: 'destructive'
      });
    }
  };

  const personalAddresses = getAddressesByType('personal') as AddressData[];
  const businessAddresses = getAddressesByType('business') as AddressData[];

  const labelSuggestions = ['Maison', 'Bureau', 'Travail', 'Gym', 'École'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0 -ml-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-medium text-foreground">Mes adresses</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Add button */}
        <button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Ajouter une adresse</span>
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : addresses.length > 0 ? (
          <div className="space-y-6">
            {/* Personal addresses */}
            {personalAddresses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>Personnelles</span>
                </div>
                <div className="space-y-2">
                  {personalAddresses.map((address) => (
                    <AddressChip
                      key={address.id}
                      address={address}
                      showActions
                      onClick={() => handleAddressClick(address)}
                      onEdit={() => handleEdit(address)}
                      onDelete={() => handleDelete(address.id)}
                      onSetDefault={() => setDefaultAddress(address.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Business addresses */}
            {businessAddresses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Professionnelles</span>
                </div>
                <div className="space-y-2">
                  {businessAddresses.map((address) => (
                    <AddressChip
                      key={address.id}
                      address={address}
                      showActions
                      onClick={() => handleAddressClick(address)}
                      onEdit={() => handleEdit(address)}
                      onDelete={() => handleDelete(address.id)}
                      onSetDefault={() => setDefaultAddress(address.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Aucune adresse</h3>
            <p className="text-sm text-muted-foreground">
              Ajoutez vos adresses fréquentes
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Geolocation button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              className="w-full h-11 rounded-xl border-dashed"
            >
              {isDetectingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Détection...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Utiliser ma position
                </>
              )}
            </Button>

            {/* Label suggestions */}
            {!editingAddress && (
              <div className="flex flex-wrap gap-2">
                {labelSuggestions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFormData({ ...formData, label })}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      formData.label === label
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nom</Label>
                <Input
                  placeholder="Ex: Maison"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  className="h-11 bg-muted/30 border-0 rounded-xl"
                />
              </div>
              
              <div className="relative">
                <Label className="text-xs text-muted-foreground">Adresse</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input
                    placeholder="Rechercher une adresse..."
                    value={formData.address_line}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    onFocus={() => formData.address_line.length >= 2 && setShowPredictions(true)}
                    className="h-11 pl-9 bg-muted/30 border-0 rounded-xl"
                  />
                  {autocompleteLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                  )}
                </div>
                
                {/* Suggestions dropdown */}
                {showPredictions && predictions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                    {predictions.map((prediction) => (
                      <button
                        key={prediction.placeId}
                        type="button"
                        onClick={() => handleSelectPrediction(prediction.placeId, prediction.description)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {prediction.structuredFormatting.mainText}
                          </p>
                          {prediction.structuredFormatting.secondaryText && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {prediction.structuredFormatting.secondaryText}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Indicateur de coordonnées valides */}
                {formData.coordinates && (
                  <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Coordonnées GPS enregistrées
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Commune</Label>
                  <Input
                    placeholder="Gombe"
                    value={formData.commune}
                    onChange={(e) => setFormData({...formData, commune: e.target.value})}
                    className="h-11 bg-muted/30 border-0 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quartier</Label>
                  <Input
                    placeholder="Socimat"
                    value={formData.quartier}
                    onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                    className="h-11 bg-muted/30 border-0 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={formData.address_type} onValueChange={(value: 'personal' | 'business') => setFormData({...formData, address_type: value})}>
                  <SelectTrigger className="h-11 bg-muted/30 border-0 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personnelle</SelectItem>
                    <SelectItem value="business">Professionnelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                  className="rounded border-muted-foreground/30"
                />
                <span className="text-sm text-muted-foreground">Adresse favorite</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 h-11 rounded-xl"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!formData.label || !formData.address_line}
                className="flex-1 h-11 rounded-xl"
              >
                {editingAddress ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
